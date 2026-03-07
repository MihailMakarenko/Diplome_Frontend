import React, { useState, useEffect, useRef } from "react";
import "./CreateRequestModal.css";
import UserApi from "../../apiServices/usersApi";
import RequestForUesrServerApi from "../../apiServices/requestForUserApi";
import LocationApi from "../../apiServices/locationApi";
import BuilgingApi from "../../apiServices/buildingApi";
import FloorApi from "../../apiServices/floorApi";
import TypeOfProblemApi from "../../apiServices/typeProblemsApi";
import RequestPhotoApi from "../../apiServices/requestPhotoApi"; // Используем для фото
import { IconCamera, IconX } from "../Icons";

const CreateRequestModal = ({ isOpen, onClose, onSuccess }) => {
  // --- STATE ---
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Средний");

  // Тип проблемы
  const [problemTypes, setProblemTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Локация
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [spots, setSpots] = useState([]);

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedSpot, setSelectedSpot] = useState("");

  // Фотографии
  const [photos, setPhotos] = useState([]); // Массив файлов
  const [previews, setPreviews] = useState([]); // Массив URL для предпросмотра

  const [isLoading, setIsLoading] = useState(false);

  // Инициализация API
  const userApi = new UserApi(); // Для создания заявки
  const locationApi = new LocationApi();
  const floorApi = new FloorApi();
  const buildingApi = new BuilgingApi();
  const typeOfProblemApi = new TypeOfProblemApi();
  const requestPhotoApi = new RequestPhotoApi(); // Для фото
  const RequestApi = new RequestForUesrServerApi();

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredTypes(problemTypes);
    } else {
      setFilteredTypes(
        problemTypes.filter((t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }
  }, [searchTerm, problemTypes]);

  // --- DATA LOADING ---
  const loadInitialData = async () => {
    try {
      // Загружаем типы проблем
      const typesRes = await typeOfProblemApi.GetProblemTypes();
      // Загружаем здания
      const buildingsRes = await buildingApi.getBuildings();

      if (typesRes.success) setProblemTypes(typesRes.data);
      if (buildingsRes.success) setBuildings(buildingsRes.data);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
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
      if (res.success) setFloors(res.data);
    }
  };

  const handleFloorChange = async (e) => {
    const floorId = e.target.value;
    setSelectedFloor(floorId);
    setSelectedSpot("");
    setSpots([]);
    if (floorId) {
      const res = await locationApi.getLocationsForFloor(floorId);
      if (res.success) setSpots(res.data);
    }
  };

  // --- PHOTO HANDLERS ---
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Добавляем файлы в массив
    setPhotos((prev) => [...prev, ...selectedFiles]);

    // Создаем превью
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      // Освобождаем память для URL
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // --- FORM HANDLERS ---
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
    setPreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) return alert("Выберите тип проблемы");
    if (!selectedSpot) return alert("Выберите место");

    setIsLoading(true);

    // 1. Формируем JSON данные заявки
    const requestData = {
      typeOfProblemId: selectedType.id,
      priority: priority,
      description: description,
      locationId: selectedSpot,
      status: "Создана", // Или null, если сервер ставит дефолт
    };
    console.log("Мы тут");
    try {
      // 2. Создаем заявку (отправляем JSON)
      const response = await RequestApi.CreateRequestForUser(requestData);
      console.log(response);
      if (response.success && response.data) {
        const newRequestId = response.data.id; // Получаем ID новой заявки
        console.log(response.data);
        // 3. Если есть фото, отправляем их (FormData)
        if (photos.length > 0) {
          const photoRes = await requestPhotoApi.UploadPhotosForRequest(
            newRequestId,
            photos,
          );

          if (!photoRes.success) {
            console.error("Ошибка загрузки фото:", photoRes.message);
            // Можно показать предупреждение, но заявка уже создана
            alert("Заявка создана, но при загрузке фото произошла ошибка.");
          }
        }

        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert("Ошибка создания заявки: " + response.message);
      }
    } catch (error) {
      console.error(error);
      alert("Не удалось создать заявку");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Новая заявка</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Тип проблемы */}
          <div className="form-group" ref={dropdownRef}>
            <label className="form-label">Тип проблемы</label>
            <div className="search-dropdown-container">
              <input
                className="form-input"
                placeholder="Выберите тип..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedType(null);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                required
              />
              {isDropdownOpen && filteredTypes.length > 0 && (
                <div className="dropdown-list">
                  {filteredTypes.map((type) => (
                    <div
                      key={type.id}
                      className="dropdown-item"
                      onClick={() => handleTypeSelect(type)}
                    >
                      {type.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Приоритет */}
          <div className="form-group">
            <label className="form-label">Приоритет</label>
            <div className="priority-selector">
              {["Низкий", "Средний", "Высокий"].map((p) => (
                <div
                  key={p}
                  className={`priority-btn ${p === "Низкий" ? "Low" : p === "Средний" ? "Medium" : "High"} ${priority === p ? "active" : ""}`}
                  onClick={() => setPriority(p)}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Локация */}
          <div className="form-group">
            <label className="form-label">Местоположение</label>
            <div className="location-cascade">
              <select
                className="form-select"
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
                className="form-select"
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
                    {/* Проверка на имя поля */}
                    {f.name || f.floorNumber
                      ? `Этаж ${f.floorNumber}`
                      : `Этаж ${f.number}`}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
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

          {/* Описание */}
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Подробности..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Фотографии */}
          <div className="form-group">
            <label className="form-label">Фотографии</label>
            <div className="photos-upload-area">
              {previews.map((src, idx) => (
                <div key={idx} className="photo-preview-item">
                  <img src={src} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={() => removePhoto(idx)}
                  >
                    <IconX />
                  </button>
                </div>
              ))}
              <div
                className="btn-add-photo"
                onClick={() => fileInputRef.current.click()}
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

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? "Отправка..." : "Создать заявку"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;
