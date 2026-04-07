import React from "react";
import "./RequestDetailsForManager.css";

/**
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
  if (!isOpen) return null;

  if (!request) {
    return (
      <div className="request-details-manager-modal">
        <div className="rdmm-overlay" onClick={onClose}>
          <div className="rdmm-card" onClick={(e) => e.stopPropagation()}>
            <div className="rdmm-empty">Данные заявки не найдены</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-details-manager-modal">
      <div className="rdmm-overlay" onClick={onClose}>
        <div className="rdmm-card" onClick={(e) => e.stopPropagation()}>
          <div className="rdmm-header">
            <h3 className="rdmm-title">
              Заявка №
              {request.number ??
                request.id?.toString().substring(0, 6).toUpperCase()}
            </h3>

            <button className="rdmm-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="rdmm-scroll">
            <div className="rdmm-info">
              <div className="rdmm-row">
                <strong>Категория:</strong> <span>{request.category}</span>
              </div>

              <div className="rdmm-row">
                <strong>Дата:</strong> <span>{request.date}</span>
              </div>

              <div className="rdmm-row">
                <strong>Приоритет:</strong> <span>{request.priority}</span>
              </div>

              <div className="rdmm-row">
                <strong>Статус:</strong>
                <span className="rdmm-status-badge">{request.status}</span>
              </div>

              <div className="rdmm-loc-block">
                <div className="rdmm-row">
                  <strong>Здание:</strong> <span>{request.building}</span>
                </div>

                <div className="rdmm-row">
                  <strong>Этаж:</strong> <span>{request.floor}</span>
                </div>

                <div className="rdmm-row">
                  <strong>Помещение:</strong> <span>{request.spot}</span>
                </div>
              </div>

              <div className="rdmm-desc-box">
                <strong
                  style={{
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Описание:
                </strong>
                {request.desc || "Нет описания"}
              </div>
            </div>

            <div>
              <strong className="rdmm-section-title">Фото:</strong>

              {photoLoading ? (
                <div className="rdmm-photo-loading">Загрузка фото...</div>
              ) : (
                <div className="rdmm-gallery-grid">
                  {request.images && request.images.length > 0 ? (
                    request.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        className="rdmm-gallery-img"
                        alt={`Фото ${i + 1}`}
                        onClick={() => window.open(src, "_blank")}
                      />
                    ))
                  ) : (
                    <span className="rdmm-photo-empty">Нет фото</span>
                  )}
                </div>
              )}
            </div>

            <div className="rdmm-comments-section">
              <span className="rdmm-comments-title">Комментарии</span>

              <div className="rdmm-comments-list">
                {request.comments && request.comments.length > 0 ? (
                  request.comments.map((c, i) => (
                    <div key={i} className="rdmm-comment-bubble">
                      {c.text}
                    </div>
                  ))
                ) : (
                  <div className="rdmm-comment-empty">Нет комментариев</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsForManagerModal;
