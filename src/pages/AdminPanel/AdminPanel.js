import React, { useState, useEffect, useMemo } from "react";
import "./AdminPanel.css";
import UserApi from "../../apiServices/usersApi";
import { toast } from "react-toastify";

import RegistrationModal from "../../components/Registration/RegistrationModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.js";
import UserFiltersModal from "../../components/UserFiltersModal/UserFiltersModal";
import Header from "../../components/Header/Header.js";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import avatar from "../../imgs/avatar.jpg";

import {
  IconReport,
  IconPlus,
  IconLock,
  IconUnlock,
  IconTrash,
} from "../../components/Icons";

import AdminReportsDownloadModal from "../../components/ReportsModal/AdminReportsDownloadModal";

function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [userFilters, setUserFilters] = useState({
    OrderBy: "CreatedAt desc",
  });

  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
  });

  const [isLoading, setIsLoading] = useState(false);

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

  const userServerApi = useMemo(() => new UserApi(), []);

  const fetchUsers = async (pageNumber, pageSize, filters = userFilters) => {
    setIsLoading(true);
    try {
      const response = await userServerApi.getUsersWithPagination(
        pageNumber,
        pageSize,
        filters,
      );

      if (response.success) {
        setUsers(response.users || []);

        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination({
            CurrentPage: pageNumber,
            TotalPages: 1,
            PageSize: pageSize,
            TotalCount: response.users?.length || 0,
            HasPrevious: pageNumber > 1,
            HasNext: false,
          });
        }
      } else {
        toast.error(response.message || "Не удалось загрузить пользователей");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при загрузке пользователей");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(requestPage, requestPageSize, userFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestPage, requestPageSize, userFilters, userServerApi]);

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

  const toggleBlockUser = async (id, isBlockedCurrent) => {
    let result;

    if (isBlockedCurrent) result = await userServerApi.activateUser(id);
    else result = await userServerApi.deactivateUser(id);

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

  const openDeleteModal = (user) => {
    if (user?.emailConfirmed) {
      toast.info("Нельзя удалить пользователя с подтверждённой почтой");
      return;
    }
    setConfirmModal({ isOpen: true, userId: user.id });
  };

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

    setConfirmModal({ isOpen: false, userId: null });
  };

  const handleRegisterUser = async () => {
    setIsModalOpen(false);
    setRequestPage(1);
    fetchUsers(1, requestPageSize, userFilters);
    toast.success("Пользователь создан");
  };

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
    } catch {
      return dateString;
    }
  };

  // Роль берём ТОЛЬКО из user.role
  const getRoleCode = (user) => {
    const raw = (user?.role ?? "").toString().trim();
    return raw ? raw.toUpperCase() : "UNKNOWN";
  };

  // Роли по-русски без скобок
  const getRoleLabelRu = (roleCode) => {
    switch (roleCode) {
      case "ADMIN":
        return "Админ";
      case "MANAGER":
        return "Менеджер";
      case "EMPLOYEE":
        return "Сотрудник";
      case "USER":
        return "Пользователь";
      default:
        return "—";
    }
  };

  const isTelegramConnected = (user) => !!user?.tgUser?.chatId;

  const activeFiltersCount = useMemo(() => {
    const f = userFilters || {};
    let c = 0;

    if (f.SecondName) c++;
    if (f.Email) c++;
    if (f.PhoneNumber) c++;

    if (f.isBlocked !== undefined && f.isBlocked !== null) c++;
    if (f.emailConfirmed !== undefined && f.emailConfirmed !== null) c++;
    if (f.hasEmployee !== undefined && f.hasEmployee !== null) c++;
    if (f.hasTgUser !== undefined && f.hasTgUser !== null) c++;

    if (f.CreatedFrom) c++;
    if (f.CreatedTo) c++;

    return c;
  }, [userFilters]);

  return (
    <div className="admin-panel-page">
      <Header />
      <div className="aurora-bg"></div>

      <div className="admin-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="toolbar-meta">
              <div className="toolbar-title">
                Зарегистрировано {pagination?.TotalCount ?? users.length}{" "}
                человек
              </div>
              <div className="toolbar-subtitle">
                Страница {pagination?.CurrentPage ?? 1} из{" "}
                {pagination?.TotalPages ?? 1}
              </div>
            </div>
          </div>

          <div className="toolbar-right" style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/admin/infastructure")}
            >
              <Building2 size={18} style={{ marginRight: "8px" }} />
              Инфраструктура
            </button>

            <button
              className="btn btn-outline"
              onClick={() => setFiltersModalOpen(true)}
              title="Фильтрация/сортировка на сервере"
            >
              Фильтры {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
            </button>

            <button
              className="btn btn-outline"
              onClick={() => setReportsModalOpen(true)}
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
                    <th className="col-tg">Telegram</th>
                    <th className="col-email-confirmed">Email</th>
                    <th className="col-status">Статус</th>
                    <th className="col-actions">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => {
                      const roleCode = getRoleCode(user);
                      const roleLabel = getRoleLabelRu(roleCode);

                      const tgConnected = isTelegramConnected(user);
                      const emailOk = !!user.emailConfirmed;

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <img
                                src={user.profilePhotoUrl || avatar}
                                alt=""
                                className="table-avatar"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = avatar;
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
                            <span className={`role-badge role-${roleCode}`}>
                              {roleLabel}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-indicator ${
                                tgConnected ? "status-Active" : "status-Pending"
                              }`}
                              title={
                                tgConnected
                                  ? `Подключен (chatId: ${user.tgUser?.chatId})`
                                  : "Не подключен"
                              }
                            >
                              <span className="dot"></span>
                              {tgConnected ? "Да" : "Нет"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-indicator ${
                                emailOk ? "status-Active" : "status-Pending"
                              }`}
                              title={emailOk ? "Подтвержден" : "Не подтвержден"}
                            >
                              <span className="dot"></span>
                              {emailOk ? "Подтв." : "Нет"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-indicator ${
                                user.isBlocked
                                  ? "status-Blocked"
                                  : "status-Active"
                              }`}
                            >
                              <span className="dot"></span>
                              {user.isBlocked ? "Заблок." : "Активен"}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className={`btn-icon-small ${
                                  user.isBlocked ? "btn-unblock" : "btn-block"
                                }`}
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

                              {!emailOk && (
                                <button
                                  className="btn-icon-small btn-delete"
                                  title="Удалить"
                                  onClick={() => openDeleteModal(user)}
                                >
                                  <IconTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
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

      {/* Фильтры таблицы пользователей */}
      <UserFiltersModal
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        initialFilters={userFilters}
        onApply={(filters) => {
          setUserFilters(filters || { OrderBy: "CreatedAt desc" });
          setRequestPage(1);
          setFiltersModalOpen(false);
        }}
      />

      {/* Отчёты администратора (по пользователям) */}
      <AdminReportsDownloadModal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        initialUserFilters={userFilters}
      />

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={handleRegisterUser}
        onRegisterSuccess={() => {
          setIsModalOpen(false);
          setRequestPage(1);
          fetchUsers(1, requestPageSize, userFilters);
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, userId: null })}
        onConfirm={executeDeleteUser}
        title="Удаление пользователя"
        message="Вы действительно хотите удалить этого пользователя? Это действие нельзя будет отменить."
      />
    </div>
  );
}

export default AdminPanel;
