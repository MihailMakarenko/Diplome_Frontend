import React, { useEffect, useMemo, useRef, useState } from "react";
import EmployeeCard from "../../components/EmployeeCard/EmployeeCard";
import "./ManagerPanel.css";
import { IconBuilding, IconPlus, IconList } from "../../components/Icons";
import TasksModal from "../../components/EmployeeTasksModal/TasksModal";
import EmployeeServerApi from "../../apiServices/employeeApi";
import EmployeeWorkspacesModal from "../../components/EmployeeWorkspacesModal/EmployeeWorkspacesModal";
import WorkspaceModal from "../../components/WorkspaceModal/WorkspaceModal";

function ManagerPanel() {
  // --- STATE (UI) ---
  const [activeModal, setActiveModal] = useState(null); // 'createZone', 'assignZones', 'empDetails', 'assignNewTask'
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [modalTasks, setModalTasks] = useState([]);

  // --- STATE (Filters & Pagination) ---
  const [filterBuilding, setFilterBuilding] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // --- DATA ---
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // превью заявок
  const [tasksPreviewByEmpId, setTasksPreviewByEmpId] = useState({});
  const previewLoadedRef = useRef(new Set());

  const employeeApi = useMemo(() => new EmployeeServerApi(), []);

  // --- LOAD EMPLOYEES FROM API ---
  const loadEmployees = async (page = 1, pageSize = 20) => {
    setIsLoadingEmployees(true);
    try {
      const res = await employeeApi.GetEmployees(page, pageSize);

      if (res?.success && Array.isArray(res.employees)) {
        const mapped = res.employees.map((e, index) => {
          const user = e.user || e.employee?.user || {};
          const currentBuilding = e.currentBuilding?.name || "";
          const defaultBuilding = e.defaultBuilding?.name || "";
          const zoneIds = e.workspaceIds || e.workSpaceIds || e.zoneIds || [];

          return {
            id: e.id || e.employee?.id || index + 1,
            name:
              user.fullName ||
              `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim() ||
              "Без имени",
            role: e.role || "Сотрудник",
            status: e.isAvailable ? "Online" : "Offline",
            currentLocation: currentBuilding || "-",
            defaultLocation: defaultBuilding || "",
            zoneIds: Array.isArray(zoneIds) ? zoneIds : [],
            avatar:
              user.profilePhotoUrl ||
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          };
        });

        setEmployees(mapped);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Load employees error:", err);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    loadEmployees(1, 20);
  }, [employeeApi]);

  // ===== helpers =====
  const isRequestInWork = (r) => {
    const raw =
      r?.status ??
      r?.requestStatus ??
      r?.state ??
      r?.statusName ??
      r?.requestState;

    if (raw == null) return true;

    if (typeof raw === "string") {
      const s = raw.toLowerCase();
      return (
        s.includes("в работе") ||
        s.includes("inwork") ||
        s.includes("in_work") ||
        s.includes("in progress") ||
        s.includes("inprogress") ||
        s.includes("progress") ||
        s.includes("assigned") ||
        s.includes("accepted") ||
        s.includes("working")
      );
    }

    return true;
  };

  const mapRequestToTask = (r) => ({
    id: r.id,
    number: r.number,
    title: r.typeOfProblem?.title || "Заявка",
    date: new Date(r.createAt).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    location:
      r.location?.floor?.building?.name && r.location?.name
        ? `${r.location.floor.building.name}, ${r.location.name}`
        : r.location?.name || "Не указано",
    priority: r.priority,
    category: r.typeOfProblem?.title || "",
    desc: r.description,
  });

  const loadTasksForEmployee = async (employee, take = 50) => {
    if (!employee?.id) return [];
    try {
      const res = await employeeApi.GetRequestsForEmployee(
        employee.id,
        1,
        take,
      );
      if (!res?.success || !Array.isArray(res.requests)) return [];

      const requests = res.requests.map((x) => x?.request ?? x).filter(Boolean);
      const inWork = requests.filter(isRequestInWork);

      return inWork.map(mapRequestToTask);
    } catch (err) {
      console.error("Load tasks for employee error:", err);
      return [];
    }
  };

  useEffect(() => {
    if (!employees.length) return;

    let cancelled = false;

    const run = async () => {
      const toLoad = employees.filter(
        (e) => e?.id && !previewLoadedRef.current.has(e.id),
      );
      if (!toLoad.length) return;

      const results = await Promise.allSettled(
        toLoad.map(async (emp) => {
          const preview = await loadTasksForEmployee(emp, 2);
          return { empId: emp.id, preview };
        }),
      );

      if (cancelled) return;

      const patch = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          patch[r.value.empId] = r.value.preview;
          previewLoadedRef.current.add(r.value.empId);
        }
      }
      setTasksPreviewByEmpId((prev) => ({ ...prev, ...patch }));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [employees]);

  // ===== Building filter options =====
  const uniqueBuildings = useMemo(() => {
    const set = new Set();
    for (const e of employees) {
      if (e.currentLocation && e.currentLocation !== "-") {
        set.add(e.currentLocation);
      }
      if (e.defaultLocation) {
        set.add(e.defaultLocation);
      }
    }
    return Array.from(set);
  }, [employees]);

  // --- FILTERING ---
  const filteredEmployees = employees.filter((emp) => {
    const statusMatch = filterStatus === "All" || emp.status === filterStatus;

    const buildingMatch =
      filterBuilding === "All" ||
      emp.currentLocation === filterBuilding ||
      emp.defaultLocation === filterBuilding;

    return statusMatch && buildingMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;

  // --- HANDLERS ---
  const handleUnassignTask = async (taskId) => {
    if (!selectedEmp) return;
    console.log("Снять заявку", taskId, "с сотрудника", selectedEmp.id);

    const full = await loadTasksForEmployee(selectedEmp, 50);
    setModalTasks(full);

    const preview = await loadTasksForEmployee(selectedEmp, 2);
    setTasksPreviewByEmpId((prev) => ({ ...prev, [selectedEmp.id]: preview }));
  };

  const handleAssignTaskToEmp = (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    alert("Назначение заявок пока реализовано как заглушка.");
    setActiveModal(null);
  };

  // --- ACTIONS ---
  const openAssignZones = (emp) => {
    setSelectedEmp(emp);
    setActiveModal("assignZones");
  };

  const openEmpDetails = async (emp) => {
    setSelectedEmp(emp);

    const preview = tasksPreviewByEmpId[emp.id] ?? [];
    setModalTasks(preview);
    setActiveModal("empDetails");

    const fullInWork = await loadTasksForEmployee(emp, 50);
    const previewIds = new Set(preview.map((t) => t.id));
    const rest = fullInWork.filter((t) => !previewIds.has(t.id));

    setModalTasks([...preview, ...rest]);
  };

  const openAssignNewTask = (emp) => {
    setSelectedEmp(emp);
    setActiveModal("assignNewTask");
  };

  const goToAllRequests = () => {
    alert("Переход на страницу всех заявок...");
  };

  // --- CALLBACK после сохранения рабочих зон сотрудника ---
  const handleWorkspacesSaved = (employeeId, workspaceIds) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId ? { ...e, zoneIds: workspaceIds } : e,
      ),
    );

    setSelectedEmp((prev) =>
      prev?.id === employeeId ? { ...prev, zoneIds: workspaceIds } : prev,
    );
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className="aurora-bg"></div>

      <header className="manager-header">
        <div className="brand-logo">
          <IconBuilding /> Хоз. Отдел{" "}
          <span className="role-badge">Начальник</span>
        </div>
        <button
          className="btn btn-outline"
          style={{ border: "none", background: "transparent" }}
        >
          Выйти
        </button>
      </header>

      <div className="manager-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <h1 className="page-title">Сотрудники</h1>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Всего: {filteredEmployees.length}
            </div>
          </div>

          <div className="toolbar-right">
            <div className="filters-group">
              <select
                className="filter-select"
                value={filterBuilding}
                onChange={(e) => {
                  setFilterBuilding(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">Все корпуса</option>
                {uniqueBuildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">Все статусы</option>
                <option value="Online">На работе</option>
                <option value="Offline">Нет на месте</option>
                <option value="Busy">Занят</option>
              </select>
            </div>

            <button className="btn btn-outline" onClick={goToAllRequests}>
              <IconList /> Все заявки
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
          ) : currentEmployees.length > 0 ? (
            currentEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                tasks={tasksPreviewByEmpId[emp.id] ?? []}
                zones={[]}
                onAssignZones={openAssignZones}
                onViewDetails={() => openEmpDetails(emp)}
                onAssignNewTask={openAssignNewTask}
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
              onClick={() => setCurrentPage((c) => c - 1)}
            >
              &lt;
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((c) => c + 1)}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ASSIGN NEW TASK */}
      {activeModal === "assignNewTask" && selectedEmp && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Назначить заявку</h3>
              <button
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                }}
                onClick={closeModal}
              >
                &times;
              </button>
            </div>

            <p style={{ marginBottom: 15 }}>
              Сотрудник: <strong>{selectedEmp.name}</strong>
            </p>

            <form onSubmit={handleAssignTaskToEmp}>
              <div className="selectable-list">
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#64748b",
                    padding: 10,
                    textAlign: "center",
                  }}
                >
                  Логика назначения заявок на сотрудника пока заглушка.
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 20 }}
              >
                Ок
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TASKS DETAILS */}
      <TasksModal
        isOpen={activeModal === "empDetails"}
        onClose={closeModal}
        employeeName={selectedEmp?.name}
        tasks={modalTasks}
        onUnassignTask={handleUnassignTask}
      />

      {/* MODAL: WORKSPACES ASSIGNMENT */}
      <EmployeeWorkspacesModal
        isOpen={activeModal === "assignZones"}
        onClose={closeModal}
        employee={selectedEmp}
        onSaved={handleWorkspacesSaved}
      />

      {/* MODAL: CREATE WORKSPACE */}
      <WorkspaceModal
        isOpen={activeModal === "createZone"}
        onClose={closeModal}
      />
    </>
  );
}

export default ManagerPanel;
