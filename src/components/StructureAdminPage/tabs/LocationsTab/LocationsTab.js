import React, { useMemo, useState } from "react";
import "./LocationsTab.css";
import SectionCard from "../../../StructureAdminPage/SectionCard/SectionCard";
import SaPagination from "../../../StructureAdminPage/SaPagination/SaPagination";

export default function LocationsTab({
  buildings,
  floors,
  selectedBuildingId,
  setSelectedBuildingId,
  selectedFloorId,
  setSelectedFloorId,
  locationForm,
  setLocationForm,
  savingLocation,
  onSubmitLocation,
  locations,
  loadingList,
  lPage,
  lTotalPages,
  locationsServerPaged,
  onLocationsPageChange,
  onEditLocation,
  onDeleteLocation,
}) {
  const MAX_LEN = 20;
  const [errors, setErrors] = useState({});

  const cut = useMemo(
    () => (s) => {
      if (!s) return "";
      return s.length > MAX_LEN ? s.slice(0, MAX_LEN) + "…" : s;
    },
    [],
  );

  const isLong = useMemo(() => (s) => (s?.length ?? 0) > MAX_LEN, []);
  const canExpandLocation = (l) => isLong(l?.name) || isLong(l?.description);

  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // ✅ ВАЛИДАЦИЯ
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const nameLen = locationForm.name?.trim().length || 0;
    const descLen = locationForm.description?.trim().length || 0;

    if (nameLen < 2 || nameLen > 30) {
      newErrors.name = "Название должно быть от 2 до 30 символов";
    }

    if (descLen < 2 || descLen > 200) {
      newErrors.description = "Описание должно быть от 2 до 200 символов";
    }

    if (!selectedBuildingId) {
      newErrors.building = "Выберите здание";
    }

    if (!selectedFloorId) {
      newErrors.floor = "Выберите этаж";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmitLocation(e);
  };

  return (
    <div className="structure-locations-tab">
      <div className="sa-tabGrid">
        <div className="sa-pane">
          <SectionCard title="Создать место">
            <div className="sa-twoCols">
              <div className="slt-form-group">
                <label className="slt-form-label">Здание</label>
                <select
                  className={`slt-form-select ${errors.building ? "sa-inputError" : ""}`}
                  value={selectedBuildingId}
                  onChange={(e) => {
                    setSelectedBuildingId(e.target.value);
                    setErrors((p) => ({ ...p, building: null }));
                  }}
                >
                  <option value="">-- Выберите здание --</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.building && (
                  <span className="sa-errorText">{errors.building}</span>
                )}
              </div>

              <div className="slt-form-group">
                <label className="slt-form-label">Этаж</label>
                <select
                  className={`slt-form-select ${errors.floor ? "sa-inputError" : ""}`}
                  value={selectedFloorId}
                  onChange={(e) => {
                    setSelectedFloorId(e.target.value);
                    setErrors((p) => ({ ...p, floor: null }));
                  }}
                  disabled={!selectedBuildingId}
                >
                  <option value="">-- Выберите этаж --</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      Этаж {f.floorNumber}
                    </option>
                  ))}
                </select>
                {errors.floor && (
                  <span className="sa-errorText">{errors.floor}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="sa-form">
              <div className="slt-form-group">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <label className="slt-form-label">Название</label>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {locationForm.name?.length || 0}/30
                  </span>
                </div>
                <input
                  className={`slt-form-input ${errors.name ? "sa-inputError" : ""}`}
                  value={locationForm.name}
                  maxLength={30}
                  onChange={(e) => {
                    setLocationForm((p) => ({ ...p, name: e.target.value }));
                    setErrors((p) => ({ ...p, name: null }));
                  }}
                  required
                />
                {errors.name && (
                  <span className="sa-errorText">{errors.name}</span>
                )}
              </div>

              <div className="slt-form-group">
                <label className="slt-form-label">Аудитория</label>
                <div className="slt-checkboxRow">
                  <input
                    type="checkbox"
                    checked={locationForm.isAudience}
                    onChange={(e) =>
                      setLocationForm((p) => ({
                        ...p,
                        isAudience: e.target.checked,
                      }))
                    }
                  />
                  <span className="slt-muted">
                    {locationForm.isAudience ? "Да" : "Нет"}
                  </span>
                </div>
              </div>

              <div className="slt-form-group">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <label className="slt-form-label">Описание</label>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {locationForm.description?.length || 0}/200
                  </span>
                </div>
                <input
                  className={`slt-form-input ${errors.description ? "sa-inputError" : ""}`}
                  value={locationForm.description}
                  maxLength={200}
                  onChange={(e) => {
                    setLocationForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }));
                    setErrors((p) => ({ ...p, description: null }));
                  }}
                  required
                />
                {errors.description && (
                  <span className="sa-errorText">{errors.description}</span>
                )}
              </div>

              <button
                className="slt-btn slt-btn-primary"
                disabled={savingLocation}
                type="submit"
              >
                {savingLocation ? "Создание..." : "Создать"}
              </button>

              {!locationsServerPaged && selectedFloorId && (
                <div className="sa-hint">
                  Пагинация для мест на сервере не обнаружена — используется
                  локальная.
                </div>
              )}
            </form>
          </SectionCard>
        </div>

        {/* СПИСОК */}
        <div className="sa-pane">
          <SectionCard title="Список мест">
            {!selectedFloorId ? (
              <div className="sa-loading">
                Выберите здание и этаж, чтобы увидеть места
              </div>
            ) : loadingList ? (
              <div className="sa-loading">Загрузка...</div>
            ) : (
              <div className="sa-listLayout">
                <div className="sa-listScroll">
                  <div className="sa-tableWrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Название</th>
                          <th>Аудитория</th>
                          <th>Описание</th>
                          <th className="sa-actionsCol">Действия</th>
                        </tr>
                      </thead>

                      <tbody>
                        {locations.map((l) => {
                          const open = expandedId === l.id;
                          const canExpand = canExpandLocation(l);

                          return (
                            <React.Fragment key={l.id}>
                              <tr>
                                <td>
                                  <div className="sa-cellWithExpander">
                                    <span className="sa-truncate">
                                      {cut(l.name)}
                                    </span>

                                    {canExpand && (
                                      <button
                                        type="button"
                                        className="sa-expanderBtn"
                                        onClick={() => toggle(l.id)}
                                      >
                                        <span
                                          className={`sa-caret ${open ? "open" : ""}`}
                                        >
                                          ▸
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td>{l.isAudience ? "Да" : "Нет"}</td>

                                <td>
                                  <span className="sa-truncate">
                                    {cut(l.description)}
                                  </span>
                                </td>

                                <td className="sa-actionsCell">
                                  <button
                                    type="button"
                                    className="slt-btn slt-btn-outline"
                                    onClick={() => onEditLocation?.(l)}
                                  >
                                    Редактировать
                                  </button>

                                  <button
                                    type="button"
                                    className="slt-btn slt-btn-danger"
                                    onClick={() => onDeleteLocation?.(l.id)}
                                  >
                                    Удалить
                                  </button>
                                </td>
                              </tr>

                              {open && (
                                <tr className="sa-detailsRow">
                                  <td colSpan={4}>
                                    <div className="sa-detailsBox">
                                      <div className="sa-detailsGrid">
                                        <div className="sa-detailsLabel">
                                          Название
                                        </div>
                                        <div className="sa-detailsValue">
                                          {l.name || "-"}
                                        </div>

                                        <div className="sa-detailsLabel">
                                          Аудитория
                                        </div>
                                        <div className="sa-detailsValue">
                                          {l.isAudience ? "Да" : "Нет"}
                                        </div>

                                        <div className="sa-detailsLabel">
                                          Описание
                                        </div>
                                        <div className="sa-detailsValue">
                                          {l.description || "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="sa-listFooter">
                  <SaPagination
                    page={lPage}
                    totalPages={lTotalPages}
                    disabled={loadingList}
                    onChange={onLocationsPageChange}
                  />
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
