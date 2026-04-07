import React from "react";
import "./StructureAdminHeader.css";

const TAB = {
  BUILDINGS: "buildings",
  FLOORS: "floors",
  LOCATIONS: "locations",
};

export default function StructureAdminHeader({ tab, onChangeTab }) {
  return (
    <div className="structure-admin-header">
      <div className="sa-header">
        <div className="sa-headerLeft">
          <h1 className="sa-title">Здания / Этажи / Места</h1>
          <div className="sa-subtitle">
            Создание, просмотр, редактирование (с пагинацией)
          </div>
        </div>

        <div className="sa-tabs">
          <button
            type="button"
            className={`sa-tabBtn ${tab === TAB.BUILDINGS ? "sa-btn-primary" : "sa-btn-outline"}`}
            onClick={() => onChangeTab(TAB.BUILDINGS)}
          >
            Здания
          </button>

          <button
            type="button"
            className={`sa-tabBtn ${tab === TAB.FLOORS ? "sa-btn-primary" : "sa-btn-outline"}`}
            onClick={() => onChangeTab(TAB.FLOORS)}
          >
            Этажи
          </button>

          <button
            type="button"
            className={`sa-tabBtn ${tab === TAB.LOCATIONS ? "sa-btn-primary" : "sa-btn-outline"}`}
            onClick={() => onChangeTab(TAB.LOCATIONS)}
          >
            Места
          </button>
        </div>
      </div>
    </div>
  );
}
