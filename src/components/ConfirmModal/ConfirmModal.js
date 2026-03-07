import React from "react";
import "../../pages/AdminPanel/AdminPanel.css";
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "400px", padding: "25px", borderRadius: "16px" }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: "700",
              marginBottom: "10px",
              color: "#1e293b",
            }}
          >
            {title || "Подтверждение"}
          </h3>
          <p
            style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: "1.5" }}
          >
            {message || "Вы уверены, что хотите выполнить это действие?"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
          <button
            className="btn btn-outline"
            style={{
              flex: 1,
              justifyContent: "center",
              borderColor: "#cbd5e1",
            }}
            onClick={onClose}
          >
            Отмена
          </button>

          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              justifyContent: "center",
              background: "#ef4444",
              border: "none",
            }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
