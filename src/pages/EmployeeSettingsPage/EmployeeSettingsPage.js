import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./EmployeeSettingsPage.css";
import { toast } from "react-toastify";
import EmployeeTypeOfProblemServerApi from "../../apiServices/employeeTypeOfProblemApi";
import EmployeeWorkspacesModal from "../../components/EmployeeWorkspacesModal/EmployeeWorkspacesModal";

const ASSIGNED_PAGE_SIZE = 3;

function EmployeeSettingsPage() {
  const [searchParams] = useSearchParams();

  const employeeId =
    searchParams.get("employeeId") || "66666666-6666-6666-6666-666666666666";

  const fullName = searchParams.get("fullName") || "Иванов Иван Иванович";

  const api = useMemo(() => new EmployeeTypeOfProblemServerApi(), []);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [assignedProblemTypes, setAssignedProblemTypes] = useState([]);
  const [allProblemTypes, setAllProblemTypes] = useState([]);

  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingAllTypes, setLoadingAllTypes] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [selectedProblemTypeId, setSelectedProblemTypeId] = useState("");
  const [skills, setSkills] = useState(0);
  const [desire, setDesire] = useState(0);

  const [pageError, setPageError] = useState("");

  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPagination, setAssignedPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: ASSIGNED_PAGE_SIZE,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });

  const employee = useMemo(
    () => ({
      id: employeeId,
      fullName,
      name: fullName,
    }),
    [employeeId, fullName],
  );

  const getTotalPagesFrom = (pagination) => {
    return (
      pagination?.TotalPages ??
      pagination?.totalPages ??
      pagination?.total_pages ??
      1
    );
  };

  const getCurrentPageFrom = (pagination) => {
    return (
      pagination?.CurrentPage ??
      pagination?.currentPage ??
      pagination?.current_page ??
      assignedPage
    );
  };

  const getTotalCountFrom = (pagination, fallbackLength = 0) => {
    return (
      pagination?.TotalCount ??
      pagination?.totalCount ??
      pagination?.total_count ??
      fallbackLength
    );
  };

  const getPageSizeFrom = (pagination) => {
    return (
      pagination?.PageSize ??
      pagination?.pageSize ??
      pagination?.page_size ??
      ASSIGNED_PAGE_SIZE
    );
  };

  const getHasPreviousFrom = (pagination, currentPage) => {
    if (pagination?.HasPrevious != null) return pagination.HasPrevious;
    if (pagination?.hasPrevious != null) return pagination.hasPrevious;
    return currentPage > 1;
  };

  const getHasNextFrom = (pagination, currentPage, totalPages) => {
    if (pagination?.HasNext != null) return pagination.HasNext;
    if (pagination?.hasNext != null) return pagination.hasNext;
    return currentPage < totalPages;
  };

  const loadAssignedProblemTypes = async (page = assignedPage) => {
    if (!employeeId) return;

    setLoadingAssigned(true);
    setPageError("");

    try {
      const res = await api.getEmployeeProblemTypes(
        employeeId,
        page,
        ASSIGNED_PAGE_SIZE,
      );

      if (!res.success) {
        setAssignedProblemTypes([]);
        setAssignedPagination({
          CurrentPage: 1,
          TotalPages: 1,
          PageSize: ASSIGNED_PAGE_SIZE,
          TotalCount: 0,
          HasPrevious: false,
          HasNext: false,
        });
        setPageError(
          res.message || "Не удалось загрузить назначенные типы проблем",
        );
        return;
      }

      const items = Array.isArray(res.data) ? res.data : [];
      const pagination = res.pagination || {};

      const currentPage = getCurrentPageFrom(pagination);
      const totalPages = getTotalPagesFrom(pagination);
      const totalCount = getTotalCountFrom(pagination, items.length);
      const pageSize = getPageSizeFrom(pagination);

      setAssignedProblemTypes(items);
      setAssignedPagination({
        CurrentPage: currentPage,
        TotalPages: totalPages,
        PageSize: pageSize,
        TotalCount: totalCount,
        HasPrevious: getHasPreviousFrom(pagination, currentPage),
        HasNext: getHasNextFrom(pagination, currentPage, totalPages),
      });
    } catch (error) {
      console.error(error);
      setAssignedProblemTypes([]);
      setAssignedPagination({
        CurrentPage: 1,
        TotalPages: 1,
        PageSize: ASSIGNED_PAGE_SIZE,
        TotalCount: 0,
        HasPrevious: false,
        HasNext: false,
      });
      setPageError("Ошибка загрузки назначенных типов проблем");
    } finally {
      setLoadingAssigned(false);
    }
  };

  const loadAllProblemTypes = async () => {
    setLoadingAllTypes(true);

    try {
      const res = await api.getAllProblemTypes();

      if (!res.success) {
        setAllProblemTypes([]);
        toast.error(res.message || "Не удалось загрузить все типы проблем");
        return;
      }

      setAllProblemTypes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setAllProblemTypes([]);
      toast.error("Ошибка загрузки списка типов проблем");
    } finally {
      setLoadingAllTypes(false);
    }
  };

  useEffect(() => {
    setAssignedPage(1);
  }, [employeeId]);

  useEffect(() => {
    loadAssignedProblemTypes(assignedPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, assignedPage]);

  useEffect(() => {
    loadAllProblemTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const assignedTypeIds = useMemo(
    () =>
      new Set(
        assignedProblemTypes.map((x) => x?.typeOfProblem?.id).filter(Boolean),
      ),
    [assignedProblemTypes],
  );

  const availableProblemTypes = useMemo(() => {
    return allProblemTypes.filter((type) => !assignedTypeIds.has(type.id));
  }, [allProblemTypes, assignedTypeIds]);

  const normalizeRate = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.min(5, numeric));
  };

  const resetAssignForm = () => {
    setSelectedProblemTypeId("");
    setSkills(0);
    setDesire(0);
  };

  const handleAssignProblemType = async (e) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error("Не найден employeeId");
      return;
    }

    if (!selectedProblemTypeId) {
      toast.error("Выберите тип проблемы");
      return;
    }

    const payload = {
      skills: normalizeRate(skills),
      desire: normalizeRate(desire),
    };

    setSubmittingAssign(true);

    try {
      const res = await api.assignProblemType(
        employeeId,
        selectedProblemTypeId,
        payload,
      );

      if (!res.success) {
        toast.error(res.message || "Не удалось назначить тип проблемы");
        return;
      }

      toast.success("Тип проблемы успешно назначен");
      resetAssignForm();
      setAssignedPage(1);
      await loadAssignedProblemTypes(1);
      await loadAllProblemTypes();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при назначении типа проблемы");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleDeleteAssignedProblemType = async (assignment) => {
    const assignmentId = assignment?.id;
    const typeOfProblemId = assignment?.typeOfProblem?.id;

    if (!assignmentId || !typeOfProblemId) {
      toast.error("Недостаточно данных для удаления");
      return;
    }

    const confirmed = window.confirm(
      `Удалить тип проблемы "${assignment?.typeOfProblem?.title || "Без названия"}" у сотрудника?`,
    );

    if (!confirmed) return;

    setDeletingId(assignmentId);

    try {
      const res = await api.deleteEmployeeProblemType(
        employeeId,
        typeOfProblemId,
        assignmentId,
      );

      if (!res.success) {
        toast.error(res.message || "Не удалось удалить назначение");
        return;
      }

      toast.success("Назначение успешно удалено");

      const nextPage =
        assignedProblemTypes.length === 1 && assignedPage > 1
          ? assignedPage - 1
          : assignedPage;

      setAssignedPage(nextPage);
      await loadAssignedProblemTypes(nextPage);
      await loadAllProblemTypes();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при удалении назначения");
    } finally {
      setDeletingId("");
    }
  };

  const renderRateOptions = () => {
    const values = [0, 1, 2, 3, 4, 5];
    return values.map((value) => (
      <option key={value} value={value}>
        {value}
      </option>
    ));
  };

  const handleAssignedPageChange = (direction) => {
    if (direction === "prev" && assignedPagination.HasPrevious) {
      setAssignedPage((prev) => prev - 1);
    }

    if (direction === "next" && assignedPagination.HasNext) {
      setAssignedPage((prev) => prev + 1);
    }
  };

  return (
    <div className="employee-settings-page">
      <div className="employee-settings-page__container">
        <header className="employee-settings-page__header">
          <div>
            <div className="employee-settings-page__eyebrow">
              Настройка сотрудника
            </div>
            <h1 className="employee-settings-page__title">{fullName}</h1>
            <div className="employee-settings-page__subtitle">
              ID сотрудника: {employeeId}
            </div>
          </div>

          <div className="employee-settings-page__header-actions">
            <button
              type="button"
              className="employee-settings-page__btn employee-settings-page__btn--primary"
              onClick={() => setWorkspaceOpen(true)}
            >
              Управление рабочими зонами
            </button>
          </div>
        </header>

        <section className="employee-settings-page__section">
          <div className="employee-settings-page__section-head employee-settings-page__section-head--column">
            <div>
              <h2 className="employee-settings-page__section-title">
                Типы проблем сотрудника
              </h2>
              <p className="employee-settings-page__section-text">
                Здесь можно назначить сотруднику типы проблем, которые он может
                решать, а также указать уровень навыков и желания.
              </p>
            </div>

            {pageError ? (
              <div className="employee-settings-page__error">{pageError}</div>
            ) : null}
          </div>

          <div className="employee-settings-page__grid">
            <div className="employee-settings-page__card">
              <div className="employee-settings-page__card-title">
                Назначить новый тип проблемы
              </div>

              <form
                className="employee-settings-page__form"
                onSubmit={handleAssignProblemType}
              >
                <div className="employee-settings-page__field">
                  <label className="employee-settings-page__label">
                    Тип проблемы
                  </label>
                  <select
                    className="employee-settings-page__select"
                    value={selectedProblemTypeId}
                    onChange={(e) => setSelectedProblemTypeId(e.target.value)}
                    disabled={loadingAllTypes || submittingAssign}
                  >
                    <option value="">-- Выберите тип проблемы --</option>
                    {availableProblemTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.title} ({type.basePriority})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="employee-settings-page__field-row">
                  <div className="employee-settings-page__field">
                    <label className="employee-settings-page__label">
                      Навыки (skills)
                    </label>
                    <select
                      className="employee-settings-page__select"
                      value={skills}
                      onChange={(e) => setSkills(Number(e.target.value))}
                      disabled={submittingAssign}
                    >
                      {renderRateOptions()}
                    </select>
                  </div>

                  <div className="employee-settings-page__field">
                    <label className="employee-settings-page__label">
                      Желание (desire)
                    </label>
                    <select
                      className="employee-settings-page__select"
                      value={desire}
                      onChange={(e) => setDesire(Number(e.target.value))}
                      disabled={submittingAssign}
                    >
                      {renderRateOptions()}
                    </select>
                  </div>
                </div>

                {selectedProblemTypeId ? (
                  <div className="employee-settings-page__selected-info">
                    {(() => {
                      const selected = availableProblemTypes.find(
                        (x) => x.id === selectedProblemTypeId,
                      );

                      if (!selected) return null;

                      return (
                        <>
                          <div className="employee-settings-page__selected-title">
                            {selected.title}
                          </div>
                          <div className="employee-settings-page__selected-priority">
                            Базовый приоритет: {selected.basePriority}
                          </div>
                          <div className="employee-settings-page__selected-description">
                            {selected.description || "Описание отсутствует"}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null}

                <div className="employee-settings-page__form-actions">
                  <button
                    type="submit"
                    className="employee-settings-page__btn employee-settings-page__btn--primary"
                    disabled={
                      submittingAssign ||
                      loadingAllTypes ||
                      !selectedProblemTypeId
                    }
                  >
                    {submittingAssign ? "Сохранение..." : "Назначить"}
                  </button>

                  <button
                    type="button"
                    className="employee-settings-page__btn employee-settings-page__btn--ghost"
                    onClick={resetAssignForm}
                    disabled={submittingAssign}
                  >
                    Сбросить
                  </button>
                </div>
              </form>
            </div>

            <div className="employee-settings-page__card">
              <div
                className="employee-settings-page__card-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Уже назначенные типы проблем</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  Всего: {assignedPagination.TotalCount}
                </span>
              </div>

              {loadingAssigned ? (
                <div className="employee-settings-page__empty">
                  Загрузка назначений...
                </div>
              ) : assignedProblemTypes.length === 0 ? (
                <div className="employee-settings-page__empty">
                  У сотрудника пока нет назначенных типов проблем
                </div>
              ) : (
                <>
                  <div className="employee-settings-page__assigned-list">
                    {assignedProblemTypes.map((assignment) => {
                      const title =
                        assignment?.typeOfProblem?.title || "Без названия";
                      const description =
                        assignment?.typeOfProblem?.description ||
                        "Описание отсутствует";
                      const priority =
                        assignment?.typeOfProblem?.basePriority || "—";

                      return (
                        <div
                          key={assignment.id}
                          className="employee-settings-page__assigned-item"
                        >
                          <div className="employee-settings-page__assigned-main">
                            <div className="employee-settings-page__assigned-top">
                              <div className="employee-settings-page__assigned-title">
                                {title}
                              </div>
                              <div className="employee-settings-page__priority-badge">
                                {priority}
                              </div>
                            </div>

                            <div className="employee-settings-page__assigned-description">
                              {description}
                            </div>

                            <div className="employee-settings-page__assigned-metrics">
                              <div className="employee-settings-page__metric">
                                <span className="employee-settings-page__metric-label">
                                  Навыки:
                                </span>
                                <span className="employee-settings-page__metric-value">
                                  {assignment.skills}
                                </span>
                              </div>

                              <div className="employee-settings-page__metric">
                                <span className="employee-settings-page__metric-label">
                                  Желание:
                                </span>
                                <span className="employee-settings-page__metric-value">
                                  {assignment.desire}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="employee-settings-page__assigned-actions">
                            <button
                              type="button"
                              className="employee-settings-page__btn employee-settings-page__btn--danger"
                              onClick={() =>
                                handleDeleteAssignedProblemType(assignment)
                              }
                              disabled={deletingId === assignment.id}
                            >
                              {deletingId === assignment.id
                                ? "Удаление..."
                                : "Удалить"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                      }}
                    >
                      Страница {assignedPagination.CurrentPage} из{" "}
                      {assignedPagination.TotalPages || 1}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <button
                        type="button"
                        className="employee-settings-page__btn employee-settings-page__btn--ghost"
                        disabled={
                          !assignedPagination.HasPrevious || loadingAssigned
                        }
                        onClick={() => handleAssignedPageChange("prev")}
                      >
                        &lt;
                      </button>

                      <button
                        type="button"
                        className="employee-settings-page__btn employee-settings-page__btn--ghost"
                        disabled={
                          !assignedPagination.HasNext || loadingAssigned
                        }
                        onClick={() => handleAssignedPageChange("next")}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <EmployeeWorkspacesModal
        isOpen={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        employee={employee}
      />
    </div>
  );
}

export default EmployeeSettingsPage;
