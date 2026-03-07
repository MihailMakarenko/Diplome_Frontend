import React, { useState } from "react";
import "../../pages/ManagerPanel/ManagerPanel.css";
import { IconMapPin, IconHome, IconSettings, IconPlusCircle } from "../Icons";

const EmployeeCard = ({
  emp,
  tasks,
  zones,
  onAssignZones,
  onViewDetails,
  onAssignNewTask,
}) => {
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 2;

  const isOnline = emp.status === "Online";
  const statusLabel = isOnline ? "На работе" : "Не на месте";

  // Фильтр задач для этого сотрудника
  const empTasks = tasks.filter((t) => t.assignedTo.includes(emp.id));

  // Пагинация (для отображения в списке)
  const recentTasks = empTasks.slice(0, 2);

  // Получить первые 2 зоны
  const previewZoneIds = emp.zoneIds.slice(0, 2);
  const hasMoreZones = emp.zoneIds.length > 2;

  // Хелпер для цвета приоритета
  const getPriorityColor = (priority) => {
    if (priority === "High" || priority === "Высокий") return "#ef4444"; // Красный
    if (priority === "Medium" || priority === "Средний") return "#f59e0b"; // Оранжевый
    return "#10b981"; // Зеленый
  };

  return (
    <div className="employee-card">
      <div className={`card-status-strip status-${emp.status}`}></div>

      {/* 1. Header */}
      <div className="emp-header">
        <div className="emp-profile">
          <img src={emp.avatar} alt="" className="emp-avatar" />
          <div className="emp-names">
            <h3>{emp.name}</h3>
          </div>
        </div>
        <span className={`status-chip chip-${emp.status}`}>{statusLabel}</span>
      </div>

      {/* 2. Locations */}
      <div className="locations-block">
        <div className="loc-row">
          <div className="loc-icon">
            <IconMapPin />
          </div>
          <div>
            <span className="loc-label">Сейчас:</span>{" "}
            <span
              style={{
                fontWeight: 600,
                color: isOnline ? "var(--primary)" : "#94a3b8",
              }}
            >
              {emp.currentLocation || "Неизвестно"}
            </span>
          </div>
        </div>
        <div className="loc-row">
          <div className="loc-icon">
            <IconHome />
          </div>
          <div>
            <span className="loc-label">База:</span>{" "}
            <span>{emp.defaultLocation}</span>
          </div>
        </div>
      </div>

      {/* 3. Zones */}
      <div className="zones-compact">
        <span>
          Рабочие зоны: <strong>{emp.zoneIds.length}</strong>
        </span>
        <button className="btn-icon-edit" onClick={() => onAssignZones(emp)}>
          <IconSettings />
        </button>
      </div>

      {/* 4. Tasks List (ИСПРАВЛЕННЫЙ БЛОК) */}
      <div className="tasks-preview-container">
        <div>
          <div className="tasks-header">В работе ({empTasks.length})</div>

          <div className="task-preview-list">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-mini-item"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  {/* Верх: ID и Категория */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span className="task-id">#{task.id}</span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {/* Если в объекте task есть поле category, выводим его, иначе fallback */}
                      {task.category || "Другое"}
                    </span>
                  </div>

                  {/* Основной заголовок (Тип проблемы) */}
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#1e293b",
                      lineHeight: "1.3",
                    }}
                  >
                    {task.title}
                  </div>

                  {/* Низ: Дата/Время и Приоритет */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "4px",
                      borderTop: "1px dashed #f1f5f9",
                      paddingTop: "6px",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      📅 {task.date}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: getPriorityColor(task.priority),
                        }}
                      ></span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  fontStyle: "italic",
                  padding: 5,
                }}
              >
                Нет активных задач
              </div>
            )}
          </div>

          {/* Кнопка Назначить Задачу */}
          <button
            className="btn-assign-task"
            onClick={() => onAssignNewTask(emp)}
          >
            <IconPlusCircle /> Назначить заявку
          </button>
        </div>

        {/* Кнопка Подробнее */}
        <button
          className="btn-view-more"
          onClick={() => onViewDetails(emp, empTasks)}
        >
          Подробнее
        </button>
      </div>
    </div>
  );
};

export default EmployeeCard;
