import React from "react";
import "./ConfirmModal.css";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  return (
    <div className="confirm-modal">
      <div className="confirm-modal-overlay" onClick={onClose}>
        <div
          className="confirm-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: "20px" }}>
            <h3 className="confirm-modal-title">{title || "Подтверждение"}</h3>

            <p className="confirm-modal-message">
              {message || "Вы уверены, что хотите выполнить это действие?"}
            </p>
          </div>

          <div className="confirm-modal-actions">
            <button
              className="confirm-modal-btn confirm-modal-btn-outline"
              onClick={onClose}
            >
              Отмена
            </button>

            <button
              className="confirm-modal-btn confirm-modal-btn-danger"
              onClick={handleConfirm}
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
