import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Select from "react-select";
import "./EmployeeFiltersModal.css";

import TypeOfProblemServerApi from "../../apiServices/typeProblemsApi";
import BuildingApi from "../../apiServices/buildingApi";
import FloorApi from "../../apiServices/floorApi";
import LocationApi from "../../apiServices/locationApi";

const empty = "";

// как в EmployeeSettingsPage: подгрузка порциями + догрузка при скролле
const PROBLEM_TYPES_PAGE_SIZE = 20;

export default function EmployeeFiltersModal({
  isOpen,
  onClose,
  initialFilters,
  onApply,
}) {
  const typeApi = useMemo(() => new TypeOfProblemServerApi(), []);
  const buildingApi = useMemo(() => new BuildingApi(), []);
  const floorApi = useMemo(() => new FloorApi(), []);
  const locationApi = useMemo(() => new LocationApi(), []);

  // ====== UI state ======
  const [secondName, setSecondName] = useState("");
  const [availability, setAvailability] = useState("all"); // all | true | false

  // NEW: фильтр по блокировке
  // по умолчанию: "active" => isBlocked=false (заблокированные скрыты)
  const [blockedMode, setBlockedMode] = useState("active"); // active | blocked | all

  const [typeOfProblemId, setTypeOfProblemId] = useState(empty);

  // scope: none | building | floor | location
  const [scope, setScope] = useState("none");

  // контекстные селекты (для загрузки)
  const [buildingContextId, setBuildingContextId] = useState(empty);
  const [floorContextId, setFloorContextId] = useState(empty);

  // то, что реально применяем (строго один из них)
  const [buildingId, setBuildingId] = useState(empty);
  const [floorId, setFloorId] = useState(empty);
  const [locationId, setLocationId] = useState(empty);

  // ====== problem types (infinite scroll как в EmployeeSettingsPage) ======
  const [problemTypes, setProblemTypes] = useState([]);
  const [problemTypesPage, setProblemTypesPage] = useState(1);
  const [problemTypesPagination, setProblemTypesPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: PROBLEM_TYPES_PAGE_SIZE,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });
  const [loadingTypes, setLoadingTypes] = useState(false);
  const typesReqSeq = useRef(0);

  // ====== buildings/floors/locations data ======
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [error, setError] = useState("");

  // ====== helpers ======
  const clearScopeValues = () => {
    setBuildingId(empty);
    setFloorId(empty);
    setLocationId(empty);

    setBuildingContextId(empty);
    setFloorContextId(empty);

    setFloors([]);
    setLocations([]);
  };

  const handleChangeScope = (next) => {
    setScope(next);
    setError("");
    clearScopeValues();
  };

  const resetTypesState = () => {
    setProblemTypes([]);
    setProblemTypesPage(1);
    setProblemTypesPagination({
      CurrentPage: 1,
      TotalPages: 1,
      PageSize: PROBLEM_TYPES_PAGE_SIZE,
      TotalCount: 0,
      HasPrevious: false,
      HasNext: false,
    });
  };

  const loadProblemTypes = useCallback(
    async (page) => {
      const seq = ++typesReqSeq.current;
      setLoadingTypes(true);

      try {
        const res = await typeApi.GetProblemTypes(
          page,
          PROBLEM_TYPES_PAGE_SIZE,
        );

        if (seq !== typesReqSeq.current) return;

        if (!res?.success) {
          if (page === 1) setProblemTypes([]);
          return;
        }

        const items = Array.isArray(res.data) ? res.data : [];
        const p = res.pagination || {};

        const currentPage = p.CurrentPage ?? p.currentPage ?? page;
        const totalPages = p.TotalPages ?? p.totalPages ?? 1;
        const totalCount = p.TotalCount ?? p.totalCount ?? items.length;
        const pageSize = p.PageSize ?? p.pageSize ?? PROBLEM_TYPES_PAGE_SIZE;

        const hasPrev = p.HasPrevious ?? p.hasPrevious ?? currentPage > 1;
        const hasNext = p.HasNext ?? p.hasNext ?? currentPage < totalPages;

        setProblemTypesPagination({
          CurrentPage: currentPage,
          TotalPages: totalPages,
          TotalCount: totalCount,
          PageSize: pageSize,
          HasPrevious: hasPrev,
          HasNext: hasNext,
        });

        setProblemTypes((prev) => {
          if (page === 1) return items;

          // append + unique by id
          const map = new Map(prev.map((x) => [x.id, x]));
          for (const it of items) map.set(it.id, it);
          return Array.from(map.values());
        });

        setProblemTypesPage(currentPage);
      } catch (e) {
        if (seq !== typesReqSeq.current) return;
        console.error(e);
        if (page === 1) setProblemTypes([]);
      } finally {
        if (seq === typesReqSeq.current) setLoadingTypes(false);
      }
    },
    [typeApi],
  );

  // ====== init from initialFilters when opened ======
  useEffect(() => {
    if (!isOpen) return;

    setError("");

    const f = initialFilters || {};

    setSecondName(f.secondName || "");

    setAvailability(
      f.isAvailable === true
        ? "true"
        : f.isAvailable === false
          ? "false"
          : "all",
    );

    // NEW: isBlocked (по умолчанию фильтр включён => active => isBlocked=false)
    // если извне пришёл isBlocked:
    //  true  -> blocked
    //  false -> active
    //  null/undefined -> active (скрываем заблокированных по умолчанию)
    if (f.isBlocked === true) setBlockedMode("blocked");
    else if (f.isBlocked === false) setBlockedMode("active");
    else setBlockedMode("active");

    setTypeOfProblemId(f.typeOfProblemId || empty);

    if (f.locationId) setScope("location");
    else if (f.floorId) setScope("floor");
    else if (f.buildingId) setScope("building");
    else setScope("none");

    setBuildingId(f.buildingId || empty);
    setFloorId(f.floorId || empty);
    setLocationId(f.locationId || empty);

    // контекстные селекты
    setBuildingContextId(empty);
    setFloorContextId(empty);
    setFloors([]);
    setLocations([]);

    // reset types and load first page
    resetTypesState();
    loadProblemTypes(1);
  }, [isOpen, initialFilters, loadProblemTypes]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // ====== load buildings on open ======
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async () => {
      setLoadingBuildings(true);
      try {
        const res = await buildingApi.getBuildings(1, 200);
        if (cancelled) return;
        setBuildings(res?.success ? res.data || [] : []);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setBuildings([]);
      } finally {
        if (!cancelled) setLoadingBuildings(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, buildingApi]);

  // ====== load floors when buildingContextId changes (if scope needs it) ======
  useEffect(() => {
    if (!isOpen) return;
    if (!(scope === "floor" || scope === "location")) return;

    let cancelled = false;

    if (!buildingContextId) {
      setFloors([]);
      setFloorContextId(empty);
      setLocations([]);
      return;
    }

    (async () => {
      setLoadingFloors(true);
      try {
        const res = await floorApi.getFloorsForBuilding(
          buildingContextId,
          1,
          200,
        );

        if (cancelled) return;

        setFloors(res?.success ? res.data || [] : []);
        setFloorContextId(empty);
        setLocations([]);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setFloors([]);
        setFloorContextId(empty);
        setLocations([]);
      } finally {
        if (!cancelled) setLoadingFloors(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, scope, buildingContextId, floorApi]);

  // ====== load locations when floorContextId changes (if scope=location) ======
  useEffect(() => {
    if (!isOpen) return;
    if (scope !== "location") return;

    let cancelled = false;

    if (!floorContextId) {
      setLocations([]);
      return;
    }

    (async () => {
      setLoadingLocations(true);
      try {
        const res = await locationApi.getLocationsForFloor(
          floorContextId,
          1,
          500,
        );

        if (cancelled) return;

        setLocations(res?.success ? res.data || [] : []);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setLocations([]);
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, scope, floorContextId, locationApi]);

  // ====== react-select options for problem types ======
  const problemTypeOptions = useMemo(() => {
    return problemTypes.map((type) => ({
      value: type.id,
      label: `${type.title ?? type.name ?? "Без названия"}${
        type.basePriority !== undefined && type.basePriority !== null
          ? ` (${type.basePriority})`
          : ""
      }`,
      type,
    }));
  }, [problemTypes]);

  const selectedProblemTypeOption = useMemo(() => {
    return problemTypeOptions.find((o) => o.value === typeOfProblemId) || null;
  }, [problemTypeOptions, typeOfProblemId]);

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }),
    [],
  );

  // ====== apply / reset ======
  const handleApply = () => {
    setError("");

    const filters = {};

    if (secondName.trim()) filters.secondName = secondName.trim();
    if (availability !== "all") filters.isAvailable = availability === "true";

    // NEW: isBlocked (по умолчанию отправляем isBlocked=false => скрываем заблокированных)
    if (blockedMode === "active") filters.isBlocked = false;
    else if (blockedMode === "blocked") filters.isBlocked = true;
    // else blockedMode === "all" -> ничего не отправляем

    if (typeOfProblemId) filters.typeOfProblemId = typeOfProblemId;

    if (scope === "building") {
      if (!buildingId) return setError("Выберите здание");
      filters.buildingId = buildingId;
    }

    if (scope === "floor") {
      if (!buildingContextId)
        return setError("Выберите здание (для списка этажей)");
      if (!floorId) return setError("Выберите этаж");
      filters.floorId = floorId; // отправляем ТОЛЬКО FloorId
    }

    if (scope === "location") {
      if (!buildingContextId) return setError("Выберите здание");
      if (!floorContextId) return setError("Выберите этаж");
      if (!locationId) return setError("Выберите место");
      filters.locationId = locationId; // отправляем ТОЛЬКО LocationId
    }

    onApply?.(filters);
  };

  const handleReset = () => {
    setError("");
    setSecondName("");
    setAvailability("all");

    // NEW: сброс к значению по умолчанию (скрываем заблокированных)
    setBlockedMode("active");

    setTypeOfProblemId(empty);
    setScope("none");
    clearScopeValues();

    resetTypesState();
    loadProblemTypes(1);
  };

  if (!isOpen) return null;

  return (
    <div className="empFilters-overlay" onMouseDown={onClose}>
      <div
        className="empFilters-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="empFilters-header">
          <h3>Фильтры сотрудников</h3>
          <button className="empFilters-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="empFilters-body">
          <div className="empFilters-row">
            <label>Фамилия</label>
            <input
              value={secondName}
              onChange={(e) => setSecondName(e.target.value)}
              placeholder="Например: Иванов"
            />
          </div>

          <div className="empFilters-row">
            <label>Доступность</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="true">На работе</option>
              <option value="false">Нет на месте</option>
            </select>
          </div>

          {/* NEW: фильтр по блокировке */}
          <div className="empFilters-row">
            <label>Пользователи</label>
            <select
              value={blockedMode}
              onChange={(e) => setBlockedMode(e.target.value)}
            >
              <option value="active">Только не заблокированные</option>
              <option value="blocked">Только заблокированные</option>
              <option value="all">Все (включая заблокированных)</option>
            </select>
          </div>

          {/* Тип проблемы — react-select + догрузка */}
          <div className="empFilters-row">
            <label>Тип проблемы</label>

            <Select
              value={selectedProblemTypeOption}
              onChange={(opt) => setTypeOfProblemId(opt?.value || "")}
              options={problemTypeOptions}
              isLoading={loadingTypes}
              isDisabled={loadingTypes}
              placeholder="-- Любой тип проблемы --"
              maxMenuHeight={240}
              menuPortalTarget={document.body}
              styles={selectStyles}
              isClearable
              noOptionsMessage={() =>
                loadingTypes ? "Загрузка..." : "Нет типов проблем"
              }
              onMenuScrollToBottom={() => {
                if (loadingTypes) return;
                if (!problemTypesPagination.HasNext) return;
                loadProblemTypes(problemTypesPage + 1);
              }}
            />

            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Загружено: {problemTypes.length}
              {problemTypesPagination.TotalCount
                ? ` / ${problemTypesPagination.TotalCount}`
                : ""}
            </div>
          </div>

          <hr />

          <div className="empFilters-row">
            <label>Рабочая зона (передаём строго один параметр)</label>
            <select
              value={scope}
              onChange={(e) => handleChangeScope(e.target.value)}
            >
              <option value="none">Не фильтровать по зоне</option>
              <option value="building">Здание (BuildingId)</option>
              <option value="floor">Этаж (FloorId)</option>
              <option value="location">Место (LocationId)</option>
            </select>
          </div>

          {scope === "building" && (
            <div className="empFilters-row">
              <label>Здание</label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                disabled={loadingBuildings}
              >
                <option value="">
                  {loadingBuildings ? "Загрузка..." : "Выберите здание"}
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === "floor" && (
            <>
              <div className="empFilters-row">
                <label>Здание (только для выбора этажа, НЕ отправляется)</label>
                <select
                  value={buildingContextId}
                  onChange={(e) => setBuildingContextId(e.target.value)}
                  disabled={loadingBuildings}
                >
                  <option value="">
                    {loadingBuildings ? "Загрузка..." : "Выберите здание"}
                  </option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="empFilters-row">
                <label>Этаж</label>
                <select
                  value={floorId}
                  onChange={(e) => setFloorId(e.target.value)}
                  disabled={!buildingContextId || loadingFloors}
                >
                  <option value="">
                    {!buildingContextId
                      ? "Сначала выберите здание"
                      : loadingFloors
                        ? "Загрузка..."
                        : "Выберите этаж"}
                  </option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.floorNumber ?? f.number ?? f.name ?? f.id}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {scope === "location" && (
            <>
              <div className="empFilters-row">
                <label>Здание (только для выбора, НЕ отправляется)</label>
                <select
                  value={buildingContextId}
                  onChange={(e) => setBuildingContextId(e.target.value)}
                  disabled={loadingBuildings}
                >
                  <option value="">
                    {loadingBuildings ? "Загрузка..." : "Выберите здание"}
                  </option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="empFilters-row">
                <label>Этаж (только для выбора места, НЕ отправляется)</label>
                <select
                  value={floorContextId}
                  onChange={(e) => setFloorContextId(e.target.value)}
                  disabled={!buildingContextId || loadingFloors}
                >
                  <option value="">
                    {!buildingContextId
                      ? "Сначала выберите здание"
                      : loadingFloors
                        ? "Загрузка..."
                        : "Выберите этаж"}
                  </option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.floorNumber ?? f.number ?? f.name ?? f.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="empFilters-row">
                <label>Место</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  disabled={!floorContextId || loadingLocations}
                >
                  <option value="">
                    {!floorContextId
                      ? "Сначала выберите этаж"
                      : loadingLocations
                        ? "Загрузка..."
                        : "Выберите место"}
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && <div className="empFilters-error">{error}</div>}
        </div>

        <div className="empFilters-footer">
          <button
            className="btn btn-outline"
            onClick={handleReset}
            type="button"
          >
            Сбросить
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            type="button"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
