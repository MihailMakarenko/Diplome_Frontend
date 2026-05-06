import React from "react";
import { useNavigate } from "react-router-dom";
import "./Forbidden.css";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="forbidden-page-shell">
      <div className="forbidden-card">
        <p className="forbidden-code">403</p>
        <h1 className="forbidden-title">Нет доступа</h1>
        <p className="forbidden-text">
          У вас нет прав для просмотра этой страницы. Если вы считаете, что это
          ошибка — обратитесь к администратору.
        </p>

        <div className="forbidden-actions">
          <button
            className="forbidden-btn forbidden-btn-secondary"
            onClick={() => navigate(-1)}
            type="button"
          >
            Назад
          </button>

          <button
            className="forbidden-btn forbidden-btn-primary"
            onClick={() => navigate("/app", { replace: true })}
            type="button"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
