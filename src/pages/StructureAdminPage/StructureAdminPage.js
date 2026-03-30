import React, { useEffect, useMemo, useState } from "react";
import "../ManagerPanel/ManagerPanel.css"; // твои базовые btn/inputs
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

  // ============ BUILDINGS ============
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

  // ============ FLOORS ============
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

  // ============ LOCATIONS ============
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

  // ========================= LOADERS =========================

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
      // 1) пробуем серверную пагинацию (если контроллер поддерживает параметры)
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
        // fallback ниже
      }

      // 2) fallback: метод без пагинации -> локальная пагинация
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

  // ========================= INIT / TAB EFFECTS =========================
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

  // ========================= CREATE =========================

  const submitBuilding = async (e) => {
    e.preventDefault();
    setError("");

    setSavingBuilding(true);
    try {
      const dto = {
        name: buildingForm.name || null,
        description: buildingForm.description || null,
        address: buildingForm.address || null,
      };

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

    setSavingFloor(true);
    try {
      const dto = {
        floorNumber: Number(floorForm.floorNumber),
        description: floorForm.description || null,
      };

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

    setSavingLocation(true);
    try {
      const dto = {
        name: locationForm.name || null,
        isAudience: !!locationForm.isAudience,
        description: locationForm.description || null,
      };

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

  // ========================= EDIT (OPEN) =========================

  const openEditBuilding = (b) => {
    setEditBuilding(b);
    setEditBuildingForm({
      name: b.name || "",
      description: b.description || "",
      address: b.address || "",
    });
  };

  const openEditFloor = (f) => {
    setEditFloor(f);
    setEditFloorForm({
      floorNumber: f.floorNumber ?? 1,
      description: f.description || "",
    });
  };

  const openEditLocation = (l) => {
    setEditLocation(l);
    setEditLocationForm({
      name: l.name || "",
      isAudience: !!l.isAudience,
      description: l.description || "",
    });
  };

  // ========================= EDIT (SAVE) =========================

  const saveEditBuilding = async () => {
    if (!editBuilding?.id) return;
    setError("");

    setSavingEditBuilding(true);
    try {
      // в buildingApi нет update -> используем axios instance
      await buildingApi.api.put(`/${editBuilding.id}`, {
        name: editBuildingForm.name || null,
        description: editBuildingForm.description || null,
        address: editBuildingForm.address || null,
      });

      setEditBuilding(null);
      await loadBuildings(bPage);
    } catch (err) {
      setError(err?.response?.data?.message || "Не удалось обновить здание");
    } finally {
      setSavingEditBuilding(false);
    }
  };

  const saveEditFloor = async () => {
    if (!editFloor?.id || !selectedBuildingId) return;
    setError("");

    setSavingEditFloor(true);
    try {
      const res = await floorApi.updateFloor(selectedBuildingId, editFloor.id, {
        floorNumber: Number(editFloorForm.floorNumber),
        description: editFloorForm.description || null,
      });

      if (!res.success) {
        setError(res.message || "Не удалось обновить этаж");
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
    setError("");

    setSavingEditLocation(true);
    try {
      // в locationApi нет update -> используем axios instance
      await locationApi.api.put(
        `/${selectedFloorId}/locations/${editLocation.id}`,
        {
          name: editLocationForm.name || null,
          isAudience: !!editLocationForm.isAudience,
          description: editLocationForm.description || null,
        },
      );

      setEditLocation(null);
      await loadLocations(selectedFloorId, lPage);
    } catch (err) {
      setError(err?.response?.data?.message || "Не удалось обновить место");
    } finally {
      setSavingEditLocation(false);
    }
  };

  // ========================= DELETE =========================

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

  // локальная пагинация locations (если сервер не поддерживает)
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
              setBuildingForm={setBuildingForm}
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
              setFloorForm={setFloorForm}
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
              setLocationForm={setLocationForm}
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

        {/* ===================== MODALS (С ПОЛЯМИ) ===================== */}

        <EditModal
          isOpen={!!editBuilding}
          title="Редактировать здание"
          onClose={() => setEditBuilding(null)}
          onSave={saveEditBuilding}
          saving={savingEditBuilding}
        >
          <div className="sa-formGrid">
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                className="form-input"
                value={editBuildingForm.name}
                onChange={(e) =>
                  setEditBuildingForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <input
                className="form-input"
                value={editBuildingForm.description}
                onChange={(e) =>
                  setEditBuildingForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Адрес</label>
              <input
                className="form-input"
                value={editBuildingForm.address}
                onChange={(e) =>
                  setEditBuildingForm((p) => ({
                    ...p,
                    address: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </EditModal>

        <EditModal
          isOpen={!!editFloor}
          title="Редактировать этаж"
          onClose={() => setEditFloor(null)}
          onSave={saveEditFloor}
          saving={savingEditFloor}
        >
          <div className="sa-formGrid">
            <div className="form-group">
              <label className="form-label">Номер этажа</label>
              <input
                type="number"
                className="form-input"
                value={editFloorForm.floorNumber}
                onChange={(e) =>
                  setEditFloorForm((p) => ({
                    ...p,
                    floorNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <input
                className="form-input"
                value={editFloorForm.description}
                onChange={(e) =>
                  setEditFloorForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </EditModal>

        <EditModal
          isOpen={!!editLocation}
          title="Редактировать место"
          onClose={() => setEditLocation(null)}
          onSave={saveEditLocation}
          saving={savingEditLocation}
        >
          <div className="sa-formGrid">
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                className="form-input"
                value={editLocationForm.name}
                onChange={(e) =>
                  setEditLocationForm((p) => ({ ...p, name: e.target.value }))
                }
              />
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
              <label className="form-label">Описание</label>
              <input
                className="form-input"
                value={editLocationForm.description}
                onChange={(e) =>
                  setEditLocationForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </EditModal>
      </div>
    </div>
  );
}
