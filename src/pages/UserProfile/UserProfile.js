import React, { useState, useEffect, useRef, useMemo } from "react";
import "./UserProfile.css";
import UserApi from "../../apiServices/usersApi";
import RequestApi from "../../apiServices/requestForUserApi";
import RequestPhotoApi from "../../apiServices/requestPhotoApi";
import CommentsApi from "../../apiServices/commentsApi";
import UserTelegramApi from "../../apiServices/userTelegramApi";

import RequestDetailsModal from "../../components/RequestDetailsModal/RequestDetailsModal";
import CreateRequestModal from "../../components/CreateRequestModal/CreateRequestModal";
import AppFooter from "../../components/AppFooter/AppFooter";
import Header from "../../components/Header/Header";
import avatar from "../../imgs/avatar.jpg";

import {
  IconPhone,
  IconMail,
  IconEdit,
  IconTelegram,
  IconMessage,
  IconCatIT,
  IconCatEquip,
  IconCatOther,
} from "../../components/Icons";

function UserProfile() {
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    phone: "",
  });

  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [tempComment, setTempComment] = useState("");
  const [tempTgId, setTempTgId] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("createAt desc");
  const itemsPerPage = 4;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [user, setUser] = useState({
    id: "",
    firstName: "",
    lastName: "",
    patronymic: "",
    phone: "",
    email: "",
    telegramId: null,
    tgUser: null,
    avatar: avatar,
  });

  const [requests, setRequests] = useState([]);

  const userServerApi = useMemo(() => new UserApi(), []);
  const requestServerApi = useMemo(() => new RequestApi(), []);
  const requestPhotoServerApi = useMemo(() => new RequestPhotoApi(), []);
  const commentsServerApi = useMemo(() => new CommentsApi(), []);
  const userTelegramApi = useMemo(() => new UserTelegramApi(), []);

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profileRes = await userServerApi.getMyProfile();

      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        const fullNameParts = p.fullName ? p.fullName.split(" ") : [];

        setUser({
          id: p.id || "",
          firstName: fullNameParts[1] || "",
          lastName: fullNameParts[0] || "",
          patronymic: fullNameParts[2] || "",
          phone: p.phoneNumber || "",
          email: p.email || "",
          telegramId: p.tgUser?.chatId || null,
          tgUser: p.tgUser || null,
          avatar: p.profilePhotoUrl || avatar,
        });

        setEditData({
          firstName: fullNameParts[1] || "",
          lastName: fullNameParts[0] || "",
          patronymic: fullNameParts[2] || "",
          phone: p.phoneNumber || "",
        });
      }
    } catch (e) {
      console.error("Profile error:", e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    setIsRequestsLoading(true);
    try {
      const requestsRes = await requestServerApi.GetRequestsForUser(
        currentPage,
        itemsPerPage,
        sortOption,
      );

      if (requestsRes.success && requestsRes.data) {
        const mappedRequests = requestsRes.data.map((req) => {
          const loc = req.location;
          const parts = [];

          if (loc?.floor?.building?.name) parts.push(loc.floor.building.name);
          if (loc?.floor?.floorNumber !== undefined) {
            parts.push(`${loc.floor.floorNumber} этаж`);
          }
          if (loc?.name) parts.push(loc.name);

          const locationStr =
            parts.length > 0 ? parts.join(", ") : "Не указано";

          // ✅ отображаем статус как пришёл с сервера
          const statusLabel = req.status || "Не указан";

          // ✅ оставляем классы для существующих стилей
          const statusClass =
            statusLabel === "Создана"
              ? "New"
              : statusLabel === "В работе"
                ? "Work"
                : statusLabel === "Завершена"
                  ? "Done"
                  : "New";

          return {
            id: req.number,
            realId: req.id,
            category: req.typeOfProblem?.title || "Заявка",
            title: req.description
              ? req.description.length > 40
                ? req.description.substring(0, 40) + "..."
                : req.description
              : "Без описания",
            date:
              new Date(req.createAt).toLocaleDateString("ru-RU") +
              " " +
              new Date(req.createAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              }),

            // ✅ важно: статус-текст и статус-класс раздельно
            status: statusLabel,
            statusClass: statusClass,

            priority: req.priority,
            building: loc?.floor?.building?.name || "—",
            floor:
              loc?.floor?.floorNumber !== undefined
                ? `${loc.floor.floorNumber} этаж`
                : "—",
            spot: loc?.name || "—",
            location: locationStr,
            desc: req.description,
            images: [],
            comments: [],
          };
        });

        setRequests(mappedRequests);

        if (requestsRes.pagination) {
          setTotalPages(requestsRes.pagination.TotalPages);
          setTotalCount(requestsRes.pagination.TotalCount);
        } else {
          setTotalCount(mappedRequests.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error("Requests error:", error);
    } finally {
      setIsRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortOption]);

  const getCategoryDetails = (cat) => {
    if (cat && (cat.includes("IT") || cat.includes("Софт"))) {
      return { icon: <IconCatIT />, styleClass: "icon-cat-IT" };
    }
    if (cat === "Оборудование") {
      return { icon: <IconCatEquip />, styleClass: "icon-cat-Equipment" };
    }
    return { icon: <IconCatOther />, styleClass: "icon-cat-Other" };
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleCreateSuccess = () => {
    setCurrentPage(1);
    fetchRequests();
  };

  const handleViewDetails = async (req) => {
    setSelectedReq(req);
    setActiveModal("details");
    setPhotoLoading(true);

    try {
      const [photosRes, commentsRes] = await Promise.all([
        requestPhotoServerApi.GethotosForRequest(req.realId),
        commentsServerApi.GetCommentsForRequest(req.realId),
      ]);

      let newPhotos = [];
      if (photosRes.success && photosRes.data) {
        newPhotos = photosRes.data.map((item) => item.photoUrl);
      }

      let newComments = [];
      if (commentsRes.success && commentsRes.data) {
        newComments = commentsRes.data.map((c) => ({
          text: c.text || c.content,
        }));
      }

      setSelectedReq((prev) => ({
        ...prev,
        images: newPhotos,
        comments: newComments,
      }));
    } catch (error) {
      console.error("Details error:", error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (tempComment.trim() && selectedReq) {
      try {
        const result = await commentsServerApi.AddCommentForRequest(
          selectedReq.realId,
          tempComment,
        );

        if (result.success) {
          const newComment = { text: tempComment };

          setSelectedReq((prev) => ({
            ...prev,
            comments: [...prev.comments, newComment],
          }));

          setTempComment("");
          if (activeModal === "addComment") setActiveModal(null);
        } else {
          alert("Ошибка: " + result.message);
        }
      } catch (e) {
        alert("Не удалось отправить комментарий");
      }
    }
  };

  const handleAddPhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoLoading(true);
    try {
      const response = await requestPhotoServerApi.UploadPhotosForRequest(
        selectedReq.realId,
        files,
      );

      if (response.success) {
        alert("Загружено!");
        const refreshRes = await requestPhotoServerApi.GethotosForRequest(
          selectedReq.realId,
        );

        if (refreshRes.success && refreshRes.data) {
          const photos = refreshRes.data.map((item) => item.photoUrl);
          setSelectedReq((prev) => ({ ...prev, images: photos }));
        }
      } else {
        alert("Ошибка: " + response.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteRequest = async () => {
    if (window.confirm("Удалить?")) {
      setRequests((prev) => prev.filter((r) => r.id !== selectedReq.id));
      setActiveModal(null);
      setSelectedReq(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const errors = {};

    if (!editData.lastName || editData.lastName.trim().length < 2) {
      errors.lastName = "Фамилия минимум 2 символа";
    }

    if (!editData.firstName || editData.firstName.trim().length < 2) {
      errors.firstName = "Имя минимум 2 символа";
    }

    if (!editData.patronymic || editData.patronymic.trim().length < 2) {
      errors.patronymic = "Отчество минимум 2 символа";
    }

    if (!editData.phone || editData.phone.trim().length < 7) {
      errors.phone = "Некорректный номер телефона";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditErrors({});
    setEditLoading(true);

    try {
      const result = await userServerApi.updateUser(user.id, {
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        secondName: editData.patronymic.trim(),
        phoneNumber: editData.phone.trim(),
      });

      if (result.success) {
        setActiveModal(null);
        await fetchProfile();
      } else {
        const msg = result.message;

        if (
          msg?.includes?.("entity changes") ||
          msg?.includes?.("saving") ||
          msg?.includes?.("23505")
        ) {
          setEditErrors({
            phone: "Этот номер телефона уже занят другим пользователем",
          });
        } else {
          setEditErrors({
            server: msg,
          });
        }
      }
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Ошибка сервера";

      setEditErrors({
        server: serverMessage,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddTelegram = async () => {
    if (!tempTgId.trim()) {
      alert("Введите chatId");
      return;
    }

    setTelegramLoading(true);
    try {
      const result = await userTelegramApi.connectTelegram(tempTgId.trim());

      if (result.success) {
        setTempTgId("");
        setActiveModal(null);
        await fetchProfile();
      } else {
        alert("Ошибка: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Не удалось подключить Telegram");
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDeleteTelegram = async () => {
    if (!user.tgUser?.chatId) return;

    if (window.confirm("Отвязать Telegram?")) {
      setTelegramLoading(true);
      try {
        const result = await userTelegramApi.deleteTelegramConnection(
          user.tgUser.chatId,
        );

        if (result.success) {
          await fetchProfile();
        } else {
          alert("Ошибка: " + result.message);
        }
      } catch (e) {
        console.error(e);
        alert("Не удалось удалить Telegram");
      } finally {
        setTelegramLoading(false);
      }
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="user-profile-page">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
        >
          Загрузка профиля...
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="aurora-bg"></div>

      <Header
        showCreateButton={true}
        onCreateClick={() => setActiveModal("create")}
      />

      <div className="layout-container">
        <aside className="glass-panel profile-panel">
          <img
            src={user.avatar}
            alt="User"
            className="avatar-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = avatar;
            }}
          />

          <h2 className="user-name">
            {user.lastName} {user.firstName}
          </h2>

          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            {user.patronymic}
          </div>

          <div className="contact-list">
            <div className="contact-row">
              <div className="icon-box">
                <IconPhone />
              </div>
              {user.phone}
            </div>

            <div className="contact-row">
              <div className="icon-box">
                <IconMail />
              </div>
              {user.email}
            </div>
          </div>

          <div className="telegram-section">
            {user.tgUser ? (
              <div
                className="tg-badge"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <IconTelegram />
                  Telegram подключен
                </span>

                <button
                  className="btn-tg-del"
                  onClick={handleDeleteTelegram}
                  disabled={telegramLoading}
                  title="Удалить Telegram"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "18px",
                  }}
                >
                  🗑
                </button>
              </div>
            ) : (
              <button
                className="btn-tg-add"
                onClick={() => setActiveModal("telegram")}
              >
                <IconTelegram /> Добавить Telegram
              </button>
            )}
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setActiveModal("editProfile")}
          >
            <IconEdit /> Редактировать профиль
          </button>
        </aside>

        <main className="glass-panel">
          <div className="requests-toolbar">
            <h3>Мои заявки ({totalCount})</h3>

            <select
              className="sort-select"
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="createAt desc">Сначала новые</option>
              <option value="createAt asc">Сначала старые</option>
            </select>
          </div>

          <div className="requests-container">
            {isRequestsLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#64748b",
                }}
              >
                Загрузка заявок...
              </div>
            ) : requests.length > 0 ? (
              requests.map((req) => {
                const catDetails = getCategoryDetails(req.category);

                return (
                  <div key={req.id} className="request-card-grid">
                    <div className={`req-icon-box ${catDetails.styleClass}`}>
                      {catDetails.icon}
                    </div>

                    <div className="req-content">
                      <div className="req-header-row">
                        <span className="req-id">#{req.id}</span>
                        <span>{req.date}</span>
                      </div>

                      <h4 className="req-title">{req.title}</h4>

                      <div className="req-footer-row">
                        <span>{req.category}</span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <span
                            className={`priority-dot p-${
                              req.priority === "Высокий"
                                ? "High"
                                : req.priority === "Средний"
                                  ? "Medium"
                                  : "Low"
                            }`}
                          ></span>
                          {req.priority}
                        </span>
                      </div>
                    </div>

                    <div className="req-actions-col">
                      {/* ✅ класс для стилей */}
                      <span className={`status-badge-pill ${req.statusClass}`}>
                        {/* ✅ текст статуса как от сервера */}
                        {req.status}
                      </span>

                      <button
                        className="btn-details-outlined"
                        onClick={() => handleViewDetails(req)}
                      >
                        Подробнее
                      </button>

                      {/* ✅ проверка по statusClass, чтобы не сломалось */}
                      {req.statusClass !== "Done" && (
                        <button
                          className="btn-write-text"
                          onClick={() => {
                            setSelectedReq(req);
                            setActiveModal("addComment");
                          }}
                        >
                          <IconMessage /> Написать
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#64748b",
                }}
              >
                Заявок пока нет
              </div>
            )}
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1 || isRequestsLoading}
              onClick={() => handlePageChange("prev")}
            >
              &lt;
            </button>

            <span
              style={{
                fontSize: "0.9rem",
                color: "#64748b",
                alignSelf: "center",
                margin: "0 10px",
              }}
            >
              Стр. {currentPage} из {totalPages}
            </span>

            <button
              className="page-btn"
              disabled={currentPage === totalPages || isRequestsLoading}
              onClick={() => handlePageChange("next")}
            >
              &gt;
            </button>
          </div>
        </main>
      </div>

      <CreateRequestModal
        isOpen={activeModal === "create"}
        onClose={() => setActiveModal(null)}
        onSuccess={handleCreateSuccess}
      />

      <RequestDetailsModal
        isOpen={activeModal === "details"}
        onClose={() => {
          setActiveModal(null);
          setSelectedReq(null);
        }}
        request={selectedReq}
        tempComment={tempComment}
        onCommentChange={setTempComment}
        onSendComment={handleAddComment}
        onDeleteRequest={handleDeleteRequest}
        onAddPhotoClick={handleAddPhotoClick}
        onFileChange={handleFileChange}
        photoLoading={photoLoading}
        fileInputRef={fileInputRef}
      />

      {activeModal === "addComment" && selectedReq && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Добавить сообщение</h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
              К заявке #{selectedReq.id}
            </p>

            <textarea
              className="input-glass"
              rows="3"
              placeholder="Текст..."
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              style={{ marginBottom: 15 }}
            ></textarea>

            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleAddComment}
            >
              Отправить
            </button>
          </div>
        </div>
      )}

      {activeModal === "editProfile" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Редактирование профиля</h3>

            {editErrors.server && (
              <div
                style={{
                  color: "#ef4444",
                  marginBottom: 15,
                  textAlign: "center",
                }}
              >
                {editErrors.server}
              </div>
            )}

            <form
              onSubmit={handleUpdateProfile}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div className="form-group-labeled">
                <label
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                    display: "block",
                    color: "#64748b",
                  }}
                >
                  Фамилия
                </label>
                <input
                  className="input-glass"
                  placeholder="Введите фамилию"
                  value={editData.lastName}
                  onChange={(e) =>
                    setEditData({ ...editData, lastName: e.target.value })
                  }
                />
                {editErrors.lastName && (
                  <div style={{ color: "red", fontSize: 11, marginTop: "4px" }}>
                    {editErrors.lastName}
                  </div>
                )}
              </div>

              <div className="form-group-labeled">
                <label
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                    display: "block",
                    color: "#64748b",
                  }}
                >
                  Имя
                </label>
                <input
                  className="input-glass"
                  placeholder="Введите имя"
                  value={editData.firstName}
                  onChange={(e) =>
                    setEditData({ ...editData, firstName: e.target.value })
                  }
                />
                {editErrors.firstName && (
                  <div style={{ color: "red", fontSize: 11, marginTop: "4px" }}>
                    {editErrors.firstName}
                  </div>
                )}
              </div>

              <div className="form-group-labeled">
                <label
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                    display: "block",
                    color: "#64748b",
                  }}
                >
                  Отчество
                </label>
                <input
                  className="input-glass"
                  placeholder="Введите отчество"
                  value={editData.patronymic}
                  onChange={(e) =>
                    setEditData({ ...editData, patronymic: e.target.value })
                  }
                />
                {editErrors.patronymic && (
                  <div style={{ color: "red", fontSize: 11, marginTop: "4px" }}>
                    {editErrors.patronymic}
                  </div>
                )}
              </div>

              <div className="form-group-labeled">
                <label
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "5px",
                    display: "block",
                    color: "#64748b",
                  }}
                >
                  Номер телефона
                </label>
                <input
                  className="input-glass"
                  placeholder="+375XXXXXXXXX"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                />
                {editErrors.phone && (
                  <div style={{ color: "red", fontSize: 11, marginTop: "4px" }}>
                    {editErrors.phone}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 10 }}
                disabled={editLoading}
              >
                {editLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === "telegram" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Подключить Telegram</h3>

            <input
              className="input-glass"
              placeholder="Введите chatId"
              value={tempTgId}
              onChange={(e) => setTempTgId(e.target.value)}
              style={{ marginBottom: 15 }}
            />

            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleAddTelegram}
              disabled={telegramLoading}
            >
              {telegramLoading ? "Подключение..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}

export default UserProfile;
