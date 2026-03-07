import React, { useState, useEffect } from "react";
import "./AdminPanel.css";
import UserApi from "../../apiServices/usersApi";
import { toast } from "react-toastify";

// Импорт модальных окон
import RegistrationModal from "../../components/Registration/RegistrationModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.js"; // <--- Импорт компонента подтверждения

// Импорт иконок
import {
  IconUsers,
  IconReport,
  IconPlus,
  IconLock,
  IconUnlock,
  IconTrash,
  IconSearch,
} from "../../components/Icons";

function AdminPanel() {
  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Для регистрации

  // Состояние для модального окна удаления
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- PAGINATION STATE ---
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(5);

  const [pagination, setPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: 5,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });

  const userServerApi = new UserApi();

  // --- API FETCH ---
  const fetchUsers = async (pageNumber, pageSize) => {
    setIsLoading(true);
    try {
      const response = await userServerApi.getUsersWithPagination(
        pageNumber,
        pageSize,
      );

      if (response.success) {
        setUsers(response.users);

        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          console.warn("Пагинация не найдена в ответе");
        }
      } else {
        console.error("Ошибка API:", response.message);
      }
    } catch (error) {
      console.error("Системная ошибка:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(requestPage, requestPageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestPage, requestPageSize]);

  // --- HANDLERS ---

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handlePageChange = (direction) => {
    if (direction === "prev" && pagination.HasPrevious) {
      setRequestPage((prev) => prev - 1);
    } else if (direction === "next" && pagination.HasNext) {
      setRequestPage((prev) => prev + 1);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setRequestPageSize(newSize);
    setRequestPage(1);
  };

  // Блокировка / Разблокировка
  const toggleBlockUser = async (id, isBlockedCurrent) => {
    let result;
    if (isBlockedCurrent) {
      result = await userServerApi.activateUser(id);
    } else {
      result = await userServerApi.deactivateUser(id);
    }

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, isBlocked: !isBlockedCurrent } : u,
        ),
      );
      toast.success(
        isBlockedCurrent
          ? "Пользователь разблокирован"
          : "Пользователь заблокирован",
      );
    } else {
      toast.error(
        "Ошибка: " + (result.message || "Не удалось изменить статус"),
      );
    }
  };

  // --- ЛОГИКА УДАЛЕНИЯ ЧЕРЕЗ CONFIRM MODAL ---

  // 1. Открытие модального окна (вызывается кнопкой корзины)
  const openDeleteModal = (id) => {
    setConfirmModal({ isOpen: true, userId: id });
  };

  // 2. Реальное удаление (вызывается кнопкой "Удалить" в модалке)
  const executeDeleteUser = async () => {
    const id = confirmModal.userId;
    if (!id) return;

    const response = await userServerApi.deleteUser(id);

    if (response.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Пользователь успешно удален");
    } else {
      toast.error(`Ошибка удаления: ${response.message}`);
    }

    // Закрываем модалку после попытки
    setConfirmModal({ isOpen: false, userId: null });
  };

  // --- ЛОГИКА РЕГИСТРАЦИИ ---

  const handleRegisterUser = async (userData) => {
    // Вызов API регистрации (предполагаем, что он есть в userServerApi или authApi)
    // const result = await userServerApi.register(userData);
    console.log("Register data:", userData);

    setIsModalOpen(false);
    setRequestPage(1);
    fetchUsers(1, requestPageSize);
    toast.success("Пользователь создан (Демо)");
  };

  // --- HELPERS ---
  const getUserRole = (user) => (user.employee ? "Сотрудник" : "Пользователь");

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <div className="aurora-bg"></div>

      <header className="admin-header">
        <div className="brand-logo">
          <IconUsers /> AdminPanel{" "}
          <span className="admin-badge">SuperUser</span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            style={{ border: "none", background: "transparent" }}
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="admin-container">
        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div style={{ position: "relative" }}>
              <input
                className="search-input"
                placeholder="Поиск по ФИО или email..."
                value={searchTerm}
                onChange={handleSearch}
              />
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: 8,
                  color: "#94a3b8",
                }}
              >
                <IconSearch />
              </span>
            </div>
          </div>
          <div className="toolbar-right" style={{ display: "flex", gap: 15 }}>
            <button
              className="btn btn-outline"
              onClick={() => toast.info("Функция отчетов в разработке")}
            >
              <IconReport /> Отчеты
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <IconPlus /> Добавить
            </button>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="glass-table-container">
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Загрузка данных...
            </div>
          ) : (
            <>
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="col-user">Пользователь</th>
                    <th className="col-phone">Телефон</th>
                    <th className="col-date">Дата регистрации</th>
                    <th className="col-role">Роль</th>
                    <th className="col-status">Статус</th>
                    <th className="col-actions">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <img
                              src={
                                user.profilePhotoUrl ||
                                "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                              }
                              alt=""
                              className="table-avatar"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                              }}
                            />
                            <div className="user-info">
                              <span className="user-name">
                                {user.fullName || "Без имени"}
                              </span>
                              <span className="user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{user.phoneNumber || "—"}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <span
                            className={`role-badge ${user.employee ? "Manager" : "User"}`}
                          >
                            {getUserRole(user)}
                          </span>
                        </td>
                        <td>
                          <div
                            className={`status-indicator ${user.isBlocked ? "status-Blocked" : "status-Active"}`}
                          >
                            <div className="dot"></div>
                            {user.isBlocked ? "Заблокирован" : "Активен"}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className={`btn-icon-small ${user.isBlocked ? "btn-unblock" : "btn-block"}`}
                              title={
                                user.isBlocked
                                  ? "Разблокировать"
                                  : "Заблокировать"
                              }
                              onClick={() =>
                                toggleBlockUser(user.id, user.isBlocked)
                              }
                            >
                              {user.isBlocked ? <IconUnlock /> : <IconLock />}
                            </button>

                            {/* Кнопка открытия модалки удаления */}
                            <button
                              className="btn-icon-small btn-delete"
                              title="Удалить"
                              onClick={() => openDeleteModal(user.id)}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign: "center",
                          padding: 30,
                          color: "#64748b",
                        }}
                      >
                        Пользователи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION & PAGE SIZE CONTROLS */}
              <div className="pagination-container">
                <div className="rows-per-page">
                  <span>Строк на странице:</span>
                  <select
                    className="page-size-select"
                    value={requestPageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                    <option value={10}>10</option>
                  </select>
                </div>

                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    disabled={!pagination.HasPrevious || isLoading}
                    onClick={() => handlePageChange("prev")}
                  >
                    &lt;
                  </button>

                  <span className="page-info">
                    Стр. {pagination.CurrentPage} из{" "}
                    {pagination.TotalPages || 1}
                  </span>

                  <button
                    className="page-btn"
                    disabled={!pagination.HasNext || isLoading}
                    onClick={() => handlePageChange("next")}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* REGISTRATION MODAL COMPONENT */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegisterSuccess={() => {
          setIsModalOpen(false);
          setRequestPage(1);
          fetchUsers(1, requestPageSize);
        }}
      />

      {/* CONFIRM DELETE MODAL COMPONENT */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, userId: null })}
        onConfirm={executeDeleteUser}
        title="Удаление пользователя"
        message="Вы действительно хотите удалить этого пользователя? Это действие нельзя будет отменить."
      />
    </>
  );
}

export default AdminPanel;
