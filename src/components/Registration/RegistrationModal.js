import React, { useEffect, useMemo, useState } from "react";
import "./RegistrationModal.css";
import { IconCamera } from "../Icons.js";
import AuthApi from "../../apiServices/authenticationApi.js";
import { toast } from "react-toastify";

const RegistrationModal = ({ isOpen, onClose, onRegisterSuccess }) => {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const authApi = useMemo(() => new AuthApi(), []);

  useEffect(() => {
    if (!isOpen) {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      setIsLoading(false);
    }
  }, [isOpen, preview]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
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
        toast.success(response.message || "Пользователь успешно создан!");

        if (onRegisterSuccess) onRegisterSuccess();
        onClose();
      } else {
        toast.error(`Ошибка: ${response.message}`);
      }
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      toast.error("Произошла системная ошибка при регистрации.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-modal">
      <div className="rm-overlay" onClick={onClose}>
        <div className="rm-card" onClick={(e) => e.stopPropagation()}>
          <div className="rm-header">
            <h2 className="rm-title">Новый пользователь</h2>
            <button className="rm-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rm-photo-upload-wrapper">
              <div className="rm-photo-container">
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
                    <img
                      src={preview}
                      alt="Preview"
                      className="rm-photo-preview"
                    />
                  ) : (
                    <div className="rm-photo-placeholder">
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

                <div className="rm-photo-badge">+</div>
              </div>

              <span className="rm-photo-label-text">Загрузить фото</span>
            </div>

            <div className="rm-form-row">
              <div className="rm-form-group">
                <label className="rm-form-label">Фамилия</label>
                <input
                  name="lastName"
                  className="rm-form-input"
                  placeholder="Иванов"
                  required
                />
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label">Имя</label>
                <input
                  name="firstName"
                  className="rm-form-input"
                  placeholder="Иван"
                  required
                />
              </div>
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Отчество</label>
              <input
                name="secondName"
                className="rm-form-input"
                placeholder="Иванович"
              />
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Email</label>
              <input
                name="email"
                type="email"
                className="rm-form-input"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Телефон</label>
              <input
                name="phone"
                className="rm-form-input"
                placeholder="+7 (999) 000-00-00"
                required
              />
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Роль</label>
              <select name="role" className="rm-form-select">
                <option value="User">Пользователь</option>
                <option value="Employee">Сотрудник</option>
                <option value="Admin">Администратор</option>
              </select>
            </div>

            <div className="rm-actions">
              <button
                type="button"
                className="rm-btn rm-btn-outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Отмена
              </button>

              <button
                type="submit"
                className="rm-btn rm-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Создание..." : "Создать"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
