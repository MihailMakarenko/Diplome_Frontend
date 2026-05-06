import React, { useEffect, useMemo, useState } from "react";
import "./RequestFiltersModal.css";

import BuilgingApi from "../../apiServices/buildingApi";
import FloorApi from "../../apiServices/floorApi";
import LocationApi from "../../apiServices/locationApi";

const PRIORITY_OPTIONS = ["Низкий", "Средний", "Высокий", "Критический"];

const STATUS_OPTIONS = [
  "Создана",
  "Назначена",
  "В работе",
  "Приостановлена",
  "Выполнена",
  "Отклонена",
];

const DEFAULT_SELECTED_STATUSES = [
  "Создана",
  "Назначена",
  "В работе",
  "Приостановлена",
];

const SORT_FIELDS = [
  { value: "CreateAt", label: "Дата создания" },
  { value: "UpdateAt", label: "Дата обновления" },
  { value: "priority", label: "Приоритет" },
  { value: "status", label: "Статус" },
  { value: "Number", label: "Номер заявки" },
];

const DIRECTIONS = [
  { value: "asc", label: "По возрастанию" },
  { value: "desc", label: "По убыванию" },
];

// важно: стабильная ссылка (не новый [] на каждый render)
const EMPTY_ARRAY = Object.freeze([]);

const baseDefaultFilters = {
  minCreatedAt: "",
  maxCreatedAt: "",
  priorities: [],
  statuses: DEFAULT_SELECTED_STATUSES,
  buildingId: "",
  floorId: "",
  locationId: "",
  sort: "CreateAt desc",
};

function parseSort(sort) {
  if (typeof sort !== "string" || sort.trim().length === 0) {
    return { fields: ["CreateAt"], direction: "desc" };
  }

  const raw = sort.trim();
  const lower = raw.toLowerCase();

  const hasDesc = lower.endsWith(" desc");
  const hasAsc = lower.endsWith(" asc");

  let direction = "asc";
  let fieldsPart = raw;

  if (hasDesc) {
    direction = "desc";
    fieldsPart = raw.substring(0, raw.length - " desc".length).trimEnd();
  } else if (hasAsc) {
    direction = "asc";
    fieldsPart = raw.substring(0, raw.length - " asc".length).trimEnd();
  } else {
    direction = "desc";
  }

  const fields = fieldsPart
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  return { fields: fields.length ? fields : ["CreateAt"], direction };
}

const RequestFiltersModal = ({
  isOpen,
  onClose,
  onApply,
  currentFilters = {},
  disabledStatuses = EMPTY_ARRAY,
  embedded = false,
}) => {
  const opened = embedded ? true : isOpen;

  const disabledKey = (disabledStatuses || EMPTY_ARRAY)
    .slice()
    .sort()
    .join("|");

  const disabledStatusesSet = useMemo(() => {
    return new Set(disabledStatuses || EMPTY_ARRAY);
  }, [disabledKey]);

  const defaultFilters = useMemo(() => {
    const cleanedDefaultStatuses = (DEFAULT_SELECTED_STATUSES || []).filter(
      (s) => !disabledStatusesSet.has(s),
    );

    return {
      ...baseDefaultFilters,
      statuses: cleanedDefaultStatuses,
    };
  }, [disabledKey, disabledStatusesSet]);

  const [filters, setFilters] = useState(defaultFilters);

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [locations, setLocations] = useState([]);

  const [sortFields, setSortFields] = useState(["CreateAt"]);
  const [sortDirection, setSortDirection] = useState("desc");

  const buildingApi = useMemo(() => new BuilgingApi(), []);
  const floorApi = useMemo(() => new FloorApi(), []);
  const locationApi = useMemo(() => new LocationApi(), []);

  useEffect(() => {
    if (!opened) return;

    const merged = {
      ...defaultFilters,
      ...currentFilters,
    };

    const incomingStatuses =
      Array.isArray(currentFilters.statuses) &&
      currentFilters.statuses.length > 0
        ? currentFilters.statuses
        : defaultFilters.statuses;

    merged.statuses = (incomingStatuses || []).filter(
      (s) => !disabledStatusesSet.has(s),
    );

    setFilters(merged);

    const parsed = parseSort(merged.sort);
    setSortFields(parsed.fields);
    setSortDirection(parsed.direction);

    const loadBuildings = async () => {
      try {
        const res = await buildingApi.getBuildings();
        if (res.success && res.data) setBuildings(res.data);
      } catch (e) {
        console.error("Ошибка загрузки зданий:", e);
      }
    };

    loadBuildings();
  }, [
    opened,
    currentFilters,
    defaultFilters,
    disabledStatusesSet,
    buildingApi,
  ]);

  useEffect(() => {
    const loadFloors = async () => {
      if (!filters.buildingId) {
        setFloors([]);
        setLocations([]);
        return;
      }

      try {
        const res = await floorApi.getFloorsForBuilding(filters.buildingId);
        if (res.success && res.data) setFloors(res.data);
      } catch (e) {
        console.error("Ошибка загрузки этажей:", e);
      }
    };

    loadFloors();
  }, [filters.buildingId, floorApi]);

  useEffect(() => {
    const loadLocations = async () => {
      if (!filters.floorId) {
        setLocations([]);
        return;
      }

      try {
        const res = await locationApi.getLocationsForFloor(filters.floorId);
        if (res.success && res.data) setLocations(res.data);
      } catch (e) {
        console.error("Ошибка загрузки помещений:", e);
      }
    };

    loadLocations();
  }, [filters.floorId, locationApi]);

  if (!opened) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "buildingId"
        ? { floorId: "", locationId: "" }
        : name === "floorId"
          ? { locationId: "" }
          : {}),
    }));
  };

  const handleArrayToggle = (field, value) => {
    if (field === "statuses" && disabledStatusesSet.has(value)) return;

    setFilters((prev) => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const getAvailableSortFields = () => {
    return SORT_FIELDS.filter((f) => !sortFields.includes(f.value));
  };

  const addSortField = () => {
    const available = getAvailableSortFields();
    if (!available.length) return;
    setSortFields((prev) => [...prev, available[0].value]);
  };

  const removeSortField = (index) => {
    setSortFields((prev) => prev.filter((_, i) => i !== index));
  };

  const changeSortField = (index, value) => {
    setSortFields((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const handleApply = () => {
    const uniqueFields = [...new Set(sortFields)].filter(Boolean);
    let sortString = uniqueFields.join(", ");
    sortString =
      sortDirection === "desc" ? `${sortString} desc` : `${sortString} asc`;

    const cleanedStatuses = (filters.statuses || []).filter(
      (s) => !disabledStatusesSet.has(s),
    );

    onApply?.({
      ...filters,
      statuses: cleanedStatuses,
      sort: sortString,
    });

    onClose?.();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSortFields(["CreateAt"]);
    setSortDirection("desc");
    onApply?.(defaultFilters);
    onClose?.();
  };

  const card = (
    <div
      className={
        "rfm-card rfm-card-large" + (embedded ? " rfm-card-embedded" : "")
      }
    >
      <div className="rfm-header">
        <div>
          <h3 className="rfm-title">Фильтры заявок</h3>
          <p className="rfm-subtitle">
            Период, приоритет, статус, расположение и порядок сортировки
          </p>
        </div>

        {!embedded && (
          <button className="rfm-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        )}
      </div>

      <div className="rfm-content">
        <section className="rfm-section">
          <div className="rfm-section-title">Период создания</div>

          <div className="rfm-grid-2">
            <div className="rfm-field">
              <label className="rfm-label">Минимальная дата и время</label>
              <input
                type="datetime-local"
                name="minCreatedAt"
                className="rfm-input rfm-input-lg"
                value={filters.minCreatedAt}
                onChange={handleInputChange}
              />
            </div>

            <div className="rfm-field">
              <label className="rfm-label">Максимальная дата и время</label>
              <input
                type="datetime-local"
                name="maxCreatedAt"
                className="rfm-input rfm-input-lg"
                value={filters.maxCreatedAt}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        <section className="rfm-section">
          <div className="rfm-grid-2">
            <div className="rfm-field">
              <div className="rfm-label rfm-label-center">Приоритет</div>
              <div className="rfm-chips">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={
                      "rfm-chip" +
                      (filters.priorities.includes(p) ? " rfm-chip-active" : "")
                    }
                    onClick={() => handleArrayToggle("priorities", p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rfm-field">
              <div className="rfm-label rfm-label-center">Статус</div>
              <div className="rfm-chips">
                {STATUS_OPTIONS.map((s) => {
                  const isDisabled = disabledStatusesSet.has(s);
                  const isActive = filters.statuses.includes(s);

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isDisabled}
                      className={
                        "rfm-chip" +
                        (isActive ? " rfm-chip-active" : "") +
                        (isDisabled ? " rfm-chip-disabled" : "")
                      }
                      onClick={() => handleArrayToggle("statuses", s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rfm-section">
          <div className="rfm-section-title">Местоположение</div>

          <div className="rfm-grid-3">
            <div className="rfm-field">
              <label className="rfm-label">Здание</label>
              <select
                name="buildingId"
                className="rfm-select rfm-input-lg rfm-select-decorated"
                value={filters.buildingId}
                onChange={handleInputChange}
              >
                <option value="">Все</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rfm-field">
              <label className="rfm-label">Этаж</label>
              <select
                name="floorId"
                className="rfm-select rfm-input-lg rfm-select-decorated"
                value={filters.floorId}
                onChange={handleInputChange}
                disabled={!filters.buildingId}
              >
                <option value="">Все</option>
                {floors.map((f) => {
                  const label = f?.name
                    ? f.name
                    : f?.floorNumber != null
                      ? `Этаж ${f.floorNumber}`
                      : f?.number != null
                        ? `Этаж ${f.number}`
                        : "Этаж";

                  return (
                    <option key={f.id} value={f.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="rfm-field">
              <label className="rfm-label">Помещение</label>
              <select
                name="locationId"
                className="rfm-select rfm-input-lg rfm-select-decorated"
                value={filters.locationId}
                onChange={handleInputChange}
                disabled={!filters.floorId}
              >
                <option value="">Все</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rfm-section">
          <div className="rfm-section-title">
            Сортировка (несколько полей, одно направление)
          </div>

          <div className="rfm-field">
            <label className="rfm-label">Направление сортировки</label>
            <div className="rfm-chips">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={
                    "rfm-chip" +
                    (sortDirection === d.value ? " rfm-chip-active" : "")
                  }
                  onClick={() => setSortDirection(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rfm-sort-list">
            {sortFields.map((field, index) => {
              const available = SORT_FIELDS.filter(
                (f) => f.value === field || !sortFields.includes(f.value),
              );

              return (
                <div key={index} className="rfm-sort-row">
                  <select
                    className="rfm-select rfm-input-lg rfm-select-decorated"
                    value={field}
                    onChange={(e) => changeSortField(index, e.target.value)}
                  >
                    {available.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  {sortFields.length > 1 && (
                    <button
                      type="button"
                      className="rfm-sort-remove"
                      onClick={() => removeSortField(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="rfm-sort-add"
              onClick={addSortField}
              disabled={sortFields.length >= SORT_FIELDS.length}
            >
              + Добавить поле сортировки
            </button>
          </div>
        </section>
      </div>

      {/* Кнопки теперь есть и в embedded тоже */}
      <div className={"rfm-footer" + (embedded ? " rfm-footer--embedded" : "")}>
        <button
          type="button"
          className="rfm-btn rfm-btn-secondary"
          onClick={handleReset}
        >
          Сбросить
        </button>

        <button
          type="button"
          className="rfm-btn rfm-btn-primary"
          onClick={handleApply}
        >
          Применить
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="request-filters-modal request-filters-modal--embedded">
        <div
          className="rfm-overlay rfm-overlay--embedded"
          style={{
            position: "static",
            inset: "auto",
            background: "transparent",
            padding: 0,
            display: "block",
          }}
        >
          <div
            className="rfm-card-wrap rfm-card-wrap--embedded"
            style={{ position: "static" }}
          >
            {card}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-filters-modal">
      <div className="rfm-overlay" onClick={onClose}>
        <div className="rfm-card-wrap" onClick={(e) => e.stopPropagation()}>
          {card}
        </div>
      </div>
    </div>
  );
};

export default RequestFiltersModal;
