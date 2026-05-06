import React, { useMemo, useState } from "react";
import "./FloorsTab.css";
import SectionCard from "../../../StructureAdminPage/SectionCard/SectionCard";
import SaPagination from "../../../StructureAdminPage/SaPagination/SaPagination";

export default function FloorsTab({
  buildings,
  selectedBuildingId,
  setSelectedBuildingId,
  floorForm,
  setFloorForm,
  savingFloor,
  onSubmitFloor,
  floors,
  loadingList,
  fPage,
  fTotalPages,
  onFloorsPageChange,
  onEditFloor,
  onDeleteFloor,
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

  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // Валидация перед вызовом родительского onSubmit
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Валидация здания
    if (!selectedBuildingId) {
      newErrors.building = "Необходимо выбрать здание";
    }

    // Валидация этажа (0-40)
    const fNum = parseInt(floorForm.floorNumber);
    if (isNaN(fNum) || fNum < 0 || fNum > 40) {
      newErrors.floorNumber = "Номер этажа должен быть от 0 до 40";
    }

    // Валидация описания (2-200)
    const descLen = floorForm.description?.trim().length || 0;
    if (descLen < 2 || descLen > 200) {
      newErrors.description = "Описание должно быть от 2 до 200 символов";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmitFloor(e);
  };

  return (
    <div className="structure-floors-tab">
      <div className="sa-tabGrid">
        <div className="sa-pane">
          <SectionCard title="Создать этаж">
            <div className="sft-form-group">
              <label className="sft-form-label">Здание</label>
              <select
                className={`sft-form-select ${errors.building ? "sa-inputError" : ""}`}
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value);
                  setErrors((prev) => ({ ...prev, building: null }));
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

            <form onSubmit={handleSubmit} className="sa-form">
              <div className="sft-form-group">
                <label className="sft-form-label">Номер этажа (0 - 40)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  className={`sft-form-input ${errors.floorNumber ? "sa-inputError" : ""}`}
                  value={floorForm.floorNumber}
                  onChange={(e) => {
                    setFloorForm((p) => ({
                      ...p,
                      floorNumber: e.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, floorNumber: null }));
                  }}
                  required
                />
                {errors.floorNumber && (
                  <span className="sa-errorText">{errors.floorNumber}</span>
                )}
              </div>

              <div className="sft-form-group">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <label className="sft-form-label">Описание</label>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {floorForm.description?.length || 0}/200
                  </span>
                </div>
                <input
                  className={`sft-form-input ${errors.description ? "sa-inputError" : ""}`}
                  value={floorForm.description}
                  maxLength="200"
                  placeholder="От 2 до 200 символов"
                  onChange={(e) => {
                    setFloorForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, description: null }));
                  }}
                  required
                />
                {errors.description && (
                  <span className="sa-errorText">{errors.description}</span>
                )}
              </div>

              <button
                className="sft-btn sft-btn-primary"
                disabled={savingFloor}
                type="submit"
              >
                {savingFloor ? "Создание..." : "Создать"}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="sa-pane">
          <SectionCard title="Список этажей">
            {!selectedBuildingId ? (
              <div className="sa-loading">
                Выберите здание, чтобы увидеть этажи
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
                          <th>Этаж</th>
                          <th>Описание</th>
                          <th className="sa-actionsCol">Действия</th>
                        </tr>
                      </thead>

                      <tbody>
                        {floors.map((f) => {
                          const open = expandedId === f.id;
                          const canExpand = isLong(f?.description);

                          return (
                            <React.Fragment key={f.id}>
                              <tr>
                                <td className="sa-strong">{f.floorNumber}</td>

                                <td>
                                  <div className="sa-cellWithExpander">
                                    <span className="sa-truncate">
                                      {cut(f.description)}
                                    </span>

                                    {canExpand && (
                                      <button
                                        type="button"
                                        className="sa-expanderBtn"
                                        onClick={() => toggle(f.id)}
                                        aria-expanded={open}
                                        aria-label={
                                          open ? "Свернуть" : "Развернуть"
                                        }
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

                                <td className="sa-actionsCell">
                                  <button
                                    type="button"
                                    className="sft-btn sft-btn-outline"
                                    onClick={() => onEditFloor?.(f)}
                                  >
                                    Редактировать
                                  </button>

                                  <button
                                    type="button"
                                    className="sft-btn sft-btn-danger"
                                    onClick={() => onDeleteFloor?.(f.id)}
                                  >
                                    Удалить
                                  </button>
                                </td>
                              </tr>

                              {open && (
                                <tr className="sa-detailsRow">
                                  <td colSpan={3}>
                                    <div className="sa-detailsBox">
                                      <div className="sa-detailsGrid">
                                        <div className="sa-detailsLabel">
                                          Этаж
                                        </div>
                                        <div className="sa-detailsValue">
                                          {f.floorNumber}
                                        </div>

                                        <div className="sa-detailsLabel">
                                          Описание
                                        </div>
                                        <div className="sa-detailsValue">
                                          {f.description || "-"}
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
                    page={fPage}
                    totalPages={fTotalPages}
                    disabled={loadingList}
                    onChange={onFloorsPageChange}
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
