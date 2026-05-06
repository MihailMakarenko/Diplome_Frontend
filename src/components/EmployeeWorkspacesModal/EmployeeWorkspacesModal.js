import React, { useEffect, useMemo, useState } from "react";
import "./EmployeeWorkspacesModal.css";
import EmployeeWorkspacesServerApi from "../../apiServices/employeeWorkspaceApi";
import WorkspaceServerApi from "../../apiServices/workspaceApi";
import { IconBuilding, IconHome, IconMapPin } from "../Icons";

const PAGE_SIZE = 6;

const MODE = {
  ASSIGNED: "assigned",
  ASSIGN: "assign",
};

const LEVEL = {
  BUILDINGS: "buildings",
  FLOORS: "floors",
  LOCATIONS: "locations",
};

const MAX_LOC_TEXT = 20;

function totalPagesFrom(pagination) {
  return (
    pagination?.TotalPages ??
    pagination?.totalPages ??
    pagination?.total_pages ??
    1
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function cut20(s) {
  if (!s) return "";
  return s.length > MAX_LOC_TEXT ? s.slice(0, MAX_LOC_TEXT) + "…" : s;
}

function isLong20(s) {
  return (s?.length ?? 0) > MAX_LOC_TEXT;
}

function MiniPagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;

  const go = (p) => onChange(Math.max(1, Math.min(totalPages, p)));

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const showLeftDots = start > 1;
  const showRightDots = end < totalPages;

  return (
    <div className="empws-pagination">
      <button
        type="button"
        className="empws-pageBtn"
        disabled={disabled || page === 1}
        onClick={() => go(page - 1)}
      >
        &lt;
      </button>

      {showLeftDots && (
        <>
          <button
            type="button"
            className="empws-pageBtn"
            disabled={disabled}
            onClick={() => go(1)}
          >
            1
          </button>
          <span className="empws-dots">…</span>
        </>
      )}

      {pages.map((p) => (
        <button
          type="button"
          key={p}
          className={`empws-pageBtn ${p === page ? "active" : ""}`}
          disabled={disabled}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      {showRightDots && (
        <>
          <span className="empws-dots">…</span>
          <button
            type="button"
            className="empws-pageBtn"
            disabled={disabled}
            onClick={() => go(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className="empws-pageBtn"
        disabled={disabled || page === totalPages}
        onClick={() => go(page + 1)}
      >
        &gt;
      </button>
    </div>
  );
}

function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
  title,
  subtitle,
}) {
  if (!open) return null;

  return (
    <div
      className="ewm-confirm-overlay"
      onClick={loading ? undefined : onClose}
    >
      <div className="ewm-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="ewm-confirm-title">Подтверждение удаления</div>

        <div className="ewm-confirm-text">
          {title || "Вы действительно хотите удалить назначение?"}
        </div>

        {subtitle ? <div className="ewm-confirm-sub">{subtitle}</div> : null}

        <div className="ewm-confirm-actions">
          <button
            type="button"
            className="ewm-btn ewm-btn-light"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>

          <button
            type="button"
            className="ewm-btn ewm-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeWorkspacesModal({ isOpen, onClose, employee }) {
  const employeeApi = useMemo(() => new EmployeeWorkspacesServerApi(), []);
  const workspaceApi = useMemo(() => new WorkspaceServerApi(), []);

  const [mode, setMode] = useState(MODE.ASSIGNED);
  const [assignedLevel, setAssignedLevel] = useState(LEVEL.BUILDINGS);
  const [assignLevel, setAssignLevel] = useState(LEVEL.BUILDINGS);

  const [assignedItems, setAssignedItems] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState("");
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedTotalPages, setAssignedTotalPages] = useState(1);

  const [waItems, setWaItems] = useState([]);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");
  const [waPage, setWaPage] = useState(1);
  const [waTotalPages, setWaTotalPages] = useState(1);

  const [ctxBuildingId, setCtxBuildingId] = useState("");
  const [ctxFloorId, setCtxFloorId] = useState("");

  const [buildingsWA, setBuildingsWA] = useState([]);
  const [floorsWA, setFloorsWA] = useState([]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [desire, setDesire] = useState("Постоянно");
  const [saving, setSaving] = useState(false);

  const [expandedAssignedId, setExpandedAssignedId] = useState(null);
  const [expandedAssignId, setExpandedAssignId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetAssigned = () => {
    setAssignedItems([]);
    setAssignedError("");
    setAssignedPage(1);
    setAssignedTotalPages(1);
    setExpandedAssignedId(null);
  };

  const resetWithAssignment = () => {
    setWaItems([]);
    setWaError("");
    setWaPage(1);
    setWaTotalPages(1);
    setSelectedIds(new Set());
    setExpandedAssignId(null);
  };

  const levelButtons = (current, onPick) => (
    <div className="empws-levelBtns">
      <button
        type="button"
        className={`empws-levelBtn ${current === LEVEL.BUILDINGS ? "active" : ""}`}
        onClick={() => onPick(LEVEL.BUILDINGS)}
      >
        <IconBuilding /> Здания
      </button>

      <button
        type="button"
        className={`empws-levelBtn ${current === LEVEL.FLOORS ? "active" : ""}`}
        onClick={() => onPick(LEVEL.FLOORS)}
      >
        <IconHome /> Этажи
      </button>

      <button
        type="button"
        className={`empws-levelBtn ${current === LEVEL.LOCATIONS ? "active" : ""}`}
        onClick={() => onPick(LEVEL.LOCATIONS)}
      >
        <IconMapPin /> Места
      </button>
    </div>
  );

  const assignedBuildingLabel = (a) => {
    const b = a?.workspace?.building;
    return b?.address ? `${b?.name} — ${b?.address}` : b?.name || "Здание";
  };

  const assignedFloorLabel = (a) => {
    const b = a?.workspace?.building;
    const f = a?.workspace?.floor;
    const floorText = f?.floorNumber != null ? `этаж ${f.floorNumber}` : "этаж";
    return b?.name ? `${b.name} — ${floorText}` : floorText;
  };

  const assignedLocationFields = (a) => {
    const b = a?.workspace?.building;
    const f = a?.workspace?.floor;
    const l = a?.workspace?.location;

    const title = l?.name || "Место";
    const desc = l?.description || "";
    const sub =
      (b?.name ? b.name : "") +
      (f?.floorNumber != null ? `, этаж ${f.floorNumber}` : "");

    return { title, desc, sub };
  };

  const waRow = (x) => {
    if (assignLevel === LEVEL.BUILDINGS) {
      const b = x.building;
      return {
        id: b?.id,
        title: b?.name,
        sub: b?.address,
        isAssigned: !!x.isAssigned,
      };
    }

    if (assignLevel === LEVEL.FLOORS) {
      const f = x.floor;
      return {
        id: f?.id,
        title: `Этаж ${f?.floorNumber}`,
        sub: f?.description || "",
        isAssigned: !!x.isAssigned,
      };
    }

    const l = x.location;
    return {
      id: l?.id,
      title: l?.name,
      sub: l?.description || "",
      isAssigned: !!x.isAssigned,
      isAudience: !!l?.isAudience,
    };
  };

  const filterOnlyActualWorkspaces = async (level, items) => {
    try {
      if (!items?.length) return [];

      if (level === LEVEL.BUILDINGS) {
        const wsRes = await workspaceApi.GetBuildings(1, 1000);
        if (!wsRes?.success) return items;

        const actualIds = new Set(
          (wsRes.items || [])
            .filter((x) => x?.isWorkspace)
            .map((x) => x?.building?.id)
            .filter(Boolean),
        );

        return items.filter((x) => actualIds.has(x?.building?.id));
      }

      if (level === LEVEL.FLOORS) {
        if (!ctxBuildingId) return [];

        const wsRes = await workspaceApi.GetFloors(ctxBuildingId, 1, 1000);
        if (!wsRes?.success) return items;

        const actualIds = new Set(
          (wsRes.items || [])
            .filter((x) => x?.isWorkspace)
            .map((x) => x?.floor?.id)
            .filter(Boolean),
        );

        return items.filter((x) => actualIds.has(x?.floor?.id));
      }

      if (!ctxBuildingId || !ctxFloorId) return [];

      const wsRes = await workspaceApi.GetLocations(
        ctxBuildingId,
        ctxFloorId,
        1,
        1000,
      );
      if (!wsRes?.success) return items;

      const actualIds = new Set(
        (wsRes.items || [])
          .filter((x) => x?.isWorkspace)
          .map((x) => x?.location?.id)
          .filter(Boolean),
      );

      return items.filter((x) => actualIds.has(x?.location?.id));
    } catch (e) {
      console.error("Ошибка фильтрации актуальных рабочих зон", e);
      return items;
    }
  };

  const loadAssigned = async (level, page) => {
    if (!employee?.id) return;

    setAssignedLoading(true);
    setAssignedError("");

    try {
      let res;

      if (level === LEVEL.BUILDINGS) {
        res = await employeeApi.GetBuildingWorkspacesForEmployee(
          employee.id,
          page,
          PAGE_SIZE,
        );
      } else if (level === LEVEL.FLOORS) {
        res = await employeeApi.GetFloorWorkspacesForEmployee(
          employee.id,
          page,
          PAGE_SIZE,
        );
      } else {
        res = await employeeApi.GetLocationWorkspacesForEmployee(
          employee.id,
          page,
          PAGE_SIZE,
        );
      }

      if (!res?.success) {
        setAssignedItems([]);
        setAssignedTotalPages(1);
        setAssignedError(res?.message || "Не удалось загрузить назначения");
        return;
      }

      setAssignedItems(res.assignments || []);
      setAssignedTotalPages(totalPagesFrom(res.pagination) || 1);
    } catch (e) {
      console.error(e);
      setAssignedItems([]);
      setAssignedTotalPages(1);
      setAssignedError("Не удалось загрузить назначения");
    } finally {
      setAssignedLoading(false);
    }
  };

  const preloadBuildingsWA = async () => {
    if (!employee?.id) return;

    try {
      const assignRes = await employeeApi.GetBuildingsWithAssignmentForEmployee(
        employee.id,
        1,
        1000,
      );

      if (!assignRes?.success) {
        setBuildingsWA([]);
        return;
      }

      const employeeBuildings = assignRes.items || [];

      if (assignLevel === LEVEL.BUILDINGS) {
        const wsRes = await workspaceApi.GetBuildings(1, 1000);

        const actualBuildingIds = new Set(
          (wsRes?.items || [])
            .filter((x) => x?.isWorkspace)
            .map((x) => x?.building?.id)
            .filter(Boolean),
        );

        setBuildingsWA(
          employeeBuildings.filter((x) =>
            actualBuildingIds.has(x?.building?.id),
          ),
        );
        return;
      }

      const availableBuildings = [];

      for (const item of employeeBuildings) {
        const buildingId = item?.building?.id;
        if (!buildingId) continue;

        const floorsRes = await workspaceApi.GetFloors(buildingId, 1, 1000);
        const hasWorkspaceFloors = (floorsRes?.items || []).some(
          (x) => x?.isWorkspace,
        );

        if (hasWorkspaceFloors) {
          availableBuildings.push(item);
        }
      }

      setBuildingsWA(availableBuildings);
    } catch (e) {
      console.error(e);
      setBuildingsWA([]);
    }
  };

  const preloadFloorsWA = async (buildingId) => {
    if (!employee?.id || !buildingId) return;

    try {
      const [assignRes, wsRes] = await Promise.all([
        employeeApi.GetFloorsWithAssignmentForEmployee(
          employee.id,
          buildingId,
          1,
          1000,
        ),
        workspaceApi.GetFloors(buildingId, 1, 1000),
      ]);

      if (!assignRes?.success) {
        setFloorsWA([]);
        return;
      }

      const actualIds = new Set(
        (wsRes?.items || [])
          .filter((x) => x?.isWorkspace)
          .map((x) => x?.floor?.id)
          .filter(Boolean),
      );

      const filtered = (assignRes.items || []).filter((x) =>
        actualIds.has(x?.floor?.id),
      );

      setFloorsWA(filtered);
    } catch (e) {
      console.error(e);
      setFloorsWA([]);
    }
  };

  const loadWithAssignment = async (level, page) => {
    if (!employee?.id) return;

    setWaLoading(true);
    setWaError("");

    try {
      let res;

      if (level === LEVEL.BUILDINGS) {
        res = await employeeApi.GetBuildingsWithAssignmentForEmployee(
          employee.id,
          page,
          PAGE_SIZE,
        );
      } else if (level === LEVEL.FLOORS) {
        if (!ctxBuildingId) {
          setWaItems([]);
          setWaTotalPages(1);
          setWaError("Выберите здание");
          setWaLoading(false);
          return;
        }

        res = await employeeApi.GetFloorsWithAssignmentForEmployee(
          employee.id,
          ctxBuildingId,
          page,
          PAGE_SIZE,
        );
      } else {
        if (!ctxBuildingId || !ctxFloorId) {
          setWaItems([]);
          setWaTotalPages(1);
          setWaError("Выберите здание и этаж");
          setWaLoading(false);
          return;
        }

        res = await employeeApi.GetLocationsWithAssignmentForEmployee(
          employee.id,
          ctxBuildingId,
          ctxFloorId,
          page,
          PAGE_SIZE,
        );
      }

      if (!res?.success) {
        setWaItems([]);
        setWaTotalPages(1);
        setWaError(res?.message || "Не удалось загрузить список");
        return;
      }

      const filteredItems = await filterOnlyActualWorkspaces(
        level,
        res.items || [],
      );

      setWaItems(filteredItems);
      setWaTotalPages(totalPagesFrom(res.pagination) || 1);
    } catch (e) {
      console.error(e);
      setWaItems([]);
      setWaTotalPages(1);
      setWaError("Не удалось загрузить список");
    } finally {
      setWaLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assignSelected = async () => {
    if (!employee?.id) return;

    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    setSaving(true);
    setWaError("");

    try {
      let workspaceDirectory = [];

      if (assignLevel === LEVEL.BUILDINGS) {
        const wsRes = await workspaceApi.GetBuildings(1, 1000);
        if (!wsRes?.success) {
          throw new Error(
            wsRes?.message || "Не удалось получить список рабочих зон зданий",
          );
        }
        workspaceDirectory = (wsRes.items || []).filter((x) => x?.isWorkspace);
      } else if (assignLevel === LEVEL.FLOORS) {
        if (!ctxBuildingId) {
          throw new Error("Не выбрано здание");
        }

        const wsRes = await workspaceApi.GetFloors(ctxBuildingId, 1, 1000);
        if (!wsRes?.success) {
          throw new Error(
            wsRes?.message || "Не удалось получить список рабочих зон этажей",
          );
        }
        workspaceDirectory = (wsRes.items || []).filter((x) => x?.isWorkspace);
      } else {
        if (!ctxBuildingId || !ctxFloorId) {
          throw new Error("Не выбраны здание и этаж");
        }

        const wsRes = await workspaceApi.GetLocations(
          ctxBuildingId,
          ctxFloorId,
          1,
          1000,
        );
        if (!wsRes?.success) {
          throw new Error(
            wsRes?.message || "Не удалось получить список рабочих зон мест",
          );
        }
        workspaceDirectory = (wsRes.items || []).filter((x) => x?.isWorkspace);
      }

      for (const id of ids) {
        const item = waItems.find((x) => waRow(x).id === id);
        if (!item) continue;

        let workspaceId = "";

        if (assignLevel === LEVEL.BUILDINGS) {
          const buildingId = item?.building?.id;
          const match = workspaceDirectory.find(
            (w) => w?.building?.id === buildingId,
          );
          workspaceId = match?.id || "";
        } else if (assignLevel === LEVEL.FLOORS) {
          const floorId = item?.floor?.id;
          const match = workspaceDirectory.find(
            (w) => w?.floor?.id === floorId,
          );
          workspaceId = match?.id || "";
        } else {
          const locationId = item?.location?.id;
          const match = workspaceDirectory.find(
            (w) => w?.location?.id === locationId,
          );
          workspaceId = match?.id || "";
        }

        if (!workspaceId) {
          throw new Error(
            "Не удалось определить workspaceId для выбранного элемента",
          );
        }

        const res = await employeeApi.CreateEmployeeWorkspaceAssignment(
          employee.id,
          workspaceId,
          { desire },
        );

        if (!res?.success) {
          throw new Error(res?.message || "Ошибка назначения");
        }
      }

      setSelectedIds(new Set());
      await loadWithAssignment(assignLevel, waPage);
      await loadAssigned(assignedLevel, assignedPage);
    } catch (e) {
      console.error(e);
      setWaError(e?.message || "Не удалось назначить выбранные элементы");
    } finally {
      setSaving(false);
    }
  };

  const getAssignedDeleteData = (assignment) => {
    const workspaceId = assignment?.workspace?.id;
    const assignmentId = assignment?.id;

    let title = "Удалить назначение?";
    let subtitle = "";

    if (assignedLevel === LEVEL.BUILDINGS) {
      title = `Удалить назначение здания "${assignedBuildingLabel(assignment)}"?`;
    } else if (assignedLevel === LEVEL.FLOORS) {
      title = `Удалить назначение "${assignedFloorLabel(assignment)}"?`;
    } else {
      const loc = assignedLocationFields(assignment);
      title = `Удалить назначение места "${loc.title}"?`;
      subtitle = loc.sub || "";
    }

    return {
      workspaceId,
      assignmentId,
      title,
      subtitle,
    };
  };

  const openDeleteConfirm = (assignment) => {
    const data = getAssignedDeleteData(assignment);

    if (!data.workspaceId || !data.assignmentId) {
      setAssignedError(
        "Не удалось определить workspaceId или assignmentId для удаления.",
      );
      return;
    }

    setDeleteTarget({
      assignment,
      ...data,
    });
    setDeleteModalOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDeleteAssignment = async () => {
    if (
      !employee?.id ||
      !deleteTarget?.workspaceId ||
      !deleteTarget?.assignmentId
    ) {
      return;
    }

    setDeleteLoading(true);
    setAssignedError("");

    try {
      const res = await employeeApi.DeleteEmployeeWorkspaceAssignment(
        employee.id,
        deleteTarget.workspaceId,
        deleteTarget.assignmentId,
      );

      if (!res?.success) {
        throw new Error(res?.message || "Не удалось удалить назначение");
      }

      setDeleteModalOpen(false);
      setDeleteTarget(null);

      await loadAssigned(assignedLevel, assignedPage);
      if (mode === MODE.ASSIGN) {
        await loadWithAssignment(assignLevel, waPage);
      }
    } catch (e) {
      console.error(e);
      setAssignedError(e?.message || "Не удалось удалить назначение");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !employee?.id) return;

    setMode(MODE.ASSIGNED);
    setAssignedLevel(LEVEL.BUILDINGS);
    setAssignLevel(LEVEL.BUILDINGS);

    setCtxBuildingId("");
    setCtxFloorId("");
    setBuildingsWA([]);
    setFloorsWA([]);

    resetAssigned();
    resetWithAssignment();

    setDesire("Постоянно");
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteLoading(false);

    loadAssigned(LEVEL.BUILDINGS, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee?.id]);

  useEffect(() => {
    if (!isOpen || !employee?.id) return;
    if (mode !== MODE.ASSIGNED) return;
    loadAssigned(assignedLevel, assignedPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, assignedLevel, assignedPage]);

  useEffect(() => {
    if (!isOpen || !employee?.id) return;
    if (mode !== MODE.ASSIGN) return;

    preloadBuildingsWA();
    resetWithAssignment();
    setWaPage(1);
    loadWithAssignment(assignLevel, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!isOpen || !employee?.id) return;
    if (mode !== MODE.ASSIGN) return;

    resetWithAssignment();
    setWaPage(1);
    loadWithAssignment(assignLevel, 1);
    preloadBuildingsWA();

    if (assignLevel === LEVEL.FLOORS || assignLevel === LEVEL.LOCATIONS) {
      if (ctxBuildingId) preloadFloorsWA(ctxBuildingId);
      if (assignLevel === LEVEL.FLOORS) setCtxFloorId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignLevel, ctxBuildingId, ctxFloorId]);

  if (!isOpen) return null;

  return (
    <div className="employee-workspaces-modal">
      <div className="ewm-overlay" onClick={onClose}>
        <div className="ewm-card empws2" onClick={(e) => e.stopPropagation()}>
          <div className="ewm-header empws2-header">
            <h3 className="ewm-title empws2-title">Рабочие зоны</h3>

            <button
              type="button"
              className="empws2-closeX"
              onClick={onClose}
              aria-label="Закрыть"
              title="Закрыть"
            >
              &times;
            </button>
          </div>

          <div className="empws2-head">
            <div className="empws-modeBtns">
              <button
                type="button"
                className={`empws-modeBtn ${mode === MODE.ASSIGNED ? "active" : ""}`}
                onClick={() => setMode(MODE.ASSIGNED)}
              >
                Назначено
              </button>

              <button
                type="button"
                className={`empws-modeBtn ${mode === MODE.ASSIGN ? "active" : ""}`}
                onClick={() => setMode(MODE.ASSIGN)}
              >
                Назначить
              </button>
            </div>

            {mode === MODE.ASSIGNED
              ? levelButtons(assignedLevel, (lvl) => {
                  setAssignedLevel(lvl);
                  setAssignedPage(1);
                })
              : levelButtons(assignLevel, (lvl) => {
                  setAssignLevel(lvl);
                  setWaPage(1);
                })}

            {mode === MODE.ASSIGN &&
              (assignLevel === LEVEL.FLOORS ||
                assignLevel === LEVEL.LOCATIONS) && (
                <div className="empws2-filters">
                  <div className="empws2-filter">
                    <div className="empws2-filterLabel">Здание</div>
                    <select
                      className="ewm-form-select empws2-select"
                      value={ctxBuildingId}
                      onChange={(e) => setCtxBuildingId(e.target.value)}
                    >
                      <option value="">-- Выберите здание --</option>
                      {buildingsWA.map((x) => (
                        <option key={x.building?.id} value={x.building?.id}>
                          {x.building?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignLevel === LEVEL.LOCATIONS && (
                    <div className="empws2-filter">
                      <div className="empws2-filterLabel">Этаж</div>
                      <select
                        className="ewm-form-select empws2-select"
                        value={ctxFloorId}
                        onChange={(e) => setCtxFloorId(e.target.value)}
                        disabled={!ctxBuildingId}
                      >
                        <option value="">-- Выберите этаж --</option>
                        {floorsWA.map((x) => (
                          <option key={x.floor?.id} value={x.floor?.id}>
                            Этаж {x.floor?.floorNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

            {mode === MODE.ASSIGNED && assignedError && (
              <div className="empws2-error">{assignedError}</div>
            )}

            {mode === MODE.ASSIGN && waError && (
              <div className="empws2-error">{waError}</div>
            )}
          </div>

          <div className="empws2-body">
            {mode === MODE.ASSIGNED && (
              <div className="empws2-list">
                {assignedLoading ? (
                  <div className="empws2-muted">Загрузка...</div>
                ) : assignedItems.length ? (
                  assignedItems.map((a) => {
                    if (assignedLevel === LEVEL.BUILDINGS) {
                      return (
                        <div key={a.id} className="empws2-item">
                          <div className="empws2-itemTop">
                            <div className="empws2-itemContent">
                              <div className="empws2-itemTitle">
                                {assignedBuildingLabel(a)}
                              </div>
                              <div className="empws2-itemMeta">
                                {a?.desire ? `Условие: ${a.desire}` : ""}
                                {a?.createdAt
                                  ? ` • ${formatDate(a.createdAt)}`
                                  : ""}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="empws2-deleteBtn"
                              onClick={() => openDeleteConfirm(a)}
                              title="Удалить назначение"
                              aria-label="Удалить назначение"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (assignedLevel === LEVEL.FLOORS) {
                      return (
                        <div key={a.id} className="empws2-item">
                          <div className="empws2-itemTop">
                            <div className="empws2-itemContent">
                              <div className="empws2-itemTitle">
                                {assignedFloorLabel(a)}
                              </div>
                              <div className="empws2-itemMeta">
                                {a?.desire ? `Условие: ${a.desire}` : ""}
                                {a?.createdAt
                                  ? ` • ${formatDate(a.createdAt)}`
                                  : ""}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="empws2-deleteBtn"
                              onClick={() => openDeleteConfirm(a)}
                              title="Удалить назначение"
                              aria-label="Удалить назначение"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const { title, desc, sub } = assignedLocationFields(a);
                    const canExpand = isLong20(title) || isLong20(desc);
                    const open = expandedAssignedId === a.id;

                    return (
                      <div key={a.id} className="empws2-item">
                        <div className="empws2-itemTop">
                          <div className="empws2-itemContent">
                            <div className="empws2-itemRow">
                              <div className="empws2-itemTitle">
                                {open ? title : cut20(title)}
                              </div>

                              {canExpand && (
                                <button
                                  type="button"
                                  className={`empws2-expandBtn ${open ? "open" : ""}`}
                                  onClick={() =>
                                    setExpandedAssignedId(open ? null : a.id)
                                  }
                                  title={open ? "Свернуть" : "Развернуть"}
                                >
                                  ▾
                                </button>
                              )}
                            </div>

                            <div className="empws2-itemMeta">{sub || ""}</div>

                            {desc ? (
                              <div className="empws2-itemDesc">
                                {open ? desc : cut20(desc)}
                              </div>
                            ) : null}

                            <div className="empws2-itemMeta">
                              {a?.desire ? `Условие: ${a.desire}` : ""}
                              {a?.createdAt
                                ? ` • ${formatDate(a.createdAt)}`
                                : ""}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="empws2-deleteBtn"
                            onClick={() => openDeleteConfirm(a)}
                            title="Удалить назначение"
                            aria-label="Удалить назначение"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empws2-muted">Ничего не назначено</div>
                )}
              </div>
            )}

            {mode === MODE.ASSIGN && (
              <div className="empws2-list">
                {waLoading ? (
                  <div className="empws2-muted">Загрузка...</div>
                ) : waItems.length ? (
                  waItems.map((x) => {
                    const row = waRow(x);
                    const disabled = row.isAssigned;
                    const checked = selectedIds.has(row.id);
                    const open = expandedAssignId === row.id;

                    const showExpand =
                      assignLevel === LEVEL.LOCATIONS &&
                      (isLong20(row.title) || isLong20(row.sub));

                    return (
                      <label
                        key={row.id}
                        className={`empws2-checkRow ${disabled ? "disabled" : ""}`}
                        title={
                          disabled ? "Уже назначено" : "Выберите для назначения"
                        }
                      >
                        <input
                          type="checkbox"
                          disabled={disabled || saving}
                          checked={disabled ? true : checked}
                          onChange={() => toggleSelect(row.id)}
                        />

                        <div className="empws2-checkText">
                          <div className="empws2-checkTitleRow">
                            <div className="empws2-checkTitle">
                              {assignLevel === LEVEL.LOCATIONS
                                ? open
                                  ? row.title
                                  : cut20(row.title)
                                : row.title}
                              {row.isAudience ? (
                                <span className="empws2-mini">Ауд.</span>
                              ) : null}
                            </div>

                            {showExpand && (
                              <button
                                type="button"
                                className={`empws2-expandBtn ${open ? "open" : ""}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setExpandedAssignId(open ? null : row.id);
                                }}
                                title={open ? "Свернуть" : "Развернуть"}
                              >
                                ▾
                              </button>
                            )}
                          </div>

                          {row.sub ? (
                            <div className="empws2-checkSub">
                              {assignLevel === LEVEL.LOCATIONS
                                ? open
                                  ? row.sub
                                  : cut20(row.sub)
                                : row.sub}
                            </div>
                          ) : null}
                        </div>

                        <div className="empws2-checkRight">
                          {disabled ? "Назначено" : "Выбрать"}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="empws2-muted">Список пуст</div>
                )}
              </div>
            )}
          </div>

          <div className="empws2-footer">
            {mode === MODE.ASSIGNED ? (
              <MiniPagination
                page={assignedPage}
                totalPages={assignedTotalPages}
                onChange={(p) => setAssignedPage(p)}
                disabled={assignedLoading}
              />
            ) : (
              <>
                <MiniPagination
                  page={waPage}
                  totalPages={waTotalPages}
                  onChange={(p) => {
                    setWaPage(p);
                    loadWithAssignment(assignLevel, p);
                  }}
                  disabled={waLoading}
                />

                <div className="empws2-actions">
                  <div className="empws2-desire">
                    <div className="empws2-filterLabel">Условие</div>
                    <select
                      className="ewm-form-select empws2-select"
                      value={desire}
                      onChange={(e) => setDesire(e.target.value)}
                      disabled={saving}
                    >
                      <option value="Постоянно">Постоянно</option>
                      <option value="При сильной необходимости">
                        При сильной необходимости
                      </option>
                      <option value="Только в крайних случаях">
                        Только в крайних случаях
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="empws2-assignBtn"
                    disabled={saving || selectedIds.size === 0}
                    onClick={assignSelected}
                  >
                    {saving
                      ? "Назначение..."
                      : `Назначить (${selectedIds.size})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteAssignment}
        loading={deleteLoading}
        title={deleteTarget?.title}
        subtitle={deleteTarget?.subtitle}
      />
    </div>
  );
}
