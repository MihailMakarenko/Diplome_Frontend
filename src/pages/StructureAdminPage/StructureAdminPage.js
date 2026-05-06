import React, { useEffect, useMemo, useState } from "react";
import "./StructureAdminPage.css";

import BuildingApi from "../../apiServices/buildingApi";
import FloorApi from "../../apiServices/floorApi";
import LocationApi from "../../apiServices/locationApi";

import StructureAdminHeader from "../../components/StructureAdminPage/StructureAdminHeader/StructureAdminHeader";
import ErrorBanner from "../../components/StructureAdminPage/ErrorBanner/ErrorBanner";
import EditModal from "../../components/StructureAdminPage/EditModal/EditModal";

import BuildingsTab from "../../components/StructureAdminPage/tabs/BuildingsTab/BuildingsTab";
import FloorsTab from "../../components/StructureAdminPage/tabs/FloorsTab/FloorsTab";
import LocationsTab from "../../components/StructureAdminPage/tabs/LocationsTab/LocationsTab";

const TAB = {
  BUILDINGS: "buildings",
  FLOORS: "floors",
  LOCATIONS: "locations",
};

const PAGE_SIZE = 8;

// Ограничения как в валидации создания
const LIMITS = {
  building: { name: 20, description: 100, address: 100 },
  floor: { floorNumberMin: 0, floorNumberMax: 40, description: 200 },
  location: { name: 30, description: 200 },
};

/* ===================== VALIDATION HELPERS ===================== */

function validateLength(value, min, max) {
  const s = (value ?? "").toString().trim();
  return s.length >= min && s.length <= max;
}

function validateNumberRange(value, min, max) {
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max;
}

/* ===================== INPUT SANITIZERS ===================== */

function cutToMax(value, max) {
  const s = (value ?? "").toString();
  return s.length > max ? s.slice(0, max) : s;
}

function clampIntString(value, min, max, fallback = "") {
  // value может быть "" (когда пользователь стирает)
  if (value === "" || value === null || value === undefined) return fallback;

  // разрешаем временно "-"? нет — у нас 0..40
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;

  const clamped = Math.min(max, Math.max(min, Math.trunc(num)));
  return String(clamped);
}

/* ===================== PAGINATION HELPERS ===================== */

function safeParsePagination(xPaginationHeader) {
  if (!xPaginationHeader) return null;
  try {
    return JSON.parse(xPaginationHeader);
  } catch {
    return null;
  }
}

function getTotalPages(pagination) {
  return (
    pagination?.TotalPages ??
    pagination?.totalPages ??
    pagination?.total_pages ??
    1
  );
}

export default function StructureAdminPage() {
  const buildingApi = useMemo(() => new BuildingApi(), []);
  const floorApi = useMemo(() => new FloorApi(), []);
  const locationApi = useMemo(() => new LocationApi(), []);

  const [tab, setTab] = useState(TAB.BUILDINGS);

  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  const [buildings, setBuildings] = useState([]);
  const [bPage, setBPage] = useState(1);
  const [bTotalPages, setBTotalPages] = useState(1);

  const [buildingForm, setBuildingForm] = useState({
    name: "",
    description: "",
    address: "",
  });
  const [savingBuilding, setSavingBuilding] = useState(false);

  const [editBuilding, setEditBuilding] = useState(null);
  const [editBuildingForm, setEditBuildingForm] = useState({
    name: "",
    description: "",
    address: "",
  });
  const [savingEditBuilding, setSavingEditBuilding] = useState(false);
  const [editBuildingErrors, setEditBuildingErrors] = useState({});

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [floors, setFloors] = useState([]);
  const [fPage, setFPage] = useState(1);
  const [fTotalPages, setFTotalPages] = useState(1);

  const [floorForm, setFloorForm] = useState({
    floorNumber: 1,
    description: "",
  });
  const [savingFloor, setSavingFloor] = useState(false);

  const [editFloor, setEditFloor] = useState(null);
  const [editFloorForm, setEditFloorForm] = useState({
    floorNumber: 1,
    description: "",
  });
  const [savingEditFloor, setSavingEditFloor] = useState(false);
  const [editFloorErrors, setEditFloorErrors] = useState({});

  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [locations, setLocations] = useState([]);
  const [lPage, setLPage] = useState(1);
  const [lTotalPages, setLTotalPages] = useState(1);

  const [allLocationsNoServerPaging, setAllLocationsNoServerPaging] = useState(
    [],
  );
  const [locationsServerPaged, setLocationsServerPaged] = useState(true);

  const [locationForm, setLocationForm] = useState({
    name: "",
    isAudience: false,
    description: "",
  });
  const [savingLocation, setSavingLocation] = useState(false);

  const [editLocation, setEditLocation] = useState(null);
  const [editLocationForm, setEditLocationForm] = useState({
    name: "",
    isAudience: false,
    description: "",
  });
  const [savingEditLocation, setSavingEditLocation] = useState(false);
  const [editLocationErrors, setEditLocationErrors] = useState({});

  /* ===================== SAFE SETTERS FOR TAB FORMS ===================== */
  // Чтобы ограничения работали даже если в табе забудут maxLength/min/max

  const setBuildingFormSafe = (updater) => {
    setBuildingForm((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return {
        name: cutToMax(next?.name ?? "", LIMITS.building.name),
        description: cutToMax(
          next?.description ?? "",
          LIMITS.building.description,
        ),
        address: cutToMax(next?.address ?? "", LIMITS.building.address),
      };
    });
  };

  const setFloorFormSafe = (updater) => {
    setFloorForm((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      const floorNumberRaw = next?.floorNumber ?? "";
      // FloorsTab может передавать строку из input
      const floorNumberStr =
        floorNumberRaw === ""
          ? ""
          : clampIntString(
              floorNumberRaw,
              LIMITS.floor.floorNumberMin,
              LIMITS.floor.floorNumberMax,
              String(prev?.floorNumber ?? 1),
            );

      return {
        floorNumber: floorNumberStr === "" ? "" : Number(floorNumberStr), // у тебя в submit Number(...)
        description: cutToMax(
          next?.description ?? "",
          LIMITS.floor.description,
        ),
      };
    });
  };

  const setLocationFormSafe = (updater) => {
    setLocationForm((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return {
        name: cutToMax(next?.name ?? "", LIMITS.location.name),
        isAudience: !!next?.isAudience,
        description: cutToMax(
          next?.description ?? "",
          LIMITS.location.description,
        ),
      };
    });
  };

  /* ===================== LOADERS ===================== */

  const loadBuildings = async (page = 1) => {
    setLoadingList(true);
    setError("");

    try {
      const res = await buildingApi.getBuildings(page, PAGE_SIZE);

      if (!res.success) {
        setBuildings([]);
        setBTotalPages(1);
        setError(res.message || "Не удалось загрузить здания");
        return;
      }

      setBuildings(res.data || []);
      setBTotalPages(getTotalPages(res.pagination) || 1);
    } finally {
      setLoadingList(false);
    }
  };

  const loadFloors = async (buildingId, page = 1) => {
    if (!buildingId) {
      setFloors([]);
      setFTotalPages(1);
      return;
    }

    setLoadingList(true);
    setError("");

    try {
      const res = await floorApi.getFloorsForBuilding(
        buildingId,
        page,
        PAGE_SIZE,
      );

      if (!res.success) {
        setFloors([]);
        setFTotalPages(1);
        setError(res.message || "Не удалось загрузить этажи");
        return;
      }

      setFloors(res.data || []);
      setFTotalPages(getTotalPages(res.pagination) || 1);
    } finally {
      setLoadingList(false);
    }
  };

  const loadLocations = async (floorId, page = 1) => {
    if (!floorId) {
      setLocations([]);
      setLTotalPages(1);
      setAllLocationsNoServerPaging([]);
      return;
    }

    setLoadingList(true);
    setError("");

    try {
      try {
        const response = await locationApi.api.get(`/${floorId}/locations`, {
          params: { PageNumber: page, PageSize: PAGE_SIZE },
        });

        const pagination = safeParsePagination(
          response.headers?.["x-pagination"],
        );

        setLocationsServerPaged(true);
        setLocations(response.data || []);
        setLTotalPages(getTotalPages(pagination) || 1);
        setAllLocationsNoServerPaging([]);
        return;
      } catch {
        // fallback
      }

      const res = await locationApi.getLocationsForFloor(floorId);

      if (!res.success) {
        setLocations([]);
        setLTotalPages(1);
        setAllLocationsNoServerPaging([]);
        setLocationsServerPaged(false);
        setError(res.message || "Не удалось загрузить места");
        return;
      }

      const all = res.data || [];
      setLocationsServerPaged(false);
      setAllLocationsNoServerPaging(all);

      const tp = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
      setLTotalPages(tp);

      const slice = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      setLocations(slice);
    } finally {
      setLoadingList(false);
    }
  };

  /* ===================== TAB SWITCH EFFECTS ===================== */

  useEffect(() => {
    setBPage(1);
    loadBuildings(1);

    setError("");

    if (tab === TAB.FLOORS) {
      setSelectedFloorId("");
      setLocations([]);
      setLTotalPages(1);
    }

    if (tab === TAB.LOCATIONS) {
      setSelectedFloorId("");
      setLocations([]);
      setLTotalPages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== TAB.FLOORS) return;
    setFPage(1);
    loadFloors(selectedBuildingId, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedBuildingId]);

  useEffect(() => {
    if (tab !== TAB.LOCATIONS) return;
    setSelectedFloorId("");
    setFloors([]);
    setFTotalPages(1);
    setFPage(1);

    if (selectedBuildingId) loadFloors(selectedBuildingId, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedBuildingId]);

  useEffect(() => {
    if (tab !== TAB.LOCATIONS) return;
    setLPage(1);
    loadLocations(selectedFloorId, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedFloorId]);

  /* ===================== CREATE (валидация в баннер) ===================== */

  const submitBuilding = async (e) => {
    e.preventDefault();
    setError("");

    // режем на всякий случай
    const dto = {
      name: cutToMax(buildingForm.name, LIMITS.building.name).trim(),
      description: cutToMax(
        buildingForm.description,
        LIMITS.building.description,
      ).trim(),
      address: cutToMax(buildingForm.address, LIMITS.building.address).trim(),
    };

    if (!validateLength(dto.name, 2, LIMITS.building.name)) {
      setError("Название здания должно быть от 2 до 20 символов");
      return;
    }
    if (!validateLength(dto.description, 2, LIMITS.building.description)) {
      setError("Описание здания должно быть от 2 до 100 символов");
      return;
    }
    if (!validateLength(dto.address, 2, LIMITS.building.address)) {
      setError("Адрес здания должно быть от 2 до 100 символов");
      return;
    }

    setSavingBuilding(true);
    try {
      const res = await buildingApi.createBuilding(dto);
      if (!res.success) {
        setError(res.message || "Не удалось создать здание");
        return;
      }

      setBuildingForm({ name: "", description: "", address: "" });
      setBPage(1);
      await loadBuildings(1);
    } finally {
      setSavingBuilding(false);
    }
  };

  const submitFloor = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedBuildingId) {
      setError("Выберите здание для создания этажа");
      return;
    }

    const dto = {
      floorNumber: Number(floorForm.floorNumber),
      description: cutToMax(
        floorForm.description,
        LIMITS.floor.description,
      ).trim(),
    };

    if (!validateNumberRange(dto.floorNumber, 0, 40)) {
      setError("Номер этажа должен быть от 0 до 40");
      return;
    }
    if (!validateLength(dto.description, 2, LIMITS.floor.description)) {
      setError("Описание этажа должно быть от 2 до 200 символов");
      return;
    }

    setSavingFloor(true);
    try {
      const res = await floorApi.createFloor(selectedBuildingId, dto);
      if (!res.success) {
        setError(res.message || "Не удалось создать этаж");
        return;
      }

      setFloorForm({ floorNumber: 1, description: "" });
      setFPage(1);
      await loadFloors(selectedBuildingId, 1);
    } finally {
      setSavingFloor(false);
    }
  };

  const submitLocation = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedFloorId) {
      setError("Выберите этаж для создания места");
      return;
    }

    const dto = {
      name: cutToMax(locationForm.name, LIMITS.location.name).trim(),
      isAudience: !!locationForm.isAudience,
      description: cutToMax(
        locationForm.description,
        LIMITS.location.description,
      ).trim(),
    };

    if (!validateLength(dto.name, 2, LIMITS.location.name)) {
      setError("Название места должно быть от 2 до 30 символов");
      return;
    }
    if (!validateLength(dto.description, 2, LIMITS.location.description)) {
      setError("Описание места должно быть от 2 до 200 символов");
      return;
    }

    setSavingLocation(true);
    try {
      const res = await locationApi.createLocation(selectedFloorId, dto);
      if (!res.success) {
        setError(res.message || "Не удалось создать место");
        return;
      }

      setLocationForm({ name: "", isAudience: false, description: "" });
      setLPage(1);
      await loadLocations(selectedFloorId, 1);
    } finally {
      setSavingLocation(false);
    }
  };

  /* ===================== OPEN EDIT (сброс ошибок модалки) ===================== */

  const openEditBuilding = (b) => {
    setEditBuilding(b);
    setEditBuildingErrors({});
    setEditBuildingForm({
      name: cutToMax(b.name || "", LIMITS.building.name),
      description: cutToMax(b.description || "", LIMITS.building.description),
      address: cutToMax(b.address || "", LIMITS.building.address),
    });
  };

  const openEditFloor = (f) => {
    setEditFloor(f);
    setEditFloorErrors({});
    setEditFloorForm({
      floorNumber: f.floorNumber ?? 1,
      description: cutToMax(f.description || "", LIMITS.floor.description),
    });
  };

  const openEditLocation = (l) => {
    setEditLocation(l);
    setEditLocationErrors({});
    setEditLocationForm({
      name: cutToMax(l.name || "", LIMITS.location.name),
      isAudience: !!l.isAudience,
      description: cutToMax(l.description || "", LIMITS.location.description),
    });
  };

  /* ===================== EDIT (валидация под полем в модалке) ===================== */

  const saveEditBuilding = async () => {
    if (!editBuilding?.id) return;

    const dto = {
      name: cutToMax(editBuildingForm.name, LIMITS.building.name).trim(),
      description: cutToMax(
        editBuildingForm.description,
        LIMITS.building.description,
      ).trim(),
      address: cutToMax(
        editBuildingForm.address,
        LIMITS.building.address,
      ).trim(),
    };

    const errors = {};

    if (!validateLength(dto.name, 2, LIMITS.building.name)) {
      errors.name = "Название должно быть от 2 до 20 символов";
    }
    if (!validateLength(dto.description, 2, LIMITS.building.description)) {
      errors.description = "Описание должно быть от 2 до 100 символов";
    }
    if (!validateLength(dto.address, 2, LIMITS.building.address)) {
      errors.address = "Адрес должен быть от 2 до 100 символов";
    }

    if (Object.keys(errors).length > 0) {
      setEditBuildingErrors(errors);
      return;
    }

    setEditBuildingErrors({});
    setSavingEditBuilding(true);

    try {
      await buildingApi.api.put(`/${editBuilding.id}`, dto);

      setEditBuilding(null);
      await loadBuildings(bPage);
    } catch (err) {
      setEditBuildingErrors({
        _general:
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Не удалось обновить здание",
      });
    } finally {
      setSavingEditBuilding(false);
    }
  };

  const saveEditFloor = async () => {
    if (!editFloor?.id || !selectedBuildingId) return;

    const dto = {
      floorNumber: Number(editFloorForm.floorNumber),
      description: cutToMax(
        editFloorForm.description,
        LIMITS.floor.description,
      ).trim(),
    };

    const errors = {};

    if (!validateNumberRange(dto.floorNumber, 0, 40)) {
      errors.floorNumber = "Номер этажа должен быть от 0 до 40";
    }
    if (!validateLength(dto.description, 2, LIMITS.floor.description)) {
      errors.description = "Описание должно быть от 2 до 200 символов";
    }

    if (Object.keys(errors).length > 0) {
      setEditFloorErrors(errors);
      return;
    }

    setEditFloorErrors({});
    setSavingEditFloor(true);

    try {
      const res = await floorApi.updateFloor(
        selectedBuildingId,
        editFloor.id,
        dto,
      );

      if (!res.success) {
        setEditFloorErrors({
          _general: res.message || "Не удалось обновить этаж",
        });
        return;
      }

      setEditFloor(null);
      await loadFloors(selectedBuildingId, fPage);
    } finally {
      setSavingEditFloor(false);
    }
  };

  const saveEditLocation = async () => {
    if (!editLocation?.id || !selectedFloorId) return;

    const dto = {
      name: cutToMax(editLocationForm.name, LIMITS.location.name).trim(),
      isAudience: !!editLocationForm.isAudience,
      description: cutToMax(
        editLocationForm.description,
        LIMITS.location.description,
      ).trim(),
    };

    const errors = {};

    if (!validateLength(dto.name, 2, LIMITS.location.name)) {
      errors.name = "Название должно быть от 2 до 30 символов";
    }
    if (!validateLength(dto.description, 2, LIMITS.location.description)) {
      errors.description = "Описание должно быть от 2 до 200 символов";
    }

    if (Object.keys(errors).length > 0) {
      setEditLocationErrors(errors);
      return;
    }

    setEditLocationErrors({});
    setSavingEditLocation(true);

    try {
      await locationApi.api.put(
        `/${selectedFloorId}/locations/${editLocation.id}`,
        dto,
      );

      setEditLocation(null);
      await loadLocations(selectedFloorId, lPage);
    } catch (err) {
      setEditLocationErrors({
        _general:
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Не удалось обновить место",
      });
    } finally {
      setSavingEditLocation(false);
    }
  };

  /* ===================== DELETE ===================== */

  const deleteFloor = async (floorId) => {
    if (!selectedBuildingId) return;
    if (!window.confirm("Удалить этаж?")) return;

    const res = await floorApi.deleteFloor(selectedBuildingId, floorId);
    if (!res.success) {
      setError(res.message || "Не удалось удалить этаж");
      return;
    }

    await loadFloors(selectedBuildingId, fPage);
  };

  const deleteLocation = async (locationId) => {
    if (!selectedFloorId) return;
    if (!window.confirm("Удалить место?")) return;

    const res = await locationApi.deleteLocation(selectedFloorId, locationId);
    if (!res.success) {
      setError(res.message || "Не удалось удалить место");
      return;
    }

    await loadLocations(selectedFloorId, lPage);
  };

  /* ===================== LOCAL PAGINATION EFFECT ===================== */

  useEffect(() => {
    if (tab !== TAB.LOCATIONS) return;
    if (locationsServerPaged) return;

    const all = allLocationsNoServerPaging || [];
    const tp = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    setLTotalPages(tp);

    const slice = all.slice((lPage - 1) * PAGE_SIZE, lPage * PAGE_SIZE);
    setLocations(slice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lPage, locationsServerPaged]);

  const inputErrorStyle = { borderColor: "#ef4444" };
  const fieldErrorStyle = { color: "#ef4444", fontSize: 12, marginTop: 6 };
  const generalErrorStyle = {
    color: "#ef4444",
    marginBottom: 12,
    fontSize: 14,
  };

  return (
    <div className="sa-admin">
      <div className="sa-bg" />
      <div className="sa-floating-shapes" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="sa-shell">
        <StructureAdminHeader tab={tab} onChangeTab={setTab} />

        <ErrorBanner message={error} />

        <div className="sa-content">
          {tab === TAB.BUILDINGS && (
            <BuildingsTab
              buildingForm={buildingForm}
              setBuildingForm={setBuildingFormSafe}
              savingBuilding={savingBuilding}
              onSubmitBuilding={submitBuilding}
              buildings={buildings}
              loadingList={loadingList}
              bPage={bPage}
              bTotalPages={bTotalPages}
              onBuildingsPageChange={(p) => {
                setBPage(p);
                loadBuildings(p);
              }}
              onEditBuilding={openEditBuilding}
            />
          )}

          {tab === TAB.FLOORS && (
            <FloorsTab
              buildings={buildings}
              selectedBuildingId={selectedBuildingId}
              setSelectedBuildingId={setSelectedBuildingId}
              floorForm={floorForm}
              setFloorForm={setFloorFormSafe}
              savingFloor={savingFloor}
              onSubmitFloor={submitFloor}
              floors={floors}
              loadingList={loadingList}
              fPage={fPage}
              fTotalPages={fTotalPages}
              onFloorsPageChange={(p) => {
                setFPage(p);
                loadFloors(selectedBuildingId, p);
              }}
              onEditFloor={openEditFloor}
              onDeleteFloor={deleteFloor}
            />
          )}

          {tab === TAB.LOCATIONS && (
            <LocationsTab
              buildings={buildings}
              floors={floors}
              selectedBuildingId={selectedBuildingId}
              setSelectedBuildingId={setSelectedBuildingId}
              selectedFloorId={selectedFloorId}
              setSelectedFloorId={setSelectedFloorId}
              locationForm={locationForm}
              setLocationForm={setLocationFormSafe}
              savingLocation={savingLocation}
              onSubmitLocation={submitLocation}
              locations={locations}
              loadingList={loadingList}
              lPage={lPage}
              lTotalPages={lTotalPages}
              locationsServerPaged={locationsServerPaged}
              onLocationsPageChange={(p) => {
                setLPage(p);
                loadLocations(selectedFloorId, p);
              }}
              onEditLocation={openEditLocation}
              onDeleteLocation={deleteLocation}
            />
          )}
        </div>

        {/* ===================== EDIT BUILDING MODAL ===================== */}
        <EditModal
          isOpen={!!editBuilding}
          title="Редактировать здание"
          onClose={() => {
            setEditBuilding(null);
            setEditBuildingErrors({});
          }}
          onSave={saveEditBuilding}
          saving={savingEditBuilding}
        >
          {editBuildingErrors._general && (
            <div style={generalErrorStyle}>{editBuildingErrors._general}</div>
          )}

          <div className="sa-formGrid">
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="form-label">Название</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {(editBuildingForm.name || "").length}/{LIMITS.building.name}
                </span>
              </div>
              <input
                className="form-input"
                value={editBuildingForm.name}
                maxLength={LIMITS.building.name}
                style={editBuildingErrors.name ? inputErrorStyle : undefined}
                onChange={(e) => {
                  const v = cutToMax(e.target.value, LIMITS.building.name);
                  setEditBuildingForm((p) => ({ ...p, name: v }));
                  if (editBuildingErrors.name) {
                    setEditBuildingErrors((p) => ({ ...p, name: undefined }));
                  }
                }}
              />
              {editBuildingErrors.name && (
                <div style={fieldErrorStyle}>{editBuildingErrors.name}</div>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="form-label">Описание</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {(editBuildingForm.description || "").length}/
                  {LIMITS.building.description}
                </span>
              </div>
              <input
                className="form-input"
                value={editBuildingForm.description}
                maxLength={LIMITS.building.description}
                style={
                  editBuildingErrors.description ? inputErrorStyle : undefined
                }
                onChange={(e) => {
                  const v = cutToMax(
                    e.target.value,
                    LIMITS.building.description,
                  );
                  setEditBuildingForm((p) => ({ ...p, description: v }));
                  if (editBuildingErrors.description) {
                    setEditBuildingErrors((p) => ({
                      ...p,
                      description: undefined,
                    }));
                  }
                }}
              />
              {editBuildingErrors.description && (
                <div style={fieldErrorStyle}>
                  {editBuildingErrors.description}
                </div>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="form-label">Адрес</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {(editBuildingForm.address || "").length}/
                  {LIMITS.building.address}
                </span>
              </div>
              <input
                className="form-input"
                value={editBuildingForm.address}
                maxLength={LIMITS.building.address}
                style={editBuildingErrors.address ? inputErrorStyle : undefined}
                onChange={(e) => {
                  const v = cutToMax(e.target.value, LIMITS.building.address);
                  setEditBuildingForm((p) => ({ ...p, address: v }));
                  if (editBuildingErrors.address) {
                    setEditBuildingErrors((p) => ({
                      ...p,
                      address: undefined,
                    }));
                  }
                }}
              />
              {editBuildingErrors.address && (
                <div style={fieldErrorStyle}>{editBuildingErrors.address}</div>
              )}
            </div>
          </div>
        </EditModal>

        {/* ===================== EDIT FLOOR MODAL ===================== */}
        <EditModal
          isOpen={!!editFloor}
          title="Редактировать этаж"
          onClose={() => {
            setEditFloor(null);
            setEditFloorErrors({});
          }}
          onSave={saveEditFloor}
          saving={savingEditFloor}
        >
          {editFloorErrors._general && (
            <div style={generalErrorStyle}>{editFloorErrors._general}</div>
          )}

          <div className="sa-formGrid">
            <div className="form-group">
              <label className="form-label">Номер этажа (0–40)</label>
              <input
                type="number"
                min={LIMITS.floor.floorNumberMin}
                max={LIMITS.floor.floorNumberMax}
                className="form-input"
                value={editFloorForm.floorNumber}
                style={
                  editFloorErrors.floorNumber ? inputErrorStyle : undefined
                }
                onChange={(e) => {
                  const v = e.target.value;
                  const next =
                    v === ""
                      ? ""
                      : clampIntString(
                          v,
                          LIMITS.floor.floorNumberMin,
                          LIMITS.floor.floorNumberMax,
                          String(editFloorForm.floorNumber ?? 1),
                        );

                  setEditFloorForm((p) => ({
                    ...p,
                    floorNumber: next === "" ? "" : Number(next),
                  }));

                  if (editFloorErrors.floorNumber) {
                    setEditFloorErrors((p) => ({
                      ...p,
                      floorNumber: undefined,
                    }));
                  }
                }}
              />
              {editFloorErrors.floorNumber && (
                <div style={fieldErrorStyle}>{editFloorErrors.floorNumber}</div>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="form-label">Описание</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {(editFloorForm.description || "").length}/
                  {LIMITS.floor.description}
                </span>
              </div>
              <input
                className="form-input"
                value={editFloorForm.description}
                maxLength={LIMITS.floor.description}
                style={
                  editFloorErrors.description ? inputErrorStyle : undefined
                }
                onChange={(e) => {
                  const v = cutToMax(e.target.value, LIMITS.floor.description);
                  setEditFloorForm((p) => ({ ...p, description: v }));
                  if (editFloorErrors.description) {
                    setEditFloorErrors((p) => ({
                      ...p,
                      description: undefined,
                    }));
                  }
                }}
              />
              {editFloorErrors.description && (
                <div style={fieldErrorStyle}>{editFloorErrors.description}</div>
              )}
            </div>
          </div>
        </EditModal>

        {/* ===================== EDIT LOCATION MODAL ===================== */}
        <EditModal
          isOpen={!!editLocation}
          title="Редактировать место"
          onClose={() => {
            setEditLocation(null);
            setEditLocationErrors({});
          }}
          onSave={saveEditLocation}
          saving={savingEditLocation}
        >
          {editLocationErrors._general && (
            <div style={generalErrorStyle}>{editLocationErrors._general}</div>
          )}

          <div className="sa-formGrid">
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="form-label">Название</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {(editLocationForm.name || "").length}/{LIMITS.location.name}
                </span>
              </div>
              <input
                className="form-input"
                value={editLocationForm.name}
                maxLength={LIMITS.location.name}
                style={editLocationErrors.name ? inputErrorStyle : undefined}
                onChange={(e) => {
                  const v = cutToMax(e.target.value, LIMITS.location.name);
                  setEditLocationForm((p) => ({ ...p, name: v }));
                  if (editLocationErrors.name) {
                    setEditLocationErrors((p) => ({ ...p, name: undefined }));
                  }
                }}
              />
              {editLocationErrors.name && (
                <div style={fieldErrorStyle}>{editLocationErrors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Аудитория</label>
              <div className="sa-checkboxRow">
                <input
                  type="checkbox"
                  checked={editLocationForm.isAudience}
                  onChange={(e) =>
                    setEditLocationForm((p) => ({
                      ...p,
                      isAudience: e.target.checked,
                    }))
                  }
                />
                <span className="sa-muted">
                  {editLocationForm.isAudience ? "Да" : "Нет"}
                </span>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="form-label">Описание</label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {(editLocationForm.description || "").length}/
                  {LIMITS.location.description}
                </span>
              </div>
              <input
                className="form-input"
                value={editLocationForm.description}
                maxLength={LIMITS.location.description}
                style={
                  editLocationErrors.description ? inputErrorStyle : undefined
                }
                onChange={(e) => {
                  const v = cutToMax(
                    e.target.value,
                    LIMITS.location.description,
                  );
                  setEditLocationForm((p) => ({ ...p, description: v }));
                  if (editLocationErrors.description) {
                    setEditLocationErrors((p) => ({
                      ...p,
                      description: undefined,
                    }));
                  }
                }}
              />
              {editLocationErrors.description && (
                <div style={fieldErrorStyle}>
                  {editLocationErrors.description}
                </div>
              )}
            </div>
          </div>
        </EditModal>
      </div>
    </div>
  );
}
