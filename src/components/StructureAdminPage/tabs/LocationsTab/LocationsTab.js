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

  return (
    <div className="sa-tabGrid">
      {/* LEFT */}
      <div className="sa-pane">
        <SectionCard title="Создать место">
          <div className="sa-twoCols">
            <div className="form-group">
              <label className="form-label">Здание</label>
              <select
                className="form-select"
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
              >
                <option value="">-- Выберите здание --</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Этаж</label>
              <select
                className="form-select"
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                disabled={!selectedBuildingId}
              >
                <option value="">-- Выберите этаж --</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    Этаж {f.floorNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={onSubmitLocation} className="sa-form">
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                className="form-input"
                value={locationForm.name}
                onChange={(e) =>
                  setLocationForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Аудитория</label>
              <div className="sa-checkboxRow">
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
                <span className="sa-muted">
                  {locationForm.isAudience ? "Да" : "Нет"}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <input
                className="form-input"
                value={locationForm.description}
                onChange={(e) =>
                  setLocationForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <button
              className="btn btn-primary"
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

      {/* RIGHT */}
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

                              <td>{l.isAudience ? "Да" : "Нет"}</td>

                              <td>
                                <span className="sa-truncate">
                                  {cut(l.description)}
                                </span>
                              </td>

                              <td className="sa-actionsCell">
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => onEditLocation?.(l)}
                                >
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline"
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
  );
}
