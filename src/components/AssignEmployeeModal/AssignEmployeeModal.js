import React, { useEffect, useMemo, useState } from "react";
import "./AssignEmployeeModal.css";
import EmployeeTypeOfProblemServerApi from "../../apiServices/employeeTypeOfProblemApi";
import EmployeeRequestsServerApi from "../../apiServices/employeeRequestsApi";

/**
 * props:
 * - isOpen: bool
 * - onClose: () => void
 * - requestId: string | null
 * - problemId: string | null
 * - onAssigned: () => void
 */
const AssignEmployeeModal = ({
  isOpen,
  onClose,
  requestId,
  problemId,
  onAssigned,
}) => {
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const employeeTypeApi = useMemo(
    () => new EmployeeTypeOfProblemServerApi(),
    [],
  );
  const employeeRequestsApi = useMemo(
    () => new EmployeeRequestsServerApi(),
    [],
  );

  const fetchAssigned = async () => {
    if (!requestId) {
      setAssignedEmployees([]);
      return;
    }

    setIsLoadingAssigned(true);
    try {
      const res = await employeeRequestsApi.GetEmployeesForRequest(
        requestId,
        1,
        20,
      );

      if (res.success && Array.isArray(res.employees)) {
        const mapped = res.employees.map((item) => {
          const emp = item.employee || {};
          const user = emp.user || {};
          return {
            id: emp.id,
            fullName: user.fullName || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
            assignmentStatus: item.assignmentStatus,
          };
        });

        setAssignedEmployees(mapped);
      } else {
        setAssignedEmployees([]);
      }
    } catch (err) {
      console.error("Load assigned employees error:", err);
      setAssignedEmployees([]);
    } finally {
      setIsLoadingAssigned(false);
    }
  };

  const fetchCandidates = async () => {
    if (!isOpen || !problemId) {
      setCandidates([]);
      return;
    }

    setIsLoadingCandidates(true);
    try {
      const res = await employeeTypeApi.GetEmployees(
        problemId,
        pageNumber,
        pageSize,
      );

      if (res.success && Array.isArray(res.employees)) {
        const mappedRaw = res.employees.map((etp) => {
          const emp = etp.employee || {};
          const user = emp.user || {};

          return {
            id: emp.id,
            fullName: user.fullName || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
            isAvailable: emp.isAvailable,
            skills: etp.skills,
            desire: etp.desire,
          };
        });

        const assignedIds = new Set(assignedEmployees.map((a) => a.id));
        const filtered = mappedRaw.filter(
          (e) => e.isAvailable && !assignedIds.has(e.id),
        );

        setCandidates(filtered);

        if (res.pagination) {
          setTotalPages(res.pagination.TotalPages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        setCandidates([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Load candidates error:", err);
      setCandidates([]);
      setTotalPages(1);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setSelectedEmployeeId(null);
    setPageNumber(1);
    fetchAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestId, problemId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pageNumber, problemId, assignedEmployees]);

  if (!isOpen) return null;

  const handleAssignClick = async () => {
    if (!selectedEmployeeId || !requestId) return;

    if (assignedEmployees.length >= 4) {
      alert("На заявку уже назначено максимальное количество сотрудников (4).");
      return;
    }

    try {
      setIsAssigning(true);

      const res = await employeeRequestsApi.AssignEmployeeToRequest(
        requestId,
        selectedEmployeeId,
        "Назначен менеджером",
      );

      if (!res.success) {
        alert(res.message || "Не удалось назначить сотрудника");
      } else {
        await fetchAssigned();
        if (onAssigned) {
          await onAssigned();
        }
      }
    } catch (err) {
      console.error("Assign modal error:", err);
      alert("Ошибка при назначении сотрудника");
    } finally {
      setIsAssigning(false);
      setSelectedEmployeeId(null);
    }
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && pageNumber > 1) {
      setPageNumber((p) => p - 1);
    } else if (direction === "next" && pageNumber < totalPages) {
      setPageNumber((p) => p + 1);
    }
  };

  return (
    <div className="assign-employee-modal">
      <div className="assign-overlay" onClick={onClose}>
        <div className="assign-card" onClick={(e) => e.stopPropagation()}>
          <div className="assign-header">
            <div>
              <h3 className="assign-title">Назначить исполнителя</h3>
              <p className="assign-subtitle">
                Доступные сотрудники по типу проблемы и уже назначенные на
                заявку
              </p>
            </div>

            <button className="assign-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="assign-content">
            <div className="assign-section-title">Уже назначены</div>

            {isLoadingAssigned ? (
              <div className="assign-empty">Загрузка назначенных...</div>
            ) : assignedEmployees.length === 0 ? (
              <div className="assign-empty">
                На заявку пока никто не назначен.
              </div>
            ) : (
              <div className="assign-list">
                {assignedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="assign-item assign-item-assigned"
                  >
                    <div className="assign-item-content">
                      <div className="assign-emp-name">
                        {emp.fullName || "Без имени"}
                      </div>
                      <div className="assign-emp-role">
                        Статус назначения: {emp.assignmentStatus}
                      </div>
                      <div className="assign-emp-location">
                        {emp.email} • {emp.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="assign-section-title">Доступные кандидаты</div>

            {isLoadingCandidates ? (
              <div className="assign-empty">Загрузка кандидатов...</div>
            ) : candidates.length === 0 ? (
              <div className="assign-empty">
                Нет доступных сотрудников для этого типа проблемы.
              </div>
            ) : (
              <div className="assign-list">
                {candidates.map((emp) => (
                  <label
                    key={emp.id}
                    className={
                      "assign-item" +
                      (selectedEmployeeId === emp.id
                        ? " assign-item-selected"
                        : "")
                    }
                  >
                    <input
                      type="radio"
                      name="selectedEmployee"
                      value={emp.id}
                      checked={selectedEmployeeId === emp.id}
                      onChange={() => setSelectedEmployeeId(emp.id)}
                    />

                    <div className="assign-item-content">
                      <div className="assign-emp-name">
                        {emp.fullName || "Без имени"}
                      </div>
                      <div className="assign-emp-role">
                        Навыки: {emp.skills} • Желание: {emp.desire}
                      </div>
                      <div className="assign-emp-location">
                        {emp.email} • {emp.phone}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="assign-pagination">
              <button
                className="assign-page-btn"
                disabled={pageNumber === 1 || isLoadingCandidates}
                onClick={() => handlePageChange("prev")}
              >
                &lt;
              </button>

              <span className="assign-page-info">
                Стр. {pageNumber} из {totalPages}
              </span>

              <button
                className="assign-page-btn"
                disabled={pageNumber === totalPages || isLoadingCandidates}
                onClick={() => handlePageChange("next")}
              >
                &gt;
              </button>
            </div>
          )}

          <div className="assign-footer">
            <button
              type="button"
              className="assign-btn assign-btn-secondary"
              onClick={onClose}
              disabled={isAssigning}
            >
              Отмена
            </button>

            <button
              type="button"
              className="assign-btn assign-btn-primary"
              onClick={handleAssignClick}
              disabled={
                !selectedEmployeeId ||
                isAssigning ||
                assignedEmployees.length >= 4
              }
            >
              {isAssigning ? "Назначение..." : "Назначить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignEmployeeModal;
