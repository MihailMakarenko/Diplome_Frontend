import React, { useState, useEffect, useRef } from "react";
import "./UserProfile.css";
import UserApi from "../../apiServices/usersApi";
import RequestApi from "../../apiServices/requestForUserApi";
import RequestPhotoApi from "../../apiServices/requestPhotoApi";
import CommentsApi from "../../apiServices/commentsApi";

import RequestDetailsModal from "../../components/RequestDetailsModal/RequestDetailsModal";
import CreateRequestModal from "../../components/CreateRequestModal/CreateRequestModal";

import {
  IconPhone,
  IconMail,
  IconEdit,
  IconTelegram,
  IconPlus,
  IconMessage,
  IconCatIT,
  IconCatEquip,
  IconCatOther,
} from "../../components/Icons";

function UserProfile() {
  // --- STATE ---
  const [activeModal, setActiveModal] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [tempComment, setTempComment] = useState("");
  const [tempTgId, setTempTgId] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Pagination & Sort
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("dateDesc"); // Передаем на сервер
  const itemsPerPage = 4;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    phone: "",
    email: "",
    telegramId: null,
    avatar:
      "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  });

  const [requests, setRequests] = useState([]);

  // API Instances
  const userServerApi = new UserApi();
  const requestServerApi = new RequestApi();
  const requestPhotoServerApi = new RequestPhotoApi();
  const commentsServerApi = new CommentsApi();

  // --- 1. FETCH PROFILE (ONCE) ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await userServerApi.getMyProfile();
        if (profileRes.success && profileRes.data) {
          const p = profileRes.data;
          setUser({
            firstName: p.fullName?.split(" ")[1] || "",
            lastName: p.fullName?.split(" ")[0] || "",
            patronymic: p.fullName?.split(" ")[2] || "",
            phone: p.phoneNumber || "",
            email: p.email || "",
            telegramId: p.telegramId || null,
            avatar:
              p.profilePhotoUrl ||
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          });
        }
      } catch (e) {
        console.error("Profile error:", e);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // --- 2. FETCH REQUESTS (ON PAGE/SORT CHANGE) ---
  const fetchRequests = async () => {
    setIsRequestsLoading(true);
    try {
      // Передаем параметры пагинации и сортировки на сервер
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
          if (loc?.floor?.floorNumber !== undefined)
            parts.push(`${loc.floor.floorNumber} этаж`);
          if (loc?.name) parts.push(loc.name);
          const locationStr =
            parts.length > 0 ? parts.join(", ") : "Не указано";

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
            status:
              req.status === "Создана"
                ? "New"
                : req.status === "В работе"
                  ? "Work"
                  : req.status === "Завершена"
                    ? "Done"
                    : "New",
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
          // Fallback если сервер не вернул пагинацию (показываем все что есть)
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

  // --- LOGIC ---
  const getCategoryDetails = (cat) => {
    if (cat && (cat.includes("IT") || cat.includes("Софт")))
      return { icon: <IconCatIT />, styleClass: "icon-cat-IT" };
    if (cat === "Оборудование")
      return { icon: <IconCatEquip />, styleClass: "icon-cat-Equipment" };
    return { icon: <IconCatOther />, styleClass: "icon-cat-Other" };
  };

  // --- HANDLERS ---
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
          text: c.text || c.content, // Поддержка разных полей
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
      // await requestApi.DeleteRequest(selectedReq.realId); // API CALL
      setRequests((prev) => prev.filter((r) => r.id !== selectedReq.id));
      setActiveModal(null);
      setSelectedReq(null);
    }
  };

  // Заглушки для профиля
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setActiveModal(null);
  };
  const handleAddTelegram = () => {
    setActiveModal(null);
  };
  const handleDeleteTelegram = () => {
    if (window.confirm("Отвязать?")) setUser({ ...user, telegramId: null });
  };

  if (isLoadingProfile)
    return (
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
    );

  return (
    <>
      <div className="aurora-bg"></div>
      <header className="app-header">
        <div className="brand-logo">
          <IconPlus /> ServiceDesk
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setActiveModal("create")}
          >
            Создать заявку
          </button>
          <button className="btn btn-header">Выйти</button>
        </div>
      </header>

      <div className="layout-container">
        {/* PROFILE */}
        <aside className="glass-panel profile-panel">
          <img
            src={user.avatar}
            alt="User"
            className="avatar-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
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
              </div>{" "}
              {user.phone}
            </div>
            <div className="contact-row">
              <div className="icon-box">
                <IconMail />
              </div>{" "}
              {user.email}
            </div>
          </div>
          <div className="telegram-section">
            {user.telegramId ? (
              <div className="tg-badge">
                <span>TG: {user.telegramId}</span>
                <button className="btn-tg-del" onClick={handleDeleteTelegram}>
                  &times;
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

        {/* REQUESTS LIST */}
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
              <option value="dateDesc">Сначала новые</option>
              <option value="dateAsc">Сначала старые</option>
              <option value="status">По статусу</option>
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
                            className={`priority-dot p-${req.priority === "Высокий" ? "High" : req.priority === "Средний" ? "Medium" : "Low"}`}
                          ></span>
                          {req.priority}
                        </span>
                      </div>
                    </div>
                    <div className="req-actions-col">
                      <span className={`status-badge-pill ${req.status}`}>
                        {req.status}
                      </span>
                      <button
                        className="btn-details-outlined"
                        onClick={() => handleViewDetails(req)}
                      >
                        Подробнее
                      </button>
                      {req.status !== "Done" && (
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

          {/* Pagination */}
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

      {/* ===== MODALS ===== */}
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

      {/* Edit Profile & Telegram (Simple Forms) */}
      {activeModal === "editProfile" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Редактирование</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-grid">
                <input
                  name="lastName"
                  className="input-glass"
                  defaultValue={user.lastName}
                />
                <input
                  name="firstName"
                  className="input-glass"
                  defaultValue={user.firstName}
                />
              </div>
              <input
                name="email"
                className="input-glass"
                defaultValue={user.email}
                style={{ marginBottom: 15 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                Сохранить
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
            <h3>Telegram ID</h3>
            <input
              className="input-glass"
              placeholder="ID"
              value={tempTgId}
              onChange={(e) => setTempTgId(e.target.value)}
              style={{ marginBottom: 15 }}
            />
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleAddTelegram}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfile;
