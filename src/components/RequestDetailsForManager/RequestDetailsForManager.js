import React from "react";
import "../RequestDetailsModal/RequestDetailsModal.css"; // используем стили модалки
import { IconCamera } from "../Icons";

/**
 * Модальное окно только для просмотра деталей заявки менеджером.
 * Без кнопок добавления комментариев / удаления / загрузки фото.
 *
 * Ожидаемый формат пропса `request`:
 * {
 *   id: string,
 *   number?: number | string,
 *   category: string,
 *   date: string,
 *   priority: string,
 *   status: string,
 *   building: string,
 *   floor: string,
 *   spot: string,
 *   desc: string,
 *   images: string[],
 *   comments: { text: string }[]
 * }
 */
const RequestDetailsForManagerModal = ({
  isOpen,
  onClose,
  request,
  photoLoading,
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-details">
          <h3>
            Заявка №
            {request.number ??
              request.id?.toString().substring(0, 6).toUpperCase()}
          </h3>
          <button className="btn-close-details" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Info Block */}
        <div style={{ marginBottom: 20 }}>
          <div className="details-row">
            <strong>Категория:</strong> <span>{request.category}</span>
          </div>
          <div className="details-row">
            <strong>Дата:</strong> <span>{request.date}</span>
          </div>
          <div className="details-row">
            <strong>Приоритет:</strong> <span>{request.priority}</span>
          </div>
          <div className="details-row">
            <strong>Статус:</strong>
            <span className={`status-badge-pill ${request.status}`}>
              {request.status}
            </span>
          </div>

          <div style={{ marginTop: 15, marginBottom: 15 }}>
            <div className="details-row">
              <strong>Здание:</strong> <span>{request.building}</span>
            </div>
            <div className="details-row">
              <strong>Этаж:</strong> <span>{request.floor}</span>
            </div>
            <div className="details-row">
              <strong>Помещение:</strong> <span>{request.spot}</span>
            </div>
          </div>

          {/* Description Box */}
          <div className="desc-box">
            <strong style={{ display: "block", marginBottom: 5 }}>
              Описание:
            </strong>
            {request.desc || "Нет описания"}
          </div>
        </div>

        {/* Photos */}
        <div>
          <strong
            style={{ display: "block", marginBottom: 5, color: "#1e293b" }}
          >
            Фото:
          </strong>

          {photoLoading ? (
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Загрузка фото...
            </div>
          ) : (
            <div className="gallery-grid">
              {request.images && request.images.length > 0 ? (
                request.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className="gallery-img"
                    alt={`Фото ${i + 1}`}
                    onClick={() => window.open(src, "_blank")}
                  />
                ))
              ) : (
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    alignSelf: "center",
                  }}
                >
                  Нет фото
                </span>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <span className="comments-title">Комментарии</span>

          <div className="comments-list">
            {request.comments && request.comments.length > 0 ? (
              request.comments.map((c, i) => (
                <div key={i} className="comment-bubble">
                  {c.text}
                </div>
              ))
            ) : (
              <div className="comment-empty">Нет комментариев</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsForManagerModal;
