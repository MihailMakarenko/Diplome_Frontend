import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../imgs/logo-big.png";
import "./Header.css";
import { AuthContext } from "../../auth/AuthContext";

const Header = ({ showCreateButton = false, onCreateClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  // Если мы на странице user/profile — скрываем кнопку "Профиль"
  const isUserProfilePage =
    location.pathname === "/user/profile" ||
    location.pathname.startsWith("/user/profile/");

  const handleLogout = () => {
    logout();
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/user/profile");
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="Логотип" className="logo" />
        <h1 className="title">Система заявок</h1>
      </div>

      <div className="header-right">
        {showCreateButton && (
          <button
            type="button"
            className="header-btn create-btn"
            onClick={onCreateClick}
          >
            + Создать заявку
          </button>
        )}

        {!isUserProfilePage && (
          <button
            type="button"
            className="header-btn profile-btn"
            onClick={handleProfile}
          >
            Профиль
          </button>
        )}

        <button
          type="button"
          className="header-btn logout-btn"
          onClick={handleLogout}
        >
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;
