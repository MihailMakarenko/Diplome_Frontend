import React, { useState, useEffect } from "react";
import "./RegistrationModal.css";
import { IconCamera } from "../Icons.js";
import AuthApi from "../../apiServices/authenticationApi.js";
import { toast } from "react-toastify"; // Убедитесь, что импорт есть

const RegistrationModal = ({ isOpen, onClose, onRegisterSuccess }) => {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const authApi = new AuthApi();

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);

    const userData = {
      lastName: formData.get("lastName"),
      firstName: formData.get("firstName"),
      secondName: formData.get("secondName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      role: formData.get("role"),
      photo: formData.get("photo"),
    };

    try {
      const response = await authApi.registerUser(userData);

      if (response.success) {
        // Успех -> toast.success
        toast.success(response.message || "Пользователь успешно создан!");

        if (onRegisterSuccess) onRegisterSuccess();
        onClose();
      } else {
        // Ошибка от сервера -> toast.error (БЫЛ ALERT)
        // На скриншоте видно, что response.message содержит текст ошибки
        toast.error(`Ошибка: ${response.message}`);
      }
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      // Ошибка скрипта/сети -> toast.error (БЫЛ ALERT)
      toast.error("Произошла системная ошибка при регистрации.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card-reg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-reg">
          <h2 className="modal-title">Новый пользователь</h2>
          <button className="btn-close-reg" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="photo-upload-wrapper">
            <div className="photo-container">
              <label
                htmlFor="photo-upload"
                style={{
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <IconCamera />
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
              <div className="photo-badge">+</div>
            </div>
            <span className="photo-label-text">Загрузить фото</span>
          </div>

          <div className="form-row">
            <div className="form-group-reg">
              <label className="form-label-reg">Фамилия</label>
              <input
                name="lastName"
                className="form-input-reg"
                placeholder="Иванов"
                required
              />
            </div>
            <div className="form-group-reg">
              <label className="form-label-reg">Имя</label>
              <input
                name="firstName"
                className="form-input-reg"
                placeholder="Иван"
                required
              />
            </div>
          </div>

          <div className="form-group-reg">
            <label className="form-label-reg">Отчество</label>
            <input
              name="secondName"
              className="form-input-reg"
              placeholder="Иванович"
            />
          </div>

          <div className="form-group-reg">
            <label className="form-label-reg">Email</label>
            <input
              name="email"
              type="email"
              className="form-input-reg"
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="form-group-reg">
            <label className="form-label-reg">Телефон</label>
            <input
              name="phone"
              className="form-input-reg"
              placeholder="+7 (999) 000-00-00"
              required
            />
          </div>

          <div className="form-group-reg">
            <label className="form-label-reg">Роль</label>
            <select name="role" className="form-select-reg">
              <option value="User">Пользователь</option>
              <option value="Employee">Сотрудник</option>
              <option value="Admin">Администратор</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-reg btn-outline-reg"
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-reg btn-primary-reg"
              disabled={isLoading}
            >
              {isLoading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
