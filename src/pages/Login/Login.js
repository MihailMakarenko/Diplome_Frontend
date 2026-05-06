import React, { useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
} from "react-icons/fa";
import AuthApi from "../../apiServices/authenticationApi.js";
import { AuthContext } from "../../auth/AuthContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [info, setInfo] = useState(""); // сообщение об успехе forgot password

  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const authServerApi = useMemo(() => new AuthApi(), []);
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = () => {
    const newErrors = {};

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

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errors.form) setErrors((prev) => ({ ...prev, form: "" }));
    if (info) setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await authServerApi.loginUser(
        formData.email,
        formData.password,
      );

      if (!result.success) {
        setErrors((prev) => ({
          ...prev,
          form: result.message || "Неверный логин или пароль",
        }));
        return;
      }

      const accessToken = result.data?.accessToken;
      if (!accessToken) {
        setErrors((prev) => ({
          ...prev,
          form: "Не получен accessToken от сервера",
        }));
        return;
      }

      setToken(accessToken);
      navigate("/app", { replace: true });
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

  const handleForgotPassword = async () => {
    const email = (formData.email || "").trim();

    // простая валидация email
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Укажите почту" }));
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Неверный формат почты" }));
      return;
    }

    setForgotLoading(true);
    setInfo("");
    setErrors((prev) => ({ ...prev, form: "" }));

    try {
      const res = await authServerApi.forgotPassword(email);

      if (!res.success) {
        setErrors((prev) => ({
          ...prev,
          form: res.message || "Не удалось отправить письмо для сброса пароля",
        }));
        return;
      }

      // backend возвращает строку: "Check ... email..."
      setInfo(res.message || "Письмо для сброса пароля отправлено");
    } catch (e) {
      console.error("ForgotPassword error:", e);
      setErrors((prev) => ({
        ...prev,
        form: "Ошибка сети. Попробуйте позже.",
      }));
    } finally {
      setForgotLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <div className="login-page-shell">
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
            <h1 className="institution-name">
              Университетская Служба Поддержки
            </h1>
            <p className="system-tagline">Система обработки заявок</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
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

            {info && (
              <div
                style={{
                  color: "#16a34a",
                  marginBottom: "15px",
                  textAlign: "center",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                {info}
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

            <div
              className={`form-field ${errors.password ? "field-error" : ""}`}
            >
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
              <button
                type="button"
                className="forgot-password-link"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                title="Отправить письмо для сброса пароля"
              >
                {forgotLoading ? "Отправка..." : "Забыли пароль?"}
              </button>

              <span className="divider">|</span>

              <button
                type="button"
                className="help-link"
                onClick={() => {
                  // можешь заменить на нужный контакт/страницу помощи
                  setInfo("");
                  setErrors((prev) => ({
                    ...prev,
                    form: "Обратитесь к администратору системы.",
                  }));
                }}
              >
                Нужна помощь?
              </button>
            </footer>
          </form>

          <aside className="info-banner" role="note">
            <p>🎓 Новый учебный год! Система работает в штатном режиме</p>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
