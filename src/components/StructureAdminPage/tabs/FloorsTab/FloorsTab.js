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

  return (
    <div className="structure-floors-tab">
      <div className="sa-tabGrid">
        <div className="sa-pane">
          <SectionCard title="Создать этаж">
            <div className="sft-form-group">
              <label className="sft-form-label">Здание</label>
              <select
                className="sft-form-select"
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

            <form onSubmit={onSubmitFloor} className="sa-form">
              <div className="sft-form-group">
                <label className="sft-form-label">Номер этажа</label>
                <input
                  type="number"
                  className="sft-form-input"
                  value={floorForm.floorNumber}
                  onChange={(e) =>
                    setFloorForm((p) => ({ ...p, floorNumber: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="sft-form-group">
                <label className="sft-form-label">Описание</label>
                <input
                  className="sft-form-input"
                  value={floorForm.description}
                  onChange={(e) =>
                    setFloorForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
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
