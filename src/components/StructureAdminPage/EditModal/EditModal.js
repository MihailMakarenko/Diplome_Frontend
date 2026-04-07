import React from "react";
import "./EditModal.css";

export default function EditModal({
  isOpen,
  title,
  onClose,
  onSave,
  saving,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="structure-edit-modal">
      <div className="sa-modalOverlay" onClick={onClose}>
        <div className="sa-modalCard" onClick={(e) => e.stopPropagation()}>
          <div className="sa-modalHeader">
            <h3 className="sa-modalTitle">{title}</h3>

            <button type="button" className="sa-closeBtn" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="sa-modalBody">{children}</div>

          <div className="sa-modalFooter">
            <button
              type="button"
              className="sa-saveBtn"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
