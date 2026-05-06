import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../imgs/logo-big.png";
import "./Header.css";

const Header = ({ showCreateButton = false, onCreateClick }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
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
          <button className="header-btn create-btn" onClick={onCreateClick}>
            + Создать заявку
          </button>
        )}

        <button className="header-btn profile-btn" onClick={handleProfile}>
          Профиль
        </button>

        <button className="header-btn logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;
