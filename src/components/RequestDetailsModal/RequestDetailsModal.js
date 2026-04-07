import React from "react";
import "./RequestDetailsModal.css";
import { IconCamera, IconTrash } from "../Icons";

const RequestDetailsModal = ({
  isOpen,
  onClose,
  request,
  tempComment,
  onCommentChange,
  onSendComment,
  onDeleteRequest,
  onAddPhotoClick,
  onFileChange,
  photoLoading,
  fileInputRef,
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="request-details-modal">
      <div className="rdm-overlay" onClick={onClose}>
        <div className="rdm-card" onClick={(e) => e.stopPropagation()}>
          <div className="rdm-header">
            <h3 className="rdm-title">Заявка #{request.id}</h3>
            <button className="rdm-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="rdm-info-block">
            <div className="rdm-row">
              <strong>Категория:</strong> <span>{request.category}</span>
            </div>

            <div className="rdm-row">
              <strong>Дата:</strong> <span>{request.date}</span>
            </div>

            <div className="rdm-row">
              <strong>Приоритет:</strong> <span>{request.priority}</span>
            </div>

            <div className="rdm-row">
              <strong>Статус:</strong>
              <span className={`rdm-status-badge ${request.status}`}>
                {request.status}
              </span>
            </div>

            <div className="rdm-loc-block">
              <div className="rdm-row">
                <strong>Здание:</strong> <span>{request.building}</span>
              </div>

              <div className="rdm-row">
                <strong>Этаж:</strong> <span>{request.floor}</span>
              </div>

              <div className="rdm-row">
                <strong>Помещение:</strong> <span>{request.spot}</span>
              </div>
            </div>

            <div className="rdm-desc-box">
              <strong style={{ display: "block", marginBottom: 5 }}>
                Описание:
              </strong>
              {request.desc || "Нет описания"}
            </div>
          </div>

          <div>
            <strong className="rdm-section-title">Фото:</strong>

            {photoLoading ? (
              <div className="rdm-photo-loading">Загрузка фото...</div>
            ) : (
              <div className="rdm-gallery-grid">
                {request.images && request.images.length > 0 ? (
                  request.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      className="rdm-gallery-img"
                      alt="Фото"
                      onClick={() => window.open(src, "_blank")}
                    />
                  ))
                ) : (
                  <span className="rdm-photo-empty">Нет фото</span>
                )}

                {request.status === "New" && (
                  <button
                    className="rdm-add-photo-btn"
                    onClick={onAddPhotoClick}
                  >
                    <IconCamera />
                  </button>
                )}

                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={onFileChange}
                  accept="image/*"
                />
              </div>
            )}
          </div>

          <div className="rdm-comments-section">
            <span className="rdm-comments-title">Комментарии</span>

            <div className="rdm-comments-list">
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((c, i) => (
                  <div key={i} className="rdm-comment-bubble">
                    {c.text}
                  </div>
                ))
              ) : (
                <div className="rdm-comment-empty">Нет комментариев</div>
              )}
            </div>
          </div>

          <div className="rdm-actions">
            {request.status !== "Done" && (
              <div className="rdm-comment-input-group">
                <input
                  className="rdm-input"
                  placeholder="Сообщение..."
                  value={tempComment}
                  onChange={(e) => onCommentChange(e.target.value)}
                />
                <button className="rdm-btn-primary" onClick={onSendComment}>
                  Send
                </button>
              </div>
            )}

            {request.status === "New" && (
              <button className="rdm-btn-danger" onClick={onDeleteRequest}>
                <IconTrash /> Удалить заявку
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
