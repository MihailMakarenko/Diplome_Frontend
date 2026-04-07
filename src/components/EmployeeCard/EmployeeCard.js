import React from "react";
import "./EmployeeCard.css";
import { IconMapPin, IconHome, IconSettings, IconPlusCircle } from "../Icons";

const EmployeeCard = ({
  emp,
  tasks,
  onOpenSettings,
  onViewDetails,
  onAssignNewTask,
}) => {
  const isOnline = emp.status === "Online";
  const statusLabel = isOnline ? "На работе" : "Не на месте";

  const normalizePriority = (priority) => {
    if (!priority) return "low";

    const low = priority.toLowerCase();

    if (low === "high" || low === "высокий") return "high";
    if (low === "medium" || low === "средний") return "medium";

    return "low";
  };

  return (
    <div className="employee-card-component">
      <div className="employee-card">
        <div className={`card-status-strip status-${emp.status}`}></div>

        <div className="emp-header">
          <div className="emp-profile">
            <img src={emp.avatar} alt="" className="emp-avatar" />
            <div className="emp-names">
              <h3>{emp.name}</h3>
            </div>
          </div>

          <span className={`status-chip chip-${emp.status}`}>
            {statusLabel}
          </span>
        </div>

        <div className="locations-block">
          <div className="loc-row">
            <div className="loc-icon">
              <IconMapPin />
            </div>
            <div>
              <span className="loc-label">Сейчас:</span>{" "}
              <span
                className={`current-location ${isOnline ? "online" : "offline"}`}
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

        <div className="zones-compact">
          <span>Настройки сотрудника</span>

          <button className="btn-icon-edit" onClick={() => onOpenSettings(emp)}>
            <IconSettings />
          </button>
        </div>

        <div className="tasks-preview-container">
          <div>
            <div className="tasks-header">В работе ({tasks.length})</div>

            <div className="task-preview-list">
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  return (
                    <div key={task.id} className="task-mini-item">
                      <div className="task-header">
                        <span className="task-id">#{task.number}</span>
                        <span className="task-category">
                          {task.category || "Другое"}
                        </span>
                      </div>

                      <div className="task-title">{task.title}</div>

                      <div className="task-footer">
                        <span className="task-date">📅 {task.date}</span>

                        <div className="task-priority">
                          <span
                            className={`priority-dot priority-${normalizePriority(
                              task.priority,
                            )}`}
                          ></span>
                          <span className="task-priority-label priority-label">
                            {task.priority || "Низкий"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-tasks">Нет активных задач</div>
              )}
            </div>

            <button
              className="btn-assign-task"
              onClick={() => onAssignNewTask(emp)}
            >
              <IconPlusCircle /> Назначить заявку
            </button>
          </div>

          <button className="btn-view-more" onClick={() => onViewDetails(emp)}>
            Подробнее
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
