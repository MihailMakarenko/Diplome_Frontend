import React, { useEffect, useMemo, useState } from "react";
import "./RegistrationModal.css";
import { IconCamera } from "../Icons.js";
import AuthApi from "../../apiServices/authenticationApi.js";
import { toast } from "react-toastify";

const NAME_MIN = 2;
const NAME_MAX = 25;

// Разрешаем только буквы (рус/лат) и тире
const NAME_ALLOWED_RE = /^[A-Za-zА-Яа-яЁё-]+$/;
const NAME_SANITIZE_RE = /[^A-Za-zА-Яа-яЁё-]/g;

// +375 + 9 цифр
const PHONE_PATTERN = /^\+375\d{9}$/;

// базовая проверка email (дополнительно к type="email")
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegistrationModal = ({ isOpen, onClose, onRegisterSuccess }) => {
  const [preview, setPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    secondName: "",
    email: "",
    phone: "",
    role: "User",
  });

  const [errors, setErrors] = useState({});

  const authApi = useMemo(() => new AuthApi(), []);

  const resetState = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhotoFile(null);
    setIsLoading(false);
    setErrors({});
    setForm({
      lastName: "",
      firstName: "",
      secondName: "",
      email: "",
      phone: "",
      role: "User",
    });
  };

  useEffect(() => {
    if (!isOpen) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const sanitizeName = (value) => {
    const s = (value ?? "").toString();
    const cleaned = s.replace(NAME_SANITIZE_RE, "");
    return cleaned.length > NAME_MAX ? cleaned.slice(0, NAME_MAX) : cleaned;
  };

  const setNameField = (name, value) => {
    setField(name, sanitizeName(value));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);
    const objectUrl = URL.createObjectURL(file);

    setPhotoFile(file);
    setPreview(objectUrl);
  };

  const validateNameField = (label, raw, fieldKey) => {
    const v = (raw ?? "").toString().trim();

    if (v.length < NAME_MIN || v.length > NAME_MAX) {
      return `${label}: от ${NAME_MIN} до ${NAME_MAX} символов`;
    }
    if (!NAME_ALLOWED_RE.test(v)) {
      return `${label}: только буквы и тире`;
    }
    return "";
  };

  const validate = () => {
    const nextErrors = {};

    const lastNameErr = validateNameField("Фамилия", form.lastName, "lastName");
    if (lastNameErr) nextErrors.lastName = lastNameErr;

    const firstNameErr = validateNameField("Имя", form.firstName, "firstName");
    if (firstNameErr) nextErrors.firstName = firstNameErr;

    const secondNameErr = validateNameField(
      "Отчество",
      form.secondName,
      "secondName",
    );
    if (secondNameErr) nextErrors.secondName = secondNameErr;

    const email = form.email.trim();
    if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Введите корректный email";
    }

    const phone = form.phone.trim();
    if (!PHONE_PATTERN.test(phone)) {
      nextErrors.phone = "Формат: +375XXXXXXXXX (9 цифр после +375)";
    }

    setErrors(nextErrors);
    return { ok: Object.keys(nextErrors).length === 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const v = validate();
    if (!v.ok) {
      toast.error("Проверьте корректность заполнения полей");
      return;
    }

    setIsLoading(true);

    const userData = {
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      secondName: form.secondName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      photo: photoFile, // File | null
    };

    try {
      const response = await authApi.registerUser(userData);

      if (response.success) {
        toast.success(response.message || "Пользователь успешно создан!");
        onRegisterSuccess?.();
        onClose?.();
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

  const inputErrorStyle = { borderColor: "#ef4444" };
  const errorTextStyle = { color: "#ef4444", fontSize: 12, marginTop: 6 };
  const hintStyle = { color: "#64748b", fontSize: 12, marginTop: 6 };

  return (
    <div className="registration-modal">
      <div className="rm-overlay" onClick={onClose}>
        <div className="rm-card" onClick={(e) => e.stopPropagation()}>
          <div className="rm-header">
            <h2 className="rm-title">Новый пользователь</h2>
            <button className="rm-close-btn" onClick={onClose} type="button">
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
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
                  value={form.lastName}
                  onChange={(e) => setNameField("lastName", e.target.value)}
                  minLength={NAME_MIN}
                  maxLength={NAME_MAX}
                  required
                  pattern="^[A-Za-zА-Яа-яЁё-]{2,25}$"
                  style={errors.lastName ? inputErrorStyle : undefined}
                  autoComplete="family-name"
                />
                {errors.lastName ? (
                  <div style={errorTextStyle}>{errors.lastName}</div>
                ) : (
                  <div style={hintStyle}>
                    Только буквы и тире, 2–25 символов
                  </div>
                )}
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label">Имя</label>
                <input
                  name="firstName"
                  className="rm-form-input"
                  placeholder="Иван"
                  value={form.firstName}
                  onChange={(e) => setNameField("firstName", e.target.value)}
                  minLength={NAME_MIN}
                  maxLength={NAME_MAX}
                  required
                  pattern="^[A-Za-zА-Яа-яЁё-]{2,25}$"
                  style={errors.firstName ? inputErrorStyle : undefined}
                  autoComplete="given-name"
                />
                {errors.firstName ? (
                  <div style={errorTextStyle}>{errors.firstName}</div>
                ) : (
                  <div style={hintStyle}>
                    Только буквы и тире, 2–25 символов
                  </div>
                )}
              </div>
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Отчество</label>
              <input
                name="secondName"
                className="rm-form-input"
                placeholder="Иванович"
                value={form.secondName}
                onChange={(e) => setNameField("secondName", e.target.value)}
                minLength={NAME_MIN}
                maxLength={NAME_MAX}
                required
                pattern="^[A-Za-zА-Яа-яЁё-]{2,25}$"
                style={errors.secondName ? inputErrorStyle : undefined}
                autoComplete="additional-name"
              />
              {errors.secondName ? (
                <div style={errorTextStyle}>{errors.secondName}</div>
              ) : (
                <div style={hintStyle}>Только буквы и тире, 2–25 символов</div>
              )}
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Email</label>
              <input
                name="email"
                type="email"
                className="rm-form-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                required
                style={errors.email ? inputErrorStyle : undefined}
                autoComplete="email"
              />
              {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Телефон</label>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                className="rm-form-input"
                placeholder="+375291234567"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                required
                pattern="^\+375\d{9}$"
                style={errors.phone ? inputErrorStyle : undefined}
                autoComplete="tel"
              />
              {errors.phone && <div style={errorTextStyle}>{errors.phone}</div>}
            </div>

            <div className="rm-form-group">
              <label className="rm-form-label">Роль</label>
              <select
                name="role"
                className="rm-form-select"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                required
              >
                <option value="User">Пользователь</option>
                <option value="Employee">Сотрудник</option>
                <option value="Admin">Администратор</option>
                <option value="Manager">Менеджер</option>
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
