import React, { useState, useEffect, useRef, useMemo } from "react";
import "./CreateRequestModal.css";
import UserApi from "../../apiServices/usersApi";
import RequestForUesrServerApi from "../../apiServices/requestForUserApi";
import LocationApi from "../../apiServices/locationApi";
import BuilgingApi from "../../apiServices/buildingApi";
import FloorApi from "../../apiServices/floorApi";
import TypeOfProblemApi from "../../apiServices/typeProblemsApi";
import RequestPhotoApi from "../../apiServices/requestPhotoApi";
import { IconCamera, IconX } from "../Icons";

const CreateRequestModal = ({ isOpen, onClose, onSuccess }) => {
  // Основные поля формы
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Средний");

  // Состояния для Типов проблем (с пагинацией)
  const [problemTypes, setProblemTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Пагинация типов проблем
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const PAGE_SIZE = 10;

  // Состояния для локаций
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [spots, setSpots] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedSpot, setSelectedSpot] = useState("");

  // Фотографии
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  // API сервисы
  const locationApi = useMemo(() => new LocationApi(), []);
  const floorApi = useMemo(() => new FloorApi(), []);
  const buildingApi = useMemo(() => new BuilgingApi(), []);
  const typeOfProblemApi = useMemo(() => new TypeOfProblemApi(), []);
  const requestPhotoApi = useMemo(() => new RequestPhotoApi(), []);
  const requestApi = useMemo(() => new RequestForUesrServerApi(), []);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Сброс и загрузка при открытии модалки
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Клиентская фильтрация списка (по уже загруженным данным)
  useEffect(() => {
    if (searchTerm === "" || selectedType) {
      setFilteredTypes(problemTypes);
    } else {
      setFilteredTypes(
        problemTypes.filter((t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }
  }, [searchTerm, problemTypes, selectedType]);

  const loadInitialData = async () => {
    try {
      setPage(1);
      setHasMore(true);

      const [typesRes, buildingsRes] = await Promise.all([
        typeOfProblemApi.GetProblemTypes(1, PAGE_SIZE),
        buildingApi.getBuildings(),
      ]);

      if (typesRes.success) {
        const data = typesRes.data || [];
        setProblemTypes(data);
        if (data.length < PAGE_SIZE) setHasMore(false);
      }
      if (buildingsRes.success) setBuildings(buildingsRes.data || []);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  };

  const loadMoreTypes = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const res = await typeOfProblemApi.GetProblemTypes(nextPage, PAGE_SIZE);
      if (res.success && res.data) {
        const newData = res.data;
        if (newData.length === 0) {
          setHasMore(false);
        } else {
          setProblemTypes((prev) => [...prev, ...newData]);
          setPage(nextPage);
          if (newData.length < PAGE_SIZE) setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Ошибка подгрузки типов:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleDropdownScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      loadMoreTypes();
    }
  };

  const handleBuildingChange = async (e) => {
    const buildingId = e.target.value;
    setSelectedBuilding(buildingId);
    setSelectedFloor("");
    setSelectedSpot("");
    setFloors([]);
    setSpots([]);
    if (buildingId) {
      const res = await floorApi.getFloorsForBuilding(buildingId);
      if (res.success) setFloors(res.data || []);
    }
  };

  const handleFloorChange = async (e) => {
    const floorId = e.target.value;
    setSelectedFloor(floorId);
    setSelectedSpot("");
    setSpots([]);
    if (floorId) {
      const res = await locationApi.getLocationsForFloor(floorId);
      if (res.success) setSpots(res.data || []);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSearchTerm(type.title);
    setIsDropdownOpen(false);
  };

  const resetForm = () => {
    setDescription("");
    setPriority("Средний");
    setSearchTerm("");
    setSelectedType(null);
    setSelectedBuilding("");
    setSelectedFloor("");
    setSelectedSpot("");
    setPhotos([]);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews([]);
    setPage(1);
    setHasMore(true);
    setProblemTypes([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация
    if (!selectedType) return alert("Выберите тип проблемы");
    if (!selectedSpot) return alert("Выберите место");
    if (description.trim().length < 3) {
      return alert("Описание должно содержать не менее 3 символов");
    }
    if (description.length > 100) {
      return alert("Описание не должно превышать 100 символов");
    }

    setIsLoading(true);
    const requestData = {
      typeOfProblemId: selectedType.id,
      priority: priority,
      description: description.trim(),
      locationId: selectedSpot,
      status: "Создана",
    };

    try {
      const response = await requestApi.CreateRequestForUser(requestData);
      if (response.success && response.data) {
        const newRequestId = response.data.id;
        if (photos.length > 0) {
          await requestPhotoApi.UploadPhotosForRequest(newRequestId, photos);
        }
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert("Ошибка создания: " + response.message);
      }
    } catch (error) {
      console.error(error);
      alert("Не удалось создать заявку");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const priorityOptions = ["Низкий", "Средний", "Высокий", "Критический"];

  const getPriorityClass = (p) => {
    if (p === "Низкий") return "Low";
    if (p === "Средний") return "Medium";
    if (p === "Высокий") return "High";
    if (p === "Критический") return "Critical";
    return "";
  };

  return (
    <div className="create-request-modal">
      <div className="crm-overlay" onClick={onClose}>
        <div className="crm-card" onClick={(e) => e.stopPropagation()}>
          <div className="crm-header">
            <h2 className="crm-title">Новая заявка</h2>
            <button className="crm-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="crm-form-group" ref={dropdownRef}>
              <label className="crm-form-label">Тип проблемы</label>
              <div className="crm-search-dropdown-container">
                <input
                  className="crm-form-input"
                  placeholder="Выберите тип..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedType) setSelectedType(null);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  required
                />

                {isDropdownOpen && (
                  <div
                    className="crm-dropdown-list"
                    onScroll={handleDropdownScroll}
                  >
                    {filteredTypes.length > 0 ? (
                      filteredTypes.map((type) => (
                        <div
                          key={type.id}
                          className="crm-dropdown-item"
                          onClick={() => handleTypeSelect(type)}
                        >
                          {type.title}
                        </div>
                      ))
                    ) : (
                      <div className="crm-dropdown-empty">
                        Ничего не найдено
                      </div>
                    )}

                    {isFetchingMore && (
                      <div className="crm-dropdown-loading">Загрузка...</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Приоритет</label>
              <div className="crm-priority-selector">
                {priorityOptions.map((p) => (
                  <div
                    key={p}
                    className={`crm-priority-btn ${getPriorityClass(p)} ${
                      priority === p ? "active" : ""
                    }`}
                    onClick={() => setPriority(p)}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Местоположение</label>
              <div className="crm-location-cascade">
                <select
                  className="crm-form-select"
                  value={selectedBuilding}
                  onChange={handleBuildingChange}
                  required
                >
                  <option value="" disabled>
                    1. Здание
                  </option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <select
                  className="crm-form-select"
                  value={selectedFloor}
                  onChange={handleFloorChange}
                  disabled={!selectedBuilding}
                  required
                  style={{ marginTop: 10 }}
                >
                  <option value="" disabled>
                    2. Этаж
                  </option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || `Этаж ${f.floorNumber || f.number}`}
                    </option>
                  ))}
                </select>

                <select
                  className="crm-form-select"
                  value={selectedSpot}
                  onChange={(e) => setSelectedSpot(e.target.value)}
                  disabled={!selectedFloor}
                  required
                  style={{ marginTop: 10 }}
                >
                  <option value="" disabled>
                    3. Помещение
                  </option>
                  {spots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crm-form-group">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label className="crm-form-label">Описание</label>
                <span
                  style={{
                    fontSize: "12px",
                    color: description.length > 200 ? "red" : "#888",
                  }}
                >
                  {description.length}/200
                </span>
              </div>
              <textarea
                className="crm-form-textarea"
                rows="3"
                placeholder="Описание (от 3 до 200 символов)..."
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
              {description.length > 0 && description.length < 3 && (
                <span style={{ color: "orange", fontSize: "11px" }}>
                  Слишком коротко
                </span>
              )}
              {description.length > 200 && (
                <span style={{ color: "red", fontSize: "11px" }}>
                  Превышен лимит символов
                </span>
              )}
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Фотографии</label>
              <div className="crm-photos-upload-area">
                {previews.map((src, idx) => (
                  <div key={idx} className="crm-photo-preview-item">
                    <img src={src} alt="Preview" />
                    <button
                      type="button"
                      className="crm-btn-remove-photo"
                      onClick={() => removePhoto(idx)}
                    >
                      <IconX />
                    </button>
                  </div>
                ))}

                <div
                  className="crm-btn-add-photo"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconCamera />
                  <span>Добавить</span>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="crm-btn-submit"
              disabled={
                isLoading || description.length < 3 || description.length > 100
              }
            >
              {isLoading ? "Отправка..." : "Создать заявку"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestModal;
