import React, { useEffect, useMemo, useState } from "react";
import "./WorkspaceModal.css";
import WorkspaceServerApi from "../../apiServices/workspaceApi";
import { IconBuilding, IconHome, IconMapPin } from "../Icons";

const PAGE_SIZE = 6;

const LEVEL = {
  BUILDINGS: "buildings",
  FLOORS: "floors",
  LOCATIONS: "locations",
};

const MAX_TEXT = 28;

function totalPagesFrom(pagination) {
  return (
    pagination?.TotalPages ??
    pagination?.totalPages ??
    pagination?.total_pages ??
    1
  );
}

function cutText(s) {
  if (!s) return "";
  return s.length > MAX_TEXT ? `${s.slice(0, MAX_TEXT)}…` : s;
}

function isLong(s) {
  return (s?.length ?? 0) > MAX_TEXT;
}

function MiniPagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;

  const go = (p) => onChange(Math.max(1, Math.min(totalPages, p)));

  const pages = [];
  const windowSize = 5;

  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="wsm-pagination">
      <button
        type="button"
        className="wsm-pageBtn"
        disabled={disabled || page === 1}
        onClick={() => go(page - 1)}
      >
        &lt;
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`wsm-pageBtn ${p === page ? "active" : ""}`}
          disabled={disabled}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className="wsm-pageBtn"
        disabled={disabled || page === totalPages}
        onClick={() => go(page + 1)}
      >
        &gt;
      </button>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  text,
  confirmText,
  cancelText = "Отмена",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="wsm-overlay" onClick={loading ? undefined : onClose}>
      <div className="wsm-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="wsm-confirmTitle">{title}</div>
        <div className="wsm-confirmText">{text}</div>

        <div className="wsm-confirmActions">
          <button
            type="button"
            className="wsm-btn wsm-btn-light"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`wsm-btn ${danger ? "wsm-btn-danger" : "wsm-btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Подождите..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceModal({ isOpen, onClose }) {
  const api = useMemo(() => new WorkspaceServerApi(), []);

  const [level, setLevel] = useState(LEVEL.BUILDINGS);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");

  const [buildingsOptions, setBuildingsOptions] = useState([]);
  const [floorsOptions, setFloorsOptions] = useState([]);

  const [expandedId, setExpandedId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const resetAll = () => {
    setLevel(LEVEL.BUILDINGS);
    setItems([]);
    setLoading(false);
    setError("");
    setPage(1);
    setTotalPages(1);
    setBuildingId("");
    setFloorId("");
    setBuildingsOptions([]);
    setFloorsOptions([]);
    setExpandedId(null);
    setConfirmOpen(false);
    setConfirmLoading(false);
    setConfirmMode(null);
    setConfirmTarget(null);
  };

  const levelButtons = (
    <div className="wsm-levelBtns">
      <button
        type="button"
        className={`wsm-levelBtn ${level === LEVEL.BUILDINGS ? "active" : ""}`}
        onClick={() => {
          setLevel(LEVEL.BUILDINGS);
          setPage(1);
          setExpandedId(null);
        }}
      >
        <IconBuilding /> Здания
      </button>

      <button
        type="button"
        className={`wsm-levelBtn ${level === LEVEL.FLOORS ? "active" : ""}`}
        onClick={() => {
          setLevel(LEVEL.FLOORS);
          setPage(1);
          setFloorId("");
          setExpandedId(null);
        }}
      >
        <IconHome /> Этажи
      </button>

      <button
        type="button"
        className={`wsm-levelBtn ${level === LEVEL.LOCATIONS ? "active" : ""}`}
        onClick={() => {
          setLevel(LEVEL.LOCATIONS);
          setPage(1);
          setExpandedId(null);
        }}
      >
        <IconMapPin /> Локации
      </button>
    </div>
  );

  const preloadBuildings = async () => {
    const res = await api.GetBuildings(1, 1000);
    if (res?.success) {
      setBuildingsOptions(res.items || []);
    }
  };

  const preloadFloors = async (selectedBuildingId) => {
    if (!selectedBuildingId) {
      setFloorsOptions([]);
      return;
    }

    const res = await api.GetFloors(selectedBuildingId, 1, 1000);
    if (res?.success) {
      setFloorsOptions(res.items || []);
    } else {
      setFloorsOptions([]);
    }
  };

  const loadItems = async (currentLevel, currentPage) => {
    setLoading(true);
    setError("");

    try {
      let res;

      if (currentLevel === LEVEL.BUILDINGS) {
        res = await api.GetBuildings(currentPage, PAGE_SIZE);
      } else if (currentLevel === LEVEL.FLOORS) {
        if (!buildingId) {
          setItems([]);
          setTotalPages(1);
          setError("Выберите здание");
          setLoading(false);
          return;
        }
        res = await api.GetFloors(buildingId, currentPage, PAGE_SIZE);
      } else {
        if (!buildingId || !floorId) {
          setItems([]);
          setTotalPages(1);
          setError("Выберите здание и этаж");
          setLoading(false);
          return;
        }
        res = await api.GetLocations(
          buildingId,
          floorId,
          currentPage,
          PAGE_SIZE,
        );
      }

      if (!res?.success) {
        setItems([]);
        setTotalPages(1);
        setError(res?.message || "Не удалось загрузить список");
        return;
      }

      setItems(res.items || []);
      setTotalPages(totalPagesFrom(res.pagination) || 1);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotalPages(1);
      setError("Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    resetAll();
    preloadBuildings();
    loadItems(LEVEL.BUILDINGS, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setExpandedId(null);

    if (level === LEVEL.BUILDINGS) {
      loadItems(LEVEL.BUILDINGS, 1);
    }

    if (level === LEVEL.FLOORS) {
      if (buildingId) {
        preloadFloors(buildingId);
      }
      loadItems(LEVEL.FLOORS, 1);
    }

    if (level === LEVEL.LOCATIONS) {
      if (buildingId) {
        preloadFloors(buildingId);
      }
      loadItems(LEVEL.LOCATIONS, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, buildingId, floorId]);

  const changePage = (p) => {
    setPage(p);
    loadItems(level, p);
  };

  const rowData = (item) => {
    if (level === LEVEL.BUILDINGS) {
      return {
        entityId: item?.building?.id,
        workspaceId: item?.id,
        isWorkspace: !!item?.isWorkspace,
        title: item?.building?.name || "Здание",
        sub: item?.building?.address || "",
        desc: item?.building?.description || "",
        dto: {
          buildingId: item?.building?.id ?? null,
          floorId: null,
          locationId: null,
        },
      };
    }

    if (level === LEVEL.FLOORS) {
      return {
        entityId: item?.floor?.id,
        workspaceId: item?.id,
        isWorkspace: !!item?.isWorkspace,
        title:
          item?.floor?.floorNumber != null
            ? `Этаж ${item.floor.floorNumber}`
            : "Этаж",
        sub: item?.floor?.description || "",
        desc: "",
        dto: {
          buildingId: buildingId || null,
          floorId: item?.floor?.id ?? null,
          locationId: null,
        },
      };
    }

    return {
      entityId: item?.location?.id,
      workspaceId: item?.id,
      isWorkspace: !!item?.isWorkspace,
      title: item?.location?.name || "Локация",
      sub: item?.location?.description || "",
      desc: item?.location?.isAudience ? "Аудитория" : "Локация",
      dto: {
        buildingId: buildingId || null,
        floorId: floorId || null,
        locationId: item?.location?.id ?? null,
      },
    };
  };

  const openCreateConfirm = (item) => {
    const row = rowData(item);
    setConfirmMode("create");
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const openDeleteConfirm = (item) => {
    const row = rowData(item);
    setConfirmMode("delete");
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmMode(null);
    setConfirmTarget(null);
  };

  const onConfirmAction = async () => {
    if (!confirmTarget) return;

    setConfirmLoading(true);
    setError("");

    try {
      if (confirmMode === "create") {
        const res = await api.CreateWorkspace(confirmTarget.dto);

        if (!res?.success) {
          throw new Error(res?.message || "Не удалось создать рабочую зону");
        }
      }

      if (confirmMode === "delete") {
        if (!confirmTarget.workspaceId) {
          throw new Error("Не найден id рабочей зоны для удаления");
        }

        const res = await api.DeleteWorkspace(confirmTarget.workspaceId);

        if (!res?.success) {
          throw new Error(res?.message || "Не удалось удалить рабочую зону");
        }
      }

      setConfirmOpen(false);
      setConfirmMode(null);
      setConfirmTarget(null);

      await loadItems(level, page);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Ошибка выполнения операции");
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmTitle =
    confirmMode === "create"
      ? "Создание рабочей зоны"
      : "Удаление рабочей зоны";

  const confirmText =
    confirmMode === "create"
      ? `Создать рабочую зону для "${confirmTarget?.title}"?`
      : `Удалить рабочую зону "${confirmTarget?.title}"?`;

  if (!isOpen) return null;

  return (
    <div className="workspace-modal-component">
      <div className="wsm-overlay" onClick={onClose}>
        <div className="wsm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="wsm-header">
            <h3 className="wsm-title">Управление рабочими зонами</h3>
            <button
              type="button"
              className="wsm-close"
              onClick={onClose}
              aria-label="Закрыть"
              title="Закрыть"
            >
              &times;
            </button>
          </div>

          <div className="wsm-top">
            {levelButtons}

            {(level === LEVEL.FLOORS || level === LEVEL.LOCATIONS) && (
              <div className="wsm-filters">
                <div className="wsm-filter">
                  <div className="wsm-label">Здание</div>
                  <select
                    className="wsm-select"
                    value={buildingId}
                    onChange={(e) => {
                      setBuildingId(e.target.value);
                      setFloorId("");
                    }}
                  >
                    <option value="">-- Выберите здание --</option>
                    {buildingsOptions.map((x, index) => (
                      <option
                        key={x?.building?.id || index}
                        value={x?.building?.id || ""}
                      >
                        {x?.building?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {level === LEVEL.LOCATIONS && (
                  <div className="wsm-filter">
                    <div className="wsm-label">Этаж</div>
                    <select
                      className="wsm-select"
                      value={floorId}
                      onChange={(e) => setFloorId(e.target.value)}
                      disabled={!buildingId}
                    >
                      <option value="">-- Выберите этаж --</option>
                      {floorsOptions.map((x, index) => (
                        <option
                          key={x?.floor?.id || index}
                          value={x?.floor?.id || ""}
                        >
                          Этаж {x?.floor?.floorNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {error && <div className="wsm-error">{error}</div>}
          </div>

          <div className="wsm-body">
            {loading ? (
              <div className="wsm-empty">Загрузка...</div>
            ) : items.length === 0 ? (
              <div className="wsm-empty">Список пуст</div>
            ) : (
              <div className="wsm-list">
                {items.map((item, index) => {
                  const row = rowData(item);
                  const open = expandedId === row.entityId;
                  const canExpand = isLong(row.title) || isLong(row.sub);

                  return (
                    <div key={row.entityId || index} className="wsm-item">
                      <div className="wsm-itemLeft">
                        <div className="wsm-itemTitleRow">
                          <div className="wsm-itemTitle">
                            {open ? row.title : cutText(row.title)}
                            {level === LEVEL.LOCATIONS && row.desc ? (
                              <span className="wsm-badge">{row.desc}</span>
                            ) : null}
                          </div>

                          {canExpand && (
                            <button
                              type="button"
                              className={`wsm-expandBtn ${open ? "open" : ""}`}
                              onClick={() =>
                                setExpandedId(open ? null : row.entityId)
                              }
                            >
                              ▾
                            </button>
                          )}
                        </div>

                        {row.sub ? (
                          <div className="wsm-itemSub">
                            {open ? row.sub : cutText(row.sub)}
                          </div>
                        ) : null}
                      </div>

                      <div className="wsm-itemRight">
                        {row.isWorkspace ? (
                          <button
                            type="button"
                            className="wsm-actionBtn delete"
                            onClick={() => openDeleteConfirm(item)}
                            title="Удалить рабочую зону"
                          >
                            🗑 Удалить
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="wsm-actionBtn create"
                            onClick={() => openCreateConfirm(item)}
                            title="Создать рабочую зону"
                          >
                            ＋ Создать зону
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="wsm-footer">
            <MiniPagination
              page={page}
              totalPages={totalPages}
              onChange={changePage}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        text={confirmText}
        confirmText={confirmMode === "create" ? "Создать" : "Удалить"}
        danger={confirmMode === "delete"}
        loading={confirmLoading}
        onConfirm={onConfirmAction}
        onClose={closeConfirm}
      />
    </div>
  );
}

export default WorkspaceModal;
