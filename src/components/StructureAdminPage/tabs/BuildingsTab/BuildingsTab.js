import React, { useMemo, useState } from "react";
import "./BuildingsTab.css";
import SectionCard from "../../../StructureAdminPage/SectionCard/SectionCard";
import SaPagination from "../../../StructureAdminPage/SaPagination/SaPagination";

export default function BuildingsTab({
  buildingForm,
  setBuildingForm,
  savingBuilding,
  onSubmitBuilding,
  buildings,
  loadingList,
  bPage,
  bTotalPages,
  onBuildingsPageChange,
  onEditBuilding,
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

  const canExpandBuilding = (b) =>
    isLong(b?.name) || isLong(b?.address) || isLong(b?.description);

  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="structure-buildings-tab">
      <div className="sa-tabGrid">
        <div className="sa-pane">
          <SectionCard title="Создать здание">
            <form onSubmit={onSubmitBuilding} className="sa-form">
              <div className="sbt-form-group">
                <label className="sbt-form-label">Название</label>
                <input
                  className="sbt-form-input"
                  value={buildingForm.name}
                  onChange={(e) =>
                    setBuildingForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="sbt-form-group">
                <label className="sbt-form-label">Описание</label>
                <input
                  className="sbt-form-input"
                  value={buildingForm.description}
                  onChange={(e) =>
                    setBuildingForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="sbt-form-group">
                <label className="sbt-form-label">Адрес</label>
                <input
                  className="sbt-form-input"
                  value={buildingForm.address}
                  onChange={(e) =>
                    setBuildingForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>

              <button
                className="sbt-btn sbt-btn-primary"
                disabled={savingBuilding}
                type="submit"
              >
                {savingBuilding ? "Создание..." : "Создать"}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="sa-pane">
          <SectionCard title="Список зданий">
            {loadingList ? (
              <div className="sa-loading">Загрузка...</div>
            ) : (
              <div className="sa-listLayout">
                <div className="sa-listScroll">
                  <div className="sa-tableWrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Название</th>
                          <th>Адрес</th>
                          <th className="sa-actionsCol">Действия</th>
                        </tr>
                      </thead>

                      <tbody>
                        {buildings.map((b) => {
                          const open = expandedId === b.id;
                          const canExpand = canExpandBuilding(b);

                          return (
                            <React.Fragment key={b.id}>
                              <tr>
                                <td>
                                  <div className="sa-cellWithExpander">
                                    <span className="sa-truncate">
                                      {cut(b.name)}
                                    </span>

                                    {canExpand && (
                                      <button
                                        type="button"
                                        className="sa-expanderBtn"
                                        onClick={() => toggle(b.id)}
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

                                <td>
                                  <span className="sa-truncate">
                                    {cut(b.address)}
                                  </span>
                                </td>

                                <td className="sa-actionsCell">
                                  <button
                                    type="button"
                                    className="sbt-btn sbt-btn-outline"
                                    onClick={() => onEditBuilding?.(b)}
                                  >
                                    Редактировать
                                  </button>
                                </td>
                              </tr>

                              {open && (
                                <tr className="sa-detailsRow">
                                  <td colSpan={3}>
                                    <div className="sa-detailsBox">
                                      <div className="sa-detailsGrid">
                                        <div className="sa-detailsLabel">
                                          Название
                                        </div>
                                        <div className="sa-detailsValue">
                                          {b.name || "-"}
                                        </div>

                                        <div className="sa-detailsLabel">
                                          Адрес
                                        </div>
                                        <div className="sa-detailsValue">
                                          {b.address || "-"}
                                        </div>

                                        <div className="sa-detailsLabel">
                                          Описание
                                        </div>
                                        <div className="sa-detailsValue">
                                          {b.description || "-"}
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
                    page={bPage}
                    totalPages={bTotalPages}
                    disabled={loadingList}
                    onChange={onBuildingsPageChange}
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
