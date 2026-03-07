import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Импорт для навигации
import "./Login.css";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
} from "react-icons/fa";
import AuthApi from "../../apiServices/authenticationApi.js";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Инициализация API и Навигации
  const authServerApi = new AuthApi();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    // Простая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) newErrors.email = "Укажите почту";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Неверный формат почты";

    if (!formData.password) newErrors.password = "Введите пароль";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очищаем ошибку при вводе
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errors.form) setErrors((prev) => ({ ...prev, form: "" })); // Очищаем общую ошибку
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 1. Вызов метода API
      const result = await authServerApi.loginUser(
        formData.email,
        formData.password,
      );

      if (result.success) {
        console.log("Успешный вход:", result.data);

        // 2. Сохранение токена (предполагаем, что он в result.data.token)
        if (result.data.token) {
          localStorage.setItem("authToken", result.data.token);
          // Также можно сохранить роль или user info, если они есть
          // localStorage.setItem("userRole", result.data.role);
        }

        // 3. Перенаправление (замените путь на нужный, например '/dashboard')
        navigate("/UserProfile");
      } else {
        // Ошибка от сервера (неверный пароль и т.д.)
        setErrors((prev) => ({
          ...prev,
          form: result.message || "Неверный логин или пароль",
        }));
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors((prev) => ({
        ...prev,
        form: "Ошибка сети. Попробуйте позже.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true">
        <div className="floating-shapes">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <main className="login-card" role="main">
        <header className="login-header">
          <div className="logo-ring" aria-label="Логотип университета">
            <FaGraduationCap aria-hidden="true" />
          </div>
          <h1 className="institution-name">Университетская Служба Поддержки</h1>
          <p className="system-tagline">Система обработки заявок</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Общая ошибка формы */}
          {errors.form && (
            <div
              style={{
                color: "#ef4444",
                marginBottom: "15px",
                textAlign: "center",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              {errors.form}
            </div>
          )}

          <div className={`form-field ${errors.email ? "field-error" : ""}`}>
            <div className="field-icon" aria-hidden="true">
              <FaEnvelope />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="field-input"
              aria-invalid={!!errors.email}
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className={`form-field ${errors.password ? "field-error" : ""}`}>
            <div className="field-icon" aria-hidden="true">
              <FaLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Пароль"
              className="field-input"
              aria-invalid={!!errors.password}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={toggleShowPassword}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && (
              <span className="error-message" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Вход..." : "Войти в систему"}
          </button>

          <footer className="login-footer">
            <button type="button" className="forgot-password-link">
              Забыли пароль?
            </button>
            <span className="divider">|</span>
            <button type="button" className="help-link">
              Нужна помощь?
            </button>
          </footer>
        </form>

        <aside className="info-banner" role="note">
          <p>🎓 Новый учебный год! Система работает в штатном режиме</p>
        </aside>
      </main>
    </div>
  );
};

export default LoginPage;
