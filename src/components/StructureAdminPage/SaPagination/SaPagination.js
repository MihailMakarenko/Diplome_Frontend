import React from "react";
import "./SaPagination.css";

export default function SaPagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;

  return (
    <div className="structure-sa-pagination">
      <div className="sa-pagination">
        <button
          className="sa-pageBtn"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          &lt;
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`sa-pageBtn ${page === i + 1 ? "isActive" : ""}`}
            disabled={disabled}
            onClick={() => onChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          className="sa-pageBtn"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
