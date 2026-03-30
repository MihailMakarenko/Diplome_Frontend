import React from "react";
import "./StructureAdminHeader.css";

const TAB = {
  BUILDINGS: "buildings",
  FLOORS: "floors",
  LOCATIONS: "locations",
};

export default function StructureAdminHeader({ tab, onChangeTab }) {
  return (
    <div className="sa-header">
      <div>
        <h1 className="sa-title">Здания / Этажи / Места</h1>
        <div className="sa-subtitle">
          Создание, просмотр, редактирование (с пагинацией)
        </div>
      </div>

      <div className="sa-tabs">
        <button
          type="button"
          className={`btn ${tab === TAB.BUILDINGS ? "btn-primary" : "btn-outline"} sa-tabBtn`}
          onClick={() => onChangeTab(TAB.BUILDINGS)}
        >
          Здания
        </button>
        <button
          type="button"
          className={`btn ${tab === TAB.FLOORS ? "btn-primary" : "btn-outline"} sa-tabBtn`}
          onClick={() => onChangeTab(TAB.FLOORS)}
        >
          Этажи
        </button>
        <button
          type="button"
          className={`btn ${tab === TAB.LOCATIONS ? "btn-primary" : "btn-outline"} sa-tabBtn`}
          onClick={() => onChangeTab(TAB.LOCATIONS)}
        >
          Места
        </button>
      </div>
    </div>
  );
}
