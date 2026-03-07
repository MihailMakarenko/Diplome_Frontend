import React, { useState } from "react";
import "../../pages/AdminPanel/AdminPanel.css"; // Используем общие стили модалки

const RequestFiltersModal = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      status: "",
      type: "",
      location: "",
      executor: "",
      sort: "dateDesc",
    };
    setFilters(defaultFilters);
    onApply(defaultFilters); // Сразу применяем сброс
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "400px" }}
      >
        <div className="modal-header">
          <h3>Фильтры и Сортировка</h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        <div className="filter-modal-content">
          <div className="filter-section">
            <label className="filter-label">Сортировка</label>
            <select
              name="sort"
              value={filters.sort}
              onChange={handleChange}
              className="form-select"
            >
              <option value="dateDesc">Сначала новые</option>
              <option value="dateAsc">Сначала старые</option>
              <option value="priorityDesc">Приоритет (Выс - Низ)</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Статус</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Все</option>
              <option value="New">Новая</option>
              <option value="Work">В работе</option>
              <option value="Done">Завершена</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Тип проблемы</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Все</option>
              <option value="Электрика">Электрика</option>
              <option value="Сантехника">Сантехника</option>
              <option value="IT">IT</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Местоположение (Здание/Ауд)</label>
            <input
              name="location"
              value={filters.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Например: Корпус А"
            />
          </div>

          <div className="filter-section">
            <label className="filter-label">Исполнитель (Фамилия)</label>
            <input
              name="executor"
              value={filters.executor}
              onChange={handleChange}
              className="form-input"
              placeholder="Поиск по сотруднику"
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleReset}
            >
              Сбросить
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleApply}
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestFiltersModal;
