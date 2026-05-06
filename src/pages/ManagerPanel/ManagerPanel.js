import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeCard from "../../components/EmployeeCard/EmployeeCard";
import "./ManagerPanel.css";
import { IconPlus, IconList } from "../../components/Icons";
import EmployeeServerApi from "../../apiServices/employeeApi";
import TypeOfProblemModal from "../../components/TypeOfProblemModal/TypeOfProblemModal";
import WorkspaceModal from "../../components/WorkspaceModal/WorkspaceModal";
import EmployeeFiltersModal from "../../components/EmployeeFiltersModal/EmployeeFiltersModal";
import ManagerReportsDownloadModal from "../../components/ReportsModal/ManagerReportsDownloadModal";
import Header from "../../components/Header/Header";
import avatar from "../../imgs/avatar.jpg";

const STORAGE_KEY = "managerPanelEmployeesState";

function readSavedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const page =
      typeof parsed?.page === "number" && parsed.page >= 1 ? parsed.page : 1;

    const filters =
      parsed?.filters && typeof parsed.filters === "object"
        ? parsed.filters
        : null;

    return { page, filters };
  } catch {
    return null;
  }
}

function ManagerPanel() {
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);

  // ====== Восстанавливаем страницу и фильтры после возврата "назад" ======
  const saved = useMemo(() => readSavedState(), []);

  // Дефолтный фильтр — скрывать заблокированных
  const [employeeFilters, setEmployeeFilters] = useState(
    saved?.filters ?? { isBlocked: false },
  );

  // Пагинация (серверная)
  const [currentPage, setCurrentPage] = useState(saved?.page ?? 1);
  const itemsPerPage = 6;

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const employeeApi = useMemo(() => new EmployeeServerApi(), []);

  const closeModal = () => setActiveModal(null);

  // Сохраняем состояние при любых изменениях (чтобы при возврате не слетало)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ page: currentPage, filters: employeeFilters }),
      );
    } catch {
      // ignore
    }
  }, [currentPage, employeeFilters]);

  const openEmpAssignableRequests = (emp) => {
    navigate(
      `/manager/employee/requests/assignable?employeeId=${encodeURIComponent(
        emp.id,
      )}&fullName=${encodeURIComponent(emp.name)}`,
    );
  };

  const openEmployeeSettings = (emp) => {
    navigate(
      `/manager/employee/settings?employeeId=${encodeURIComponent(
        emp.id,
      )}&fullName=${encodeURIComponent(emp.name)}`,
    );
  };

  const goToAllRequests = () => {
    navigate("/manager/requests");
  };

  const loadEmployees = useCallback(
    async (page = 1, pageSize = itemsPerPage, filters = employeeFilters) => {
      setIsLoadingEmployees(true);
      try {
        const res = await employeeApi.GetEmployees(page, pageSize, filters);

        if (res?.success && Array.isArray(res.employees)) {
          const mapped = res.employees.map((e, index) => {
            const user = e.user || {};
            const currentBuilding = e.currentBuilding?.name || "";
            const defaultBuilding = e.defaultBuilding?.name || "";

            const fullName =
              user.fullName ||
              `${user.secondName ?? ""} ${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
              "Без имени";

            return {
              id: e.id || index + 1,
              name: fullName,
              role: e.role || "Сотрудник",
              status: e.isAvailable ? "Online" : "Offline",
              currentLocation: currentBuilding || "-",
              defaultLocation: defaultBuilding || "",
              avatar: user.profilePhotoUrl || avatar,
            };
          });

          setEmployees(mapped);
          setPagination(res.pagination || null);
        } else {
          setEmployees([]);
          setPagination(null);
        }
      } catch (err) {
        console.error("Load employees error:", err);
        setEmployees([]);
        setPagination(null);
      } finally {
        setIsLoadingEmployees(false);
      }
    },
    [employeeApi, employeeFilters],
  );

  // грузим при изменении страницы или фильтров
  useEffect(() => {
    loadEmployees(currentPage, itemsPerPage, employeeFilters);
  }, [currentPage, employeeFilters, itemsPerPage, loadEmployees]);

  const totalCount =
    pagination?.TotalCount ??
    pagination?.totalCount ??
    pagination?.totalItems ??
    employees.length;

  const totalPages =
    pagination?.TotalPages ??
    pagination?.totalPages ??
    Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="manager-panel-page">
      <div className="aurora-bg"></div>

      <Header />

      <div className="manager-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <h1 className="page-title">Сотрудники</h1>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Всего: {totalCount}
            </div>
          </div>

          <div className="toolbar-right">
            <button
              className="btn btn-outline"
              onClick={() => setActiveModal("employeeFilters")}
            >
              Фильтры
            </button>

            <button
              className="btn btn-outline"
              onClick={() => setActiveModal("reports")}
            >
              Отчёты
            </button>

            <button className="btn btn-outline" onClick={goToAllRequests}>
              <IconList /> Все заявки
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setActiveModal("problemTypes")}
            >
              <IconPlus /> Типы проблем
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setActiveModal("createZone")}
            >
              <IconPlus /> Создать зону
            </button>
          </div>
        </div>

        <div className="employee-grid">
          {isLoadingEmployees ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Загрузка сотрудников...
            </div>
          ) : employees.length > 0 ? (
            employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                onOpenSettings={openEmployeeSettings}
                onViewDetails={() => openEmpAssignableRequests(emp)}
              />
            ))
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Сотрудники не найдены
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={goPrev}
            >
              &lt;
            </button>

            <span className="page-indicator">
              Страница {currentPage} из {totalPages}
            </span>

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={goNext}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Модалка фильтров сотрудников */}
      <EmployeeFiltersModal
        isOpen={activeModal === "employeeFilters"}
        onClose={closeModal}
        initialFilters={employeeFilters}
        onApply={(filters) => {
          // если пользователь нажал "Применить" с пустыми фильтрами,
          // то дефолт "не показывать заблокированных" всё равно должен остаться
          const next =
            filters && Object.keys(filters).length
              ? filters
              : { isBlocked: false };

          setEmployeeFilters(next);
          setCurrentPage(1);
          closeModal();
        }}
      />

      {/* Модалка отчетов для менеджера: только заявки, фильтры сразу открыты */}
      <ManagerReportsDownloadModal
        isOpen={activeModal === "reports"}
        onClose={closeModal}
        initialRequestFilters={{}}
      />

      <WorkspaceModal
        isOpen={activeModal === "createZone"}
        onClose={closeModal}
      />

      <TypeOfProblemModal
        isOpen={activeModal === "problemTypes"}
        onClose={closeModal}
      />
    </div>
  );
}

export default ManagerPanel;
