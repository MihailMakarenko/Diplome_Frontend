import React, { useEffect, useState } from "react";
import "./TasksModal.css";

const IconChevronDown = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M6 9l6 6 6-6"></path>
  </svg>
);

const IconImage = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const IconMessage = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const IconTrash = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const TasksModal = ({
  isOpen,
  onClose,
  employeeName,
  tasks,
  onUnassignTask,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [openTaskId, setOpenTaskId] = useState(null);

  const itemsPerPage = 4;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setOpenTaskId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = tasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  const toggleTask = (id) => {
    setOpenTaskId(openTaskId === id ? null : id);
  };

  const getPriorityColor = (p) => {
    if (p === "High" || p === "Высокий") return "#ef4444";
    if (p === "Medium" || p === "Средний") return "#f59e0b";
    return "#10b981";
  };

  const handleDeleteClick = (e, taskId) => {
    e.stopPropagation();
    if (
      window.confirm("Вы уверены, что хотите снять эту задачу с сотрудника?")
    ) {
      onUnassignTask(taskId);
    }
  };

  return (
    <div className="tasks-modal-component">
      <div className="tm-overlay" onClick={onClose}>
        <div className="tm-card" onClick={(e) => e.stopPropagation()}>
          <div className="tm-header">
            <div>
              <h3 className="tm-title">Задачи сотрудника</h3>
              <p className="tm-subtitle">
                {employeeName} • Всего: {tasks.length}
              </p>
            </div>

            <button className="tm-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="tasks-modal-list">
            {currentTasks.length > 0 ? (
              currentTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-accordion-item ${openTaskId === task.id ? "open" : ""}`}
                >
                  <div
                    className="task-acc-header"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="acc-left">
                      <div className="acc-title">{task.title}</div>

                      <div className="acc-meta">
                        <span className="acc-id">#{task.id}</span>
                        <span>📅 {task.date}</span>
                        <span
                          style={{
                            color: getPriorityColor(task.priority),
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            border: `1px solid ${getPriorityColor(task.priority)}`,
                            padding: "1px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <div className="acc-right-actions">
                      <button
                        className="btn-icon-delete"
                        title="Снять задачу"
                        onClick={(e) => handleDeleteClick(e, task.id)}
                      >
                        <IconTrash />
                      </button>

                      <button className="btn-toggle-details">
                        <IconChevronDown />
                      </button>
                    </div>
                  </div>

                  <div className="task-acc-body">
                    <div className="detail-block">
                      <div className="detail-label">Местоположение</div>
                      <div className="detail-text">📍 {task.location}</div>
                    </div>

                    <div className="detail-block">
                      <div className="detail-label">Описание проблемы</div>
                      <div className="detail-text">
                        {task.desc || "Описание отсутствует."}
                      </div>
                    </div>

                    {task.images && task.images.length > 0 && (
                      <div className="detail-block">
                        <div className="detail-label">
                          <IconImage /> Фотографии
                        </div>

                        <div className="detail-photos">
                          {task.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Evidence"
                              className="detail-photo"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(img, "_blank");
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {task.comments && task.comments.length > 0 && (
                      <div className="detail-block">
                        <div className="detail-label">
                          <IconMessage /> Комментарии
                        </div>

                        <div className="detail-comments">
                          {task.comments.map((c, i) => (
                            <div key={i} className="comment-row">
                              <strong>{c.author || "Пользователь"}:</strong>{" "}
                              {c.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="tm-empty">Нет активных задач</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-modal">
              <button
                className="tm-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                &lt;
              </button>

              <span className="tm-page-info">
                Стр. {currentPage} из {totalPages}
              </span>

              <button
                className="tm-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksModal;
