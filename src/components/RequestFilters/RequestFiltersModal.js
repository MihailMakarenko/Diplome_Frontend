import React, { useState, useEffect } from "react";
import "./RequestFiltersModal.css";

import BuilgingApi from "../../apiServices/buildingApi";
import FloorApi from "../../apiServices/floorApi";
import LocationApi from "../../apiServices/locationApi";

const PRIORITY_OPTIONS = ["Низкий", "Средний", "Высокий"];
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

const defaultFilters = {
  minCreatedAt: "",
  maxCreatedAt: "",
  priorities: [],
  statuses: DEFAULT_SELECTED_STATUSES,
  buildingId: "",
  floorId: "",
  locationId: "",
  sort: "CreateAt desc",
};

const RequestFiltersModal = ({
  isOpen,
  onClose,
  onApply,
  currentFilters = {},
}) => {
  const [filters, setFilters] = useState(defaultFilters);

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [locations, setLocations] = useState([]);

  const [sortFields, setSortFields] = useState(["CreateAt"]);
  const [sortDirection, setSortDirection] = useState("desc");

  const buildingApi = new BuilgingApi();
  const floorApi = new FloorApi();
  const locationApi = new LocationApi();

  useEffect(() => {
    if (!isOpen) return;

    setFilters(() => {
      const merged = {
        ...defaultFilters,
        ...currentFilters,
        statuses:
          Array.isArray(currentFilters.statuses) &&
          currentFilters.statuses.length > 0
            ? currentFilters.statuses
            : DEFAULT_SELECTED_STATUSES,
      };

      if (typeof merged.sort === "string" && merged.sort.trim().length > 0) {
        const raw = merged.sort.trim();

        const hasDesc = raw.toLowerCase().endsWith(" desc");
        const hasAsc = raw.toLowerCase().endsWith(" asc");

        let direction = "asc";
        let fieldsPart = raw;

        if (hasDesc) {
          direction = "desc";
          fieldsPart = raw.substring(0, raw.length - " desc".length).trimEnd();
        } else if (hasAsc) {
          direction = "asc";
          fieldsPart = raw.substring(0, raw.length - " asc".length).trimEnd();
        }

        const fields = fieldsPart
          .split(",")
          .map((f) => f.trim())
          .filter((f) => !!f);

        setSortFields(fields.length ? fields : ["CreateAt"]);
        setSortDirection(direction);
      } else {
        setSortFields(["CreateAt"]);
        setSortDirection("desc");
      }

      return merged;
    });

    const loadBuildings = async () => {
      try {
        const res = await buildingApi.getBuildings();
        if (res.success && res.data) setBuildings(res.data);
      } catch (e) {
        console.error("Ошибка загрузки зданий:", e);
      }
    };

    loadBuildings();
  }, [isOpen, currentFilters]);

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
  }, [filters.buildingId]);

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
  }, [filters.floorId]);

  if (!isOpen) return null;

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

    onApply({
      ...filters,
      sort: sortString,
    });
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSortFields(["CreateAt"]);
    setSortDirection("desc");
    onApply(defaultFilters);
    onClose();
  };

  return (
    <div className="rfm-overlay" onClick={onClose}>
      <div
        className="rfm-card rfm-card-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rfm-header">
          <div>
            <h3 className="rfm-title">Фильтры заявок</h3>
            <p className="rfm-subtitle">
              Период, приоритет, статус, расположение и порядок сортировки
            </p>
          </div>
          <button className="rfm-close-btn" onClick={onClose}>
            &times;
          </button>
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
                        (filters.priorities.includes(p)
                          ? " rfm-chip-active"
                          : "")
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
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={
                        "rfm-chip" +
                        (filters.statuses.includes(s) ? " rfm-chip-active" : "")
                      }
                      onClick={() => handleArrayToggle("statuses", s)}
                    >
                      {s}
                    </button>
                  ))}
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
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.floorNumber
                        ? `Этаж ${f.floorNumber}`
                        : `Этаж ${f.number}`}
                    </option>
                  ))}
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

        <div className="rfm-footer">
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
    </div>
  );
};

export default RequestFiltersModal;
