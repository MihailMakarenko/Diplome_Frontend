import React from "react";
import "./EmployeeCard.css";
import { IconMapPin, IconHome, IconSettings } from "../Icons";
import avatar from "../../imgs/avatar.jpg";

const EmployeeCard = ({ emp, onOpenSettings, onViewDetails }) => {
  const isOnline = emp.status === "Online";
  const statusLabel = isOnline ? "На работе" : "Не на месте";

  return (
    <div className="employee-card-component">
      <div className="employee-card">
        <div className={`card-status-strip status-${emp.status}`}></div>

        <div className="emp-header">
          <div className="emp-profile">
            <img
              src={emp.avatar || avatar}
              alt=""
              className="emp-avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = avatar;
              }}
            />
            <div className="emp-names">
              <h3>{emp.name}</h3>
            </div>
          </div>

          <span className={`status-chip chip-${emp.status}`}>
            {statusLabel}
          </span>
        </div>

        <div className="locations-block">
          <div className="loc-row">
            <div className="loc-icon">
              <IconMapPin />
            </div>
            <div>
              <span className="loc-label">Сейчас:</span>{" "}
              <span
                className={`current-location ${isOnline ? "online" : "offline"}`}
              >
                {emp.currentLocation || "Неизвестно"}
              </span>
            </div>
          </div>

          <div className="loc-row">
            <div className="loc-icon">
              <IconHome />
            </div>
            <div>
              <span className="loc-label">База:</span>{" "}
              <span>{emp.defaultLocation || "—"}</span>
            </div>
          </div>
        </div>

        <div className="zones-compact">
          <span>Настройки сотрудника</span>

          <button className="btn-icon-edit" onClick={() => onOpenSettings(emp)}>
            <IconSettings />
          </button>
        </div>

        <div className="tasks-preview-container">
          <button className="btn-view-more" onClick={() => onViewDetails(emp)}>
            К заявкам
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
