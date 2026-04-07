import React, { useEffect, useMemo, useState } from "react";
import "./EmployeeProfile.css";

import UserApi from "../../apiServices/usersApi";
import RequestPhotoApi from "../../apiServices/requestPhotoApi";
import CommentsApi from "../../apiServices/commentsApi";
import EmployeeAssignedRequestsApi from "../../apiServices/employeeAssignedRequestsApi";
import EmployeeApi from "../../apiServices/employeeApi";
import BuildingApi from "../../apiServices/buildingApi";

import {
  IconPhone,
  IconMail,
  IconTelegram,
  IconCatIT,
  IconCatEquip,
  IconCatOther,
  IconSearch,
} from "../../components/Icons";

import RequestFiltersModal from "../../components/RequestFilters/RequestFiltersModal";
import RequestDetailsForManagerModal from "../../components/RequestDetailsForManager/RequestDetailsForManager";

function EmployeeProfile() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [requests, setRequests] = useState([]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [selectedReqForStatus, setSelectedReqForStatus] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const DEFAULT_ACTIVE_STATUSES = [
    "Создана",
    "Назначена",
    "В работе",
    "Приостановлена",
  ];

  const [filters, setFilters] = useState({
    minCreatedAt: "",
    maxCreatedAt: "",
    priorities: [],
    statuses: DEFAULT_ACTIVE_STATUSES,
    buildingId: "",
    floorId: "",
    locationId: "",
    sort: "CreateAt desc",
  });

  const [buildings, setBuildings] = useState([]);

  const [employeeId, setEmployeeId] = useState(
    localStorage.getItem("employeeId") || "",
  );

  const [employeeData, setEmployeeData] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentBuildingId, setCurrentBuildingId] = useState("");
  const [defaultBuildingId, setDefaultBuildingId] = useState("");

  const [hasTelegram, setHasTelegram] = useState(false);
  const [telegramId, setTelegramId] = useState(null);

  const [draftIsAvailable, setDraftIsAvailable] = useState(false);
  const [draftCurrentBuildingId, setDraftCurrentBuildingId] = useState("");
  const [draftDefaultBuildingId, setDraftDefaultBuildingId] = useState("");

  const [employeeSettingsLoading, setEmployeeSettingsLoading] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    phone: "",
    email: "",
    avatar:
      "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  });

  const userApi = useMemo(() => new UserApi(), []);
  const requestPhotoApi = useMemo(() => new RequestPhotoApi(), []);
  const commentsApi = useMemo(() => new CommentsApi(), []);
  const employeeAssignedRequestsApi = useMemo(
    () => new EmployeeAssignedRequestsApi(),
    [],
  );
  const employeeApi = useMemo(() => new EmployeeApi(), []);
  const buildingApi = useMemo(() => new BuildingApi(), []);

  const FINAL_STATUSES = ["Выполнена", "Отклонена"];
  const EMPLOYEE_STATUS_OPTIONS = [
    "Назначена",
    "В работе",
    "Приостановлена",
    "Выполнена",
    "Отклонена",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await userApi.getMyProfile();

        if (profileRes.success && profileRes.data) {
          const p = profileRes.data;
          const fullNameParts = p.fullName?.split(" ") || [];

          setUser({
            firstName: fullNameParts[1] || "",
            lastName: fullNameParts[0] || "",
            patronymic: fullNameParts[2] || "",
            phone: p.phoneNumber || "",
            email: p.email || "",
            avatar:
              p.profilePhotoUrl ||
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          });

          setHasTelegram(!!p.tgUser);
          setTelegramId(
            p.tgUser?.userName
              ? `@${p.tgUser.userName}`
              : p.tgUser?.chatId
                ? String(p.tgUser.chatId)
                : null,
          );

          const profileEmployeeId =
            p.employeeId || p.employee?.id || p.employee?.employeeId || "";

          if (profileEmployeeId) {
            const normalizedEmployeeId = String(profileEmployeeId);
            setEmployeeId(normalizedEmployeeId);
            localStorage.setItem("employeeId", normalizedEmployeeId);
          }
        }
      } catch (e) {
        console.error("Profile error:", e);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [userApi]);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) return;

      try {
        const employeeRes = await employeeApi.GetEmployeeById(employeeId);

        if (employeeRes.success && employeeRes.data) {
          const emp = employeeRes.data;

          setEmployeeData(emp);
          setIsAvailable(!!emp.isAvailable);

          const currentId =
            emp.currentBuilding?.id !== undefined &&
            emp.currentBuilding?.id !== null
              ? String(emp.currentBuilding.id)
              : "";

          const defaultId =
            emp.defaultBuilding?.id !== undefined &&
            emp.defaultBuilding?.id !== null
              ? String(emp.defaultBuilding.id)
              : "";

          setCurrentBuildingId(currentId);
          setDefaultBuildingId(defaultId);

          setDraftIsAvailable(!!emp.isAvailable);
          setDraftCurrentBuildingId(currentId);
          setDraftDefaultBuildingId(defaultId);
        }
      } catch (e) {
        console.error("Employee load error:", e);
      }
    };

    fetchEmployee();
  }, [employeeId, employeeApi]);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const res = await buildingApi.getBuildings();
        if (res.success && res.data) {
          setBuildings(res.data);
        }
      } catch (e) {
        console.error("Buildings load error:", e);
      }
    };

    loadBuildings();
  }, [buildingApi]);

  const normalizeStatusClass = (status) => {
    if (status === "Создана" || status === "Назначена") return "New";
    if (status === "В работе" || status === "Приостановлена") return "Work";
    if (status === "Выполнена" || status === "Отклонена") return "Done";
    return "New";
  };

  const trimDescription = (text, maxLength = 20) => {
    if (!text) return "Без описания";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const mapRequest = (item) => {
    const req = item?.request;
    const loc = req?.location;

    return {
      id: req?.number || "—",
      realId: req?.id || item?.id,
      assignmentId: item?.id,
      category: req?.typeOfProblem?.title || "Заявка",
      title: trimDescription(req?.description, 20),
      date: req?.createAt
        ? new Date(req.createAt).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Дата не указана",
      priority: req?.priority || "Не указан",
      status: normalizeStatusClass(req?.status),
      statusRu: req?.status || "Не указан",
      building: loc?.floor?.building?.name || "—",
      floor:
        loc?.floor?.floorNumber !== undefined
          ? `Этаж ${loc.floor.floorNumber}`
          : "—",
      spot: loc?.name || "—",
      desc: req?.description || "Без описания",
      images: [],
      comments: [],
    };
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);

    try {
      const res = await employeeAssignedRequestsApi.GetMyAssignedRequests(
        currentPage,
        itemsPerPage,
        filters,
      );

      if (res.success && res.data) {
        const rows = Array.isArray(res.data) ? res.data : [];
        const mapped = rows.map(mapRequest);

        setRequests(mapped);
        setTotalPages(res.pagination?.TotalPages || 1);
        setTotalCount(res.pagination?.TotalCount || mapped.length);
      } else {
        setRequests([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (e) {
      console.error("Requests error:", e);
      setRequests([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const startEditSettings = () => {
    setDraftIsAvailable(isAvailable);
    setDraftCurrentBuildingId(currentBuildingId);
    setDraftDefaultBuildingId(defaultBuildingId);
    setIsEditingSettings(true);
  };

  const cancelEditSettings = () => {
    setDraftIsAvailable(isAvailable);
    setDraftCurrentBuildingId(currentBuildingId);
    setDraftDefaultBuildingId(defaultBuildingId);
    setIsEditingSettings(false);
  };

  const handleSaveSettings = async () => {
    if (!employeeId) {
      alert("employeeId не найден");
      return;
    }

    setEmployeeSettingsLoading(true);

    try {
      if (draftIsAvailable) {
        if (!draftCurrentBuildingId) {
          alert(
            "Чтобы отметить сотрудника как доступного, выберите текущее здание",
          );
          return;
        }

        if (!draftDefaultBuildingId) {
          alert(
            "Чтобы отметить сотрудника как доступного, выберите здание по умолчанию",
          );
          return;
        }
      }

      if (draftIsAvailable !== isAvailable) {
        const availabilityRes = await employeeApi.UpdateEmployeeAvailability(
          employeeId,
          draftIsAvailable,
        );

        if (!availabilityRes.success) {
          alert(availabilityRes.message || "Не удалось обновить доступность");
          return;
        }
      }

      if (draftCurrentBuildingId !== currentBuildingId) {
        const currentBuildingRes = await employeeApi.UpdateCurrentBuilding(
          employeeId,
          draftCurrentBuildingId,
        );

        if (!currentBuildingRes.success) {
          alert(
            currentBuildingRes.message || "Не удалось обновить текущее здание",
          );
          return;
        }
      }

      if (draftDefaultBuildingId !== defaultBuildingId) {
        const defaultBuildingRes = await employeeApi.UpdateDefaultBuilding(
          employeeId,
          draftDefaultBuildingId,
        );

        if (!defaultBuildingRes.success) {
          alert(
            defaultBuildingRes.message ||
              "Не удалось обновить здание по умолчанию",
          );
          return;
        }
      }

      setIsAvailable(draftIsAvailable);
      setCurrentBuildingId(draftCurrentBuildingId);
      setDefaultBuildingId(draftDefaultBuildingId);
      setIsEditingSettings(false);

      const employeeRes = await employeeApi.GetEmployeeById(employeeId);
      if (employeeRes.success && employeeRes.data) {
        const emp = employeeRes.data;

        setEmployeeData(emp);
        setIsAvailable(!!emp.isAvailable);

        const currentId =
          emp.currentBuilding?.id !== undefined &&
          emp.currentBuilding?.id !== null
            ? String(emp.currentBuilding.id)
            : "";

        const defaultId =
          emp.defaultBuilding?.id !== undefined &&
          emp.defaultBuilding?.id !== null
            ? String(emp.defaultBuilding.id)
            : "";

        setCurrentBuildingId(currentId);
        setDefaultBuildingId(defaultId);

        setDraftIsAvailable(!!emp.isAvailable);
        setDraftCurrentBuildingId(currentId);
        setDraftDefaultBuildingId(defaultId);
      }
    } catch (e) {
      console.error("Employee settings update error:", e);
      alert("Ошибка при сохранении настроек сотрудника");
    } finally {
      setEmployeeSettingsLoading(false);
    }
  };

  const getCategoryDetails = (cat) => {
    if (
      cat &&
      (cat.includes("IT") ||
        cat.includes("Софт") ||
        cat.includes("Компьютер") ||
        cat.includes("Сеть"))
    ) {
      return { icon: <IconCatIT />, styleClass: "icon-cat-IT" };
    }

    if (
      cat === "Оборудование" ||
      cat?.includes("техника") ||
      cat?.includes("Техника")
    ) {
      return { icon: <IconCatEquip />, styleClass: "icon-cat-Equipment" };
    }

    return { icon: <IconCatOther />, styleClass: "icon-cat-Other" };
  };

  const openDetails = async (req) => {
    const baseMapped = {
      id: req.id,
      number: req.id,
      category: req.category,
      date: req.date,
      priority: req.priority,
      status: req.statusRu,
      building: req.building,
      floor: req.floor,
      spot: req.spot,
      desc: req.desc,
      images: [],
      comments: [],
      realId: req.realId,
    };

    setSelectedRequest(baseMapped);
    setIsDetailsOpen(true);
    setPhotoLoading(true);

    try {
      const [photosRes, commentsRes] = await Promise.all([
        requestPhotoApi.GethotosForRequest(req.realId),
        commentsApi.GetCommentsForRequest(req.realId),
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

      setSelectedRequest((prev) => ({
        ...prev,
        images: newPhotos,
        comments: newComments,
      }));
    } catch (err) {
      console.error("Details error (employee):", err);
    } finally {
      setPhotoLoading(false);
    }
  };

  const getAllowedStatuses = (currentStatus) => {
    switch (currentStatus) {
      case "Создана":
        return [
          "Назначена",
          "В работе",
          "Приостановлена",
          "Выполнена",
          "Отклонена",
        ];
      case "Назначена":
        return ["В работе", "Приостановлена", "Выполнена", "Отклонена"];
      case "В работе":
        return ["Приостановлена", "Выполнена", "Отклонена"];
      case "Приостановлена":
        return ["В работе", "Выполнена", "Отклонена"];
      case "Выполнена":
      case "Отклонена":
        return [];
      default:
        return EMPLOYEE_STATUS_OPTIONS;
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedReqForStatus) return;

    if (FINAL_STATUSES.includes(newStatus)) {
      setPendingStatus(newStatus);
      setActiveModal("confirmFinalStatus");
      return;
    }

    updateStatus(newStatus);
  };

  const updateStatus = async (newStatus) => {
    if (!selectedReqForStatus) return;

    try {
      const res = await employeeAssignedRequestsApi.UpdateRequestStatus(
        selectedReqForStatus.realId,
        newStatus,
      );

      if (res.success) {
        if (selectedRequest?.realId === selectedReqForStatus.realId) {
          setSelectedRequest((prev) => ({
            ...prev,
            status: newStatus,
          }));
        }

        setSelectedReqForStatus((prev) =>
          prev
            ? {
                ...prev,
                status: normalizeStatusClass(newStatus),
                statusRu: newStatus,
              }
            : null,
        );

        setPendingStatus(null);
        setActiveModal(null);

        await fetchRequests();
      } else {
        alert(res.message || "Не удалось изменить статус");
      }
    } catch (e) {
      console.error("Update status error:", e);
      alert("Ошибка при изменении статуса");
    }
  };

  const confirmFinalStatus = async () => {
    if (!pendingStatus) return;
    await updateStatus(pendingStatus);
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const renderRequestCard = (req) => {
    const catDetails = getCategoryDetails(req.category);

    return (
      <div key={req.realId} className="request-card-grid">
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
            <span>{req.priority}</span>
          </div>
        </div>

        <div className="req-actions-col">
          <span className={`status-badge-pill ${req.status}`}>
            {req.statusRu}
          </span>

          <button
            className="btn-details-outlined"
            onClick={() => openDetails(req)}
          >
            Подробнее
          </button>

          {!FINAL_STATUSES.includes(req.statusRu) && (
            <button
              className="btn-status-action"
              onClick={() => {
                setSelectedReqForStatus(req);
                setActiveModal("changeStatus");
              }}
            >
              Сменить статус
            </button>
          )}
        </div>
      </div>
    );
  };

  const allowedStatuses = selectedReqForStatus
    ? getAllowedStatuses(selectedReqForStatus.statusRu)
    : [];

  if (profileLoading) {
    return (
      <div className="employee-profile-page">
        <div className="employee-page-loading">Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className="employee-profile-page">
      <div className="aurora-bg"></div>

      <header className="app-header">
        <div className="brand-logo">ServiceDesk Employee</div>
        <div className="header-actions">
          <button className="btn btn-header">Выйти</button>
        </div>
      </header>

      <div className="layout-container">
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
            {hasTelegram ? (
              <div className="tg-badge">
                <IconTelegram /> {telegramId}
              </div>
            ) : (
              <div className="tg-placeholder">
                <IconTelegram /> Telegram не привязан
              </div>
            )}
          </div>

          <div className="employee-settings-card">
            <div className="employee-settings-header">
              {!isEditingSettings ? (
                <button
                  className="employee-settings-btn"
                  onClick={startEditSettings}
                >
                  Изменить
                </button>
              ) : (
                <div className="employee-settings-actions">
                  <button
                    className="employee-settings-btn ghost"
                    onClick={cancelEditSettings}
                    disabled={employeeSettingsLoading}
                  >
                    Отмена
                  </button>
                  <button
                    className="employee-settings-btn"
                    onClick={handleSaveSettings}
                    disabled={employeeSettingsLoading}
                  >
                    {employeeSettingsLoading ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>
              )}
            </div>

            <div className="employee-setting-block">
              <label className="employee-toggle-row">
                <span className="employee-setting-label">
                  Доступен для назначения
                </span>

                <span className="custom-checkbox-wrap">
                  <input
                    type="checkbox"
                    className="custom-checkbox-input"
                    checked={draftIsAvailable}
                    disabled={!isEditingSettings || employeeSettingsLoading}
                    onChange={(e) => setDraftIsAvailable(e.target.checked)}
                  />
                  <span className="custom-checkbox-ui"></span>
                </span>
              </label>
            </div>

            <div className="employee-setting-block">
              <label className="employee-setting-label">Текущее здание</label>
              <select
                className="employee-setting-select"
                value={draftCurrentBuildingId}
                disabled={!isEditingSettings || employeeSettingsLoading}
                onChange={(e) => setDraftCurrentBuildingId(e.target.value)}
              >
                <option value="" disabled>
                  Выберите здание
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="employee-setting-block">
              <label className="employee-setting-label">
                Здание по умолчанию
              </label>
              <select
                className="employee-setting-select"
                value={draftDefaultBuildingId}
                disabled={!isEditingSettings || employeeSettingsLoading}
                onChange={(e) => setDraftDefaultBuildingId(e.target.value)}
              >
                <option value="" disabled>
                  Выберите здание
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <main className="glass-panel">
          <div className="requests-toolbar">
            <h3>Мои заявки ({totalCount})</h3>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                className="btn-details-outlined"
                onClick={() => setIsFilterOpen(true)}
              >
                <IconSearch />
                Фильтры
              </button>
            </div>
          </div>

          <div className="requests-container">
            {requestsLoading ? (
              <div className="empty-state">Загрузка заявок...</div>
            ) : requests.length > 0 ? (
              requests.map((req) => renderRequestCard(req))
            ) : (
              <div className="empty-state">Заявки не найдены</div>
            )}
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1 || requestsLoading}
              onClick={() => handlePageChange("prev")}
            >
              &lt;
            </button>

            <span className="page-indicator">
              Стр. {currentPage} из {totalPages}
            </span>

            <button
              className="page-btn"
              disabled={currentPage === totalPages || requestsLoading}
              onClick={() => handlePageChange("next")}
            >
              &gt;
            </button>
          </div>
        </main>
      </div>

      <RequestFiltersModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      <RequestDetailsForManagerModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        photoLoading={photoLoading}
      />

      {activeModal === "changeStatus" && selectedReqForStatus && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-card small-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Изменение статуса</h3>
            <p>Выберите новый статус для заявки #{selectedReqForStatus.id}</p>

            <div className="status-buttons-column">
              {allowedStatuses.length > 0 ? (
                allowedStatuses.map((status) => (
                  <button
                    key={status}
                    className={
                      status === "Выполнена" || status === "Отклонена"
                        ? "btn btn-danger"
                        : "btn btn-primary"
                    }
                    onClick={() => handleStatusChange(status)}
                  >
                    {status}
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  Для этой заявки недоступно изменение статуса
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === "confirmFinalStatus" &&
        selectedReqForStatus &&
        pendingStatus && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div
              className="modal-card small-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Подтверждение действия</h3>
              <p>
                Вы действительно хотите перевести заявку #
                {selectedReqForStatus.id} в статус «{pendingStatus}»?
              </p>

              <p className="warning-text">
                Это действие нельзя будет отменить.
              </p>

              <div className="confirm-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setActiveModal("changeStatus");
                    setPendingStatus(null);
                  }}
                >
                  Отмена
                </button>

                <button className="btn btn-danger" onClick={confirmFinalStatus}>
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default EmployeeProfile;
