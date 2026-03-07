import React, { useState } from "react";
import EmployeeCard from "../../components/EmployeeCard/EmployeeCard";
import "./ManagerPanel.css";
import { IconBuilding, IconPlus, IconList } from "../../components/Icons";
import TasksModal from "../../components/EmployeeTasksModal/TasksModal";

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
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "Алексей Смирнов",
      role: "Сантехник",
      status: "Online",
      currentLocation: "Корпус А, Подвал",
      defaultLocation: "Мастерская 1",
      zoneIds: [101, 103],
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    },
    {
      id: 2,
      name: "Дмитрий Орлов",
      role: "Электрик",
      status: "Busy",
      currentLocation: "Общежитие, 3 этаж",
      defaultLocation: "Щитовая",
      zoneIds: [104],
      avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    },
    {
      id: 3,
      name: "Мария Ковалева",
      role: "Уборка",
      status: "Offline",
      currentLocation: "-",
      defaultLocation: "Подсобка 102",
      zoneIds: [102],
      avatar: "https://randomuser.me/api/portraits/women/42.jpg",
    },
    {
      id: 4,
      name: "Иван Петров",
      role: "Плотник",
      status: "Online",
      currentLocation: "Корпус Б, 1 этаж",
      defaultLocation: "Столярная",
      zoneIds: [],
      avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    },
    {
      id: 5,
      name: "Елена Сидорова",
      role: "Уборка",
      status: "Online",
      currentLocation: "Главный корпус",
      defaultLocation: "Холл",
      zoneIds: [101],
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    },
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 10,
      title: "Протечка трубы",
      date: "20.05",
      location: "Туалет 2 эт.",
      priority: "High",
      assignedTo: [1],
      category: "Сантехника",
      desc: "Срочно течет вода",
    },
    {
      id: 11,
      title: "Замена ламп",
      date: "19.05",
      location: "Коридор 1 эт.",
      priority: "Low",
      assignedTo: [2],
      category: "Электрика",
      desc: "Перегорели лампы",
    },
    {
      id: 12,
      title: "Генеральная уборка",
      date: "18.05",
      location: "Холл",
      priority: "Medium",
      assignedTo: [1, 3],
      category: "Клининг",
      desc: "Плановая уборка",
    },
    {
      id: 13,
      title: "Ремонт крана",
      date: "18.05",
      location: "Кухня",
      priority: "Low",
      assignedTo: [1],
      category: "Сантехника",
      desc: "Капает кран",
    },
    {
      id: 14,
      title: "Проверка отопления",
      date: "17.05",
      location: "Подвал",
      priority: "Medium",
      assignedTo: [],
      category: "Инженерные сети",
      desc: "Проверка давления",
    },
    {
      id: 15,
      title: "Сломан стул",
      date: "16.05",
      location: "Ауд. 205",
      priority: "Low",
      assignedTo: [],
      category: "Мебель",
      desc: "Отвалилась ножка",
    },
  ]);

  const [zones, setZones] = useState([
    { id: 101, building: "Корпус А", floor: "2 этаж", spot: "Правое крыло" },
    { id: 102, building: "Корпус Б", floor: "1 этаж", spot: "Вестибюль" },
    { id: 103, building: "Главный корпус", floor: "1 этаж", spot: "Столовая" },
    { id: 104, building: "Общежитие №1", floor: "Все", spot: "Весь корпус" },
  ]);

  // --- HELPERS ---
  const uniqueBuildings = [...new Set(zones.map((z) => z.building))];

  // --- FILTERING & PAGINATION ---
  const filteredEmployees = employees.filter((emp) => {
    const statusMatch = filterStatus === "All" || emp.status === filterStatus;
    let buildingMatch = true;
    if (filterBuilding !== "All") {
      const employeeZones = zones.filter((z) => emp.zoneIds.includes(z.id));
      buildingMatch = employeeZones.some((z) => z.building === filterBuilding);
    }
    return statusMatch && buildingMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // --- HANDLERS ---

  // Логика снятия задачи с сотрудника
  const handleUnassignTask = (taskId) => {
    // 1. Обновляем глобальный список задач (убираем ID сотрудника из массива assignedTo)
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          assignedTo: t.assignedTo.filter((id) => id !== selectedEmp.id),
        };
      }
      return t;
    });

    setTasks(updatedTasks);

    // 2. Обновляем список задач в открытом модальном окне
    const newModalTasks = updatedTasks.filter((t) =>
      t.assignedTo.includes(selectedEmp.id),
    );
    setModalTasks(newModalTasks);
  };

  const handleAssignZones = (e) => {
    e.preventDefault();
    const checkboxes = e.target.querySelectorAll(
      'input[name="zoneIds"]:checked',
    );
    const selectedZoneIds = Array.from(checkboxes).map((cb) =>
      Number(cb.value),
    );
    setEmployees(
      employees.map((emp) =>
        emp.id === selectedEmp.id ? { ...emp, zoneIds: selectedZoneIds } : emp,
      ),
    );
    setActiveModal(null);
  };

  const handleAssignTaskToEmp = (e) => {
    e.preventDefault();
    const checkboxes = e.target.querySelectorAll(
      'input[name="taskIds"]:checked',
    );
    const selectedTaskIds = Array.from(checkboxes).map((cb) =>
      Number(cb.value),
    );

    const updatedTasks = tasks.map((t) => {
      if (selectedTaskIds.includes(t.id)) {
        if (!t.assignedTo.includes(selectedEmp.id)) {
          return { ...t, assignedTo: [...t.assignedTo, selectedEmp.id] };
        }
      }
      return t;
    });

    setTasks(updatedTasks);
    setActiveModal(null);
    alert("Задачи назначены!");
  };

  const handleCreateZone = (e) => {
    e.preventDefault();
    // Логика создания зоны (заглушка)
    alert("Зона создана");
    setActiveModal(null);
  };

  // --- ACTIONS ---
  const openAssignZones = (emp) => {
    setSelectedEmp(emp);
    setActiveModal("assignZones");
  };
  const openEmpDetails = (emp, tasks) => {
    setSelectedEmp(emp);
    setModalTasks(tasks);
    setActiveModal("empDetails");
  };
  const openAssignNewTask = (emp) => {
    setSelectedEmp(emp);
    setActiveModal("assignNewTask");
  };
  const goToAllRequests = () => {
    alert("Переход на страницу всех заявок...");
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
        {/* Toolbar */}
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

        {/* Grid */}
        <div className="employee-grid">
          {currentEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              tasks={tasks}
              zones={zones}
              onAssignZones={openAssignZones}
              onViewDetails={openEmpDetails}
              onAssignNewTask={openAssignNewTask}
            />
          ))}
        </div>

        {/* Pagination */}
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

      {/* ===== MODAL: ASSIGN NEW TASK TO EMPLOYEE ===== */}
      {activeModal === "assignNewTask" && selectedEmp && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
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
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>
            <p style={{ marginBottom: 15 }}>
              Сотрудник: <strong>{selectedEmp.name}</strong>
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                marginBottom: 10,
                color: "#64748b",
              }}
            >
              Выберите заявки из списка:
            </p>

            <form onSubmit={handleAssignTaskToEmp}>
              <div className="selectable-list">
                {tasks.map((t) => {
                  const isAssigned = t.assignedTo.includes(selectedEmp.id);
                  return (
                    <label
                      key={t.id}
                      className="selectable-item"
                      style={{ opacity: isAssigned ? 0.6 : 1 }}
                    >
                      <input
                        type="checkbox"
                        name="taskIds"
                        value={t.id}
                        disabled={isAssigned}
                      />
                      <div className="item-content">
                        <span className="item-title">
                          {t.title}{" "}
                          {isAssigned && (
                            <span
                              style={{ color: "green", fontSize: "0.7rem" }}
                            >
                              (Уже назначена)
                            </span>
                          )}
                        </span>
                        <span className="item-meta">
                          {t.location} • {t.priority}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 20 }}
              >
                Назначить выбранные
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: TASKS DETAILS (Component) ===== */}
      <TasksModal
        isOpen={activeModal === "empDetails"}
        onClose={() => setActiveModal(null)}
        employeeName={selectedEmp?.name}
        tasks={modalTasks}
        onUnassignTask={handleUnassignTask} // Передаем функцию удаления
      />

      {/* ===== MODAL: ASSIGN ZONES ===== */}
      {activeModal === "assignZones" && selectedEmp && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Назначить зоны</h3>
              <button onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleAssignZones}>
              <div className="checkbox-list">
                {zones.map((z) => (
                  <label key={z.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="zoneIds"
                      value={z.id}
                      defaultChecked={selectedEmp.zoneIds.includes(z.id)}
                    />
                    <span>
                      {z.building}, {z.floor} <small>({z.spot})</small>
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 20 }}
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: CREATE ZONE ===== */}
      {activeModal === "createZone" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Новая зона</h3>
              <button onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleCreateZone}>
              <div className="form-group">
                <label className="form-label">Здание</label>
                <select name="building" className="form-select">
                  <option>Главный корпус</option>
                  <option>Корпус А</option>
                  <option>Корпус Б</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Этаж</label>
                <select name="floor" className="form-select">
                  <option>1 этаж</option>
                  <option>2 этаж</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Место</label>
                <input name="spot" className="form-input" required />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                Создать
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ManagerPanel;
