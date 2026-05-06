import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import RequestFiltersModal from "../../components/RequestFilters/RequestFiltersModal";
import RequestPhotoApi from "../../apiServices/requestPhotoApi";
import CommentsApi from "../../apiServices/commentsApi";
import RequestDetailsForManagerModal from "../../components/RequestDetailsForManager/RequestDetailsForManager";
import { IconSearch } from "../../components/Icons";
import avatar from "../../imgs/avatar.jpg";

import EmployeeRequestsServerApi from "../../apiServices/employeeRequestsApi";
import "../ManagerRequestsBoard/ManagerRequestsBoard.css";

const DEFAULT_PAGE_SIZE = 6;
const DEFAULT_ASSIGNMENT_STATUS = "Менеджер";

const EmployeeAssignableRequestsBoard = () => {
  const [searchParams] = useSearchParams();

  const currentEmployeeId =
    searchParams.get("employeeId") || "11111111-1111-1111-1111-111111111111";
  const fullName = searchParams.get("fullName") || "Сотрудник";

  const api = useMemo(() => new EmployeeRequestsServerApi(), []);
  const requestPhotoServerApi = useMemo(() => new RequestPhotoApi(), []);
  const commentsServerApi = useMemo(() => new CommentsApi(), []);

  const [mode, setMode] = useState("assignable"); // assignable | assigned

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: DEFAULT_PAGE_SIZE,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });

  const pageSize = DEFAULT_PAGE_SIZE;

  const [filters, setFilters] = useState({
    minCreatedAt: "",
    maxCreatedAt: "",
    priorities: [],
    statuses: [],
    buildingId: "",
    floorId: "",
    locationId: "",
    sort: "CreateAt desc",
  });

  // Search by number (только для assignable)
  const [searchNumber, setSearchNumber] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Details modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Assigning
  const [assigningRequestId, setAssigningRequestId] = useState("");

  // Employees modal
  const [employeesModalOpen, setEmployeesModalOpen] = useState(false);
  const [employeesForRequest, setEmployeesForRequest] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesRequestId, setEmployeesRequestId] = useState(null);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [employeesPagination, setEmployeesPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: 10,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });

  const [removingAssignmentId, setRemovingAssignmentId] = useState("");

  const fetchSeq = useRef(0);

  const normalizePagination = (p, fallbackPage, fallbackPageSize) => {
    const cp = p?.CurrentPage ?? p?.currentPage ?? fallbackPage;
    const tp = p?.TotalPages ?? p?.totalPages ?? 1;
    const tc = p?.TotalCount ?? p?.totalCount ?? 0;
    const ps = p?.PageSize ?? p?.pageSize ?? fallbackPageSize;
    const hasPrev = p?.HasPrevious ?? p?.hasPrevious ?? cp > 1;
    const hasNext = p?.HasNext ?? p?.hasNext ?? cp < tp;

    return {
      CurrentPage: cp,
      TotalPages: tp,
      TotalCount: tc,
      PageSize: ps,
      HasPrevious: hasPrev,
      HasNext: hasNext,
    };
  };

  const sameGuid = (a, b) =>
    String(a || "").toLowerCase() === String(b || "").toLowerCase();

  const mapAssignedRowsToRequests = (rows) => {
    // endpoint /employees/{id}/requests часто возвращает RequestsEmployee с полем request
    return (rows || [])
      .map((x) => x?.request ?? x?.Request ?? x)
      .filter(Boolean)
      .map((r) => ({ ...r, isAssigned: true }));
  };

  const fetchRequests = useCallback(
    async (page = currentPage) => {
      if (!currentEmployeeId) return;

      const seq = ++fetchSeq.current;
      setIsLoading(true);

      try {
        let res;

        if (mode === "assignable") {
          res = await api.GetAssignableRequestsForEmployee(
            currentEmployeeId,
            page,
            pageSize,
            filters,
          );
        } else {
          res = await api.GetAssignedRequestsForEmployee(
            currentEmployeeId,
            page,
            pageSize,
            filters,
          );
        }

        if (seq !== fetchSeq.current) return;

        if (!res.success) {
          toast.error(res.message || "Ошибка загрузки заявок");
          setRequests([]);
          setPagination(normalizePagination(null, page, pageSize));
          return;
        }

        const rawItems = Array.isArray(res.data) ? res.data : [];
        const items =
          mode === "assignable"
            ? rawItems
            : mapAssignedRowsToRequests(rawItems);

        setRequests(items);
        setPagination(normalizePagination(res.pagination, page, pageSize));
      } catch (e) {
        if (seq !== fetchSeq.current) return;

        console.error(e);
        toast.error("Ошибка загрузки заявок");
        setRequests([]);
        setPagination(normalizePagination(null, page, pageSize));
      } finally {
        if (seq === fetchSeq.current) setIsLoading(false);
      }
    },
    [api, currentEmployeeId, currentPage, pageSize, filters, mode],
  );

  useEffect(() => {
    setCurrentPage(1);
    setSearchMode(false);
    setSearchNumber("");
    setMode("assignable");
  }, [currentEmployeeId]);

  useEffect(() => {
    if (mode === "assignable" && searchMode) return;
    fetchRequests(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId, currentPage, filters, searchMode, mode]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination.TotalPages || 1)) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
    setSearchMode(false);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (mode !== "assignable") return;

    const n = Number(searchNumber);
    if (!searchNumber || Number.isNaN(n) || n <= 0) {
      toast.error("Введите корректный номер заявки");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.GetAssignableRequestByNumber(currentEmployeeId, n);

      if (!res.success || !res.data) {
        toast.error(res.message || "Заявка не найдена");
        return;
      }

      setSearchMode(true);
      setRequests([res.data]);
      setPagination({
        CurrentPage: 1,
        TotalPages: 1,
        PageSize: 1,
        TotalCount: 1,
        HasPrevious: false,
        HasNext: false,
      });
      setCurrentPage(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error("Ошибка поиска заявки");
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = async () => {
    setSearchMode(false);
    setSearchNumber("");
    setCurrentPage(1);
    await fetchRequests(1);
  };

  const switchMode = async (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setSearchMode(false);
    setSearchNumber("");
    setCurrentPage(1);
  };

  const openDetails = async (req) => {
    const safeDate = req?.createAt
      ? new Date(req.createAt).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    const baseMapped = {
      id: req.id,
      number: req.number,
      category: req.typeOfProblem?.title || "Заявка",
      date: safeDate,
      priority: req.priority,
      status: req.status,
      building: req.location?.floor?.building?.name ?? "—",
      floor:
        req.location?.floor?.floorNumber != null
          ? `Этаж ${req.location.floor.floorNumber}`
          : "—",
      spot: req.location?.name ?? "—",
      desc: req.description,
      images: [],
      comments: [],
    };

    setSelectedRequest(baseMapped);
    setIsDetailsOpen(true);
    setPhotoLoading(true);

    try {
      const requestId = req.id;

      const [photosRes, commentsRes] = await Promise.all([
        requestPhotoServerApi.GethotosForRequest(requestId),
        commentsServerApi.GetCommentsForRequest(requestId),
      ]);

      const newPhotos =
        photosRes.success && Array.isArray(photosRes.data)
          ? photosRes.data.map((item) => item.photoUrl)
          : [];

      const newComments =
        commentsRes.success && Array.isArray(commentsRes.data)
          ? commentsRes.data.map((c) => ({ text: c.text || c.content }))
          : [];

      setSelectedRequest((prev) => ({
        ...prev,
        images: newPhotos,
        comments: newComments,
      }));
    } catch (err) {
      console.error("Details error:", err);
    } finally {
      setPhotoLoading(false);
    }
  };

  // --- ВАЖНО: 1-й вариант (без перезагрузки страницы)
  // после назначения просто обновляем статус в state, чтобы UI сразу отобразил "Назначена"
  const handleAssignToThisEmployee = async (req) => {
    if (!req?.id || !currentEmployeeId) return;
    if (req.isAssigned === true) return;

    setAssigningRequestId(req.id);

    // Optimistic: сразу меняем UI
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id ? { ...r, isAssigned: true, status: "Назначена" } : r,
      ),
    );

    // если открыта модалка деталей по этой заявке — тоже обновим
    setSelectedRequest((prev) =>
      prev && prev.id === req.id ? { ...prev, status: "Назначена" } : prev,
    );

    try {
      const res = await api.AssignEmployeeToRequest(
        req.id,
        currentEmployeeId,
        DEFAULT_ASSIGNMENT_STATUS,
      );

      if (!res.success) {
        // rollback
        setRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, isAssigned: false } : r)),
        );
        setSelectedRequest((prev) =>
          prev && prev.id === req.id ? { ...prev, status: req.status } : prev,
        );

        toast.error(res.message || "Не удалось назначить заявку");
        return;
      }

      toast.success("Заявка назначена сотруднику");
    } catch (e) {
      console.error(e);

      // rollback
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, isAssigned: false } : r)),
      );
      setSelectedRequest((prev) =>
        prev && prev.id === req.id ? { ...prev, status: req.status } : prev,
      );

      toast.error("Ошибка назначения заявки");
    } finally {
      setAssigningRequestId("");
    }
  };

  // ===== Employees modal + delete assignment =====
  const mapEmployeeAssignment = (a, idx) => {
    const assignmentId = a?.id || a?.Id;

    const employeeIdFromRow =
      a?.employeeId ||
      a?.EmployeeId ||
      a?.employee?.id ||
      a?.employee?.Id ||
      a?.Employee?.id ||
      a?.Employee?.Id ||
      null;

    const emp = a?.employee || a?.Employee || {};
    const user = emp?.user || emp?.User || a?.user || a?.User || {};

    const empFullName =
      user?.fullName ||
      `${user?.lastName ?? ""} ${user?.firstName ?? ""}`.trim() ||
      a?.employeeName ||
      "Без имени";

    const avatarUrl = user?.profilePhotoUrl || user?.avatarUrl || avatar;

    const phone = user?.phoneNumber || user?.phone || "";
    const email = user?.email || "";

    const isAvailable =
      emp?.isAvailable ?? emp?.IsAvailable ?? a?.isAvailable ?? null;

    const currentBuildingName =
      emp?.currentBuilding?.name ||
      emp?.CurrentBuilding?.name ||
      a?.currentBuilding?.name ||
      "";

    const defaultBuildingName =
      emp?.defaultBuilding?.name ||
      emp?.DefaultBuilding?.name ||
      a?.defaultBuilding?.name ||
      "";

    const assignmentStatus =
      a?.assignmentStatus || a?.AssignmentStatus || a?.status || "—";

    return {
      key: assignmentId || employeeIdFromRow || idx,
      assignmentId,
      employeeId: employeeIdFromRow,
      fullName: empFullName,
      avatarUrl,
      phone,
      email,
      isAvailable,
      currentBuildingName,
      defaultBuildingName,
      assignmentStatus,
    };
  };

  const loadEmployeesForRequest = useCallback(
    async (requestId, page = 1) => {
      if (!requestId) return;

      setEmployeesLoading(true);

      try {
        const res = await api.GetEmployeesForRequest(requestId, page, 10);

        if (!res.success) {
          toast.error(res.message || "Не удалось загрузить сотрудников");
          setEmployeesForRequest([]);
          setEmployeesPagination(normalizePagination(null, page, 10));
          return;
        }

        const items = Array.isArray(res.employees) ? res.employees : [];
        setEmployeesForRequest(items.map(mapEmployeeAssignment));
        setEmployeesPagination(normalizePagination(res.pagination, page, 10));
      } catch (e) {
        console.error(e);
        toast.error("Ошибка загрузки сотрудников");
        setEmployeesForRequest([]);
        setEmployeesPagination(normalizePagination(null, page, 10));
      } finally {
        setEmployeesLoading(false);
      }
    },
    [api],
  );

  const openEmployeesModal = async (req) => {
    setEmployeesRequestId(req.id);
    setEmployeesModalOpen(true);
    setEmployeesPage(1);
    await loadEmployeesForRequest(req.id, 1);
  };

  const closeEmployeesModal = () => {
    setEmployeesModalOpen(false);
    setEmployeesForRequest([]);
    setEmployeesRequestId(null);
    setEmployeesPage(1);
    setRemovingAssignmentId("");
  };

  const changeEmployeesPage = async (direction) => {
    const next = direction === "prev" ? employeesPage - 1 : employeesPage + 1;
    if (next < 1 || next > (employeesPagination.TotalPages || 1)) return;

    setEmployeesPage(next);
    await loadEmployeesForRequest(employeesRequestId, next);
  };

  const handleRemoveEmployeeFromRequest = async (row) => {
    if (!employeesRequestId) return;

    if (!row?.assignmentId || !row?.employeeId) {
      toast.error("Не хватает данных для удаления (assignmentId/employeeId)");
      return;
    }

    const confirmed = window.confirm(
      `Удалить "${row.fullName}" из назначенных по этой заявке?`,
    );
    if (!confirmed) return;

    const removingCurrentEmployee = sameGuid(row.employeeId, currentEmployeeId);
    setRemovingAssignmentId(row.assignmentId);

    // optimistic: если удаляем текущего сотрудника в assignable-режиме, отметим как не назначенную
    if (removingCurrentEmployee && mode === "assignable") {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === employeesRequestId ? { ...r, isAssigned: false } : r,
        ),
      );
    }

    try {
      const res = await api.RemoveEmployeeFromRequest(
        employeesRequestId,
        row.employeeId,
        row.assignmentId,
      );

      if (!res.success) {
        // rollback optimistic
        if (removingCurrentEmployee && mode === "assignable") {
          setRequests((prev) =>
            prev.map((r) =>
              r.id === employeesRequestId ? { ...r, isAssigned: true } : r,
            ),
          );
        }

        toast.error(res.message || "Не удалось удалить назначение");
        return;
      }

      toast.success("Назначение удалено");

      // если удалили текущего сотрудника в assigned режиме — обновим список заявок
      if (removingCurrentEmployee && mode === "assigned") {
        await fetchRequests(currentPage);
      }

      const isLastItemOnPage = employeesForRequest.length === 1;
      const nextPage =
        isLastItemOnPage && employeesPage > 1
          ? employeesPage - 1
          : employeesPage;

      setEmployeesPage(nextPage);
      await loadEmployeesForRequest(employeesRequestId, nextPage);
    } catch (e) {
      console.error(e);

      // rollback optimistic
      if (removingCurrentEmployee && mode === "assignable") {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === employeesRequestId ? { ...r, isAssigned: true } : r,
          ),
        );
      }

      toast.error("Ошибка при удалении назначения");
    } finally {
      setRemovingAssignmentId("");
    }
  };

  return (
    <div className="manager-requests-board-page">
      <div className="manager-requests-page">
        <div className="manager-requests-shell">
          <header className="manager-requests-header">
            <div className="manager-requests-headerText">
              <h1 className="manager-requests-title">Заявки сотрудника</h1>
              <p className="manager-requests-subtitle">{fullName}</p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="manager-requests-filterBtn"
                onClick={() => switchMode("assignable")}
                style={
                  mode === "assignable"
                    ? undefined
                    : {
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        color: "#111827",
                      }
                }
              >
                Все заявки
              </button>

              <button
                className="manager-requests-filterBtn"
                onClick={() => switchMode("assigned")}
                style={
                  mode === "assigned"
                    ? undefined
                    : {
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        color: "#111827",
                      }
                }
              >
                Назначенные
              </button>

              {/* поиск только в assignable */}
              {mode === "assignable" && (
                <form
                  onSubmit={handleSearchSubmit}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    placeholder="№ заявки"
                    inputMode="numeric"
                    style={{
                      height: 38,
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      padding: "0 12px",
                      background: "rgba(255,255,255,0.9)",
                      minWidth: 140,
                    }}
                  />

                  <button
                    type="submit"
                    className="manager-requests-filterBtn"
                    disabled={searchLoading}
                  >
                    <span>{searchLoading ? "Поиск..." : "Найти"}</span>
                  </button>

                  {searchMode && (
                    <button
                      type="button"
                      className="manager-requests-filterBtn"
                      onClick={clearSearch}
                      style={{
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        color: "#111827",
                      }}
                    >
                      Сбросить
                    </button>
                  )}
                </form>
              )}

              <button
                className="manager-requests-filterBtn"
                onClick={() => setIsFilterOpen(true)}
              >
                <IconSearch size={18} />
                <span>Фильтры</span>
              </button>
            </div>
          </header>

          {isLoading ? (
            <div className="manager-requests-loaderBox">
              <div className="manager-requests-spinner"></div>
              <p className="manager-requests-loaderText">Загрузка...</p>
            </div>
          ) : (
            <>
              <main className="manager-requests-grid">
                {requests.map((req) => {
                  const assignedToThisEmployee = req?.isAssigned === true;
                  const isAssigning = assigningRequestId === req.id;

                  const shownNumber =
                    req.number ||
                    (req.id
                      ? String(req.id).toString().substring(0, 6).toUpperCase()
                      : "—");

                  const shownDate = req.createAt
                    ? new Date(req.createAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <article
                      key={req.id}
                      className={`manager-request-card ${
                        req.priority === "Высокий"
                          ? "manager-request-card--high"
                          : ""
                      }`}
                    >
                      <div className="manager-request-cardBody">
                        <div className="manager-request-topRow">
                          <span className="manager-request-id">
                            #{shownNumber}
                          </span>

                          <time className="manager-request-date">
                            {shownDate}
                          </time>
                        </div>

                        <h3 className="manager-request-title">
                          {req.typeOfProblem?.title || "Заявка"}
                        </h3>

                        <p className="manager-request-description">
                          {req.description || "Описание отсутствует."}
                        </p>

                        <div className="manager-request-badges">
                          <span className="manager-request-status">
                            {req.status || "—"}
                          </span>

                          <span
                            className={`manager-request-priority ${
                              req.priority === "Высокий"
                                ? "manager-request-priority--high"
                                : ""
                            }`}
                          >
                            {req.priority || "—"}
                          </span>
                        </div>

                        <div className="manager-request-actions">
                          <button
                            type="button"
                            className="manager-request-btn manager-request-btn--secondary"
                            onClick={() => openDetails(req)}
                          >
                            Просмотр
                          </button>

                          <button
                            type="button"
                            className="manager-request-btn manager-request-btn--secondary"
                            onClick={() => openEmployeesModal(req)}
                          >
                            Сотрудники
                          </button>

                          {/* Назначить показываем только в assignable */}
                          {mode === "assignable" && (
                            <button
                              type="button"
                              className={`manager-request-btn ${
                                assignedToThisEmployee
                                  ? "manager-request-btn--secondary"
                                  : "manager-request-btn--primary"
                              }`}
                              onClick={() => handleAssignToThisEmployee(req)}
                              disabled={assignedToThisEmployee || isAssigning}
                              style={
                                assignedToThisEmployee
                                  ? {
                                      background: "#94a3b8",
                                      borderColor: "#94a3b8",
                                      cursor: "not-allowed",
                                      opacity: 0.9,
                                    }
                                  : undefined
                              }
                            >
                              {assignedToThisEmployee
                                ? "Назначена"
                                : isAssigning
                                  ? "Назначение..."
                                  : "Назначить"}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </main>

              {/* пагинация работает и для assigned, и для assignable; отключаем только при поиске */}
              {!(mode === "assignable" && searchMode) &&
                (pagination.TotalPages || 1) > 1 && (
                  <nav className="manager-requests-pagination">
                    <button
                      type="button"
                      className="manager-requests-pageBtn"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      ← Назад
                    </button>

                    <div className="manager-requests-pageCounter">
                      <span>{currentPage}</span> / {pagination.TotalPages || 1}
                    </div>

                    <button
                      type="button"
                      className="manager-requests-pageBtn"
                      disabled={currentPage === (pagination.TotalPages || 1)}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Вперед →
                    </button>
                  </nav>
                )}
            </>
          )}

          <RequestFiltersModal
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={handleApplyFilters}
            currentFilters={filters}
            disabledStatuses={
              mode === "assignable" ? ["Выполнена", "Отклонена"] : undefined
            }
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

          {/* MODAL: Employees for request */}
          {employeesModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 9999,
              }}
              onClick={closeEmployeesModal}
            >
              <div
                style={{
                  width: "min(840px, 100%)",
                  background: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    Назначенные сотрудники
                  </div>

                  <button
                    type="button"
                    onClick={closeEmployeesModal}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 24,
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                    aria-label="close"
                  >
                    ×
                  </button>
                </div>

                {employeesLoading ? (
                  <div style={{ padding: 12, color: "#64748b" }}>
                    Загрузка...
                  </div>
                ) : employeesForRequest.length === 0 ? (
                  <div style={{ padding: 12, color: "#64748b" }}>
                    Никто не назначен.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {employeesForRequest.map((e) => {
                      const isRemoving =
                        removingAssignmentId === e.assignmentId;
                      const online =
                        e.isAvailable === true
                          ? true
                          : e.isAvailable === false
                            ? false
                            : null;

                      return (
                        <div
                          key={e.key}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 12,
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <img
                              src={e.avatarUrl}
                              alt=""
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                objectFit: "cover",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                              }}
                              onError={(ev) => {
                                ev.currentTarget.onerror = null;
                                ev.currentTarget.src = avatar;
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ fontWeight: 800 }}>
                                  {e.fullName}
                                </div>

                                {online !== null ? (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 800,
                                      padding: "3px 10px",
                                      borderRadius: 999,
                                      background: online
                                        ? "#dcfce7"
                                        : "#fee2e2",
                                      color: online ? "#166534" : "#991b1b",
                                    }}
                                  >
                                    {online ? "На работе" : "Не на месте"}
                                  </span>
                                ) : null}

                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: 999,
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                  }}
                                >
                                  {e.assignmentStatus}
                                </span>
                              </div>

                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#64748b",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 10,
                                }}
                              >
                                {e.currentBuildingName ? (
                                  <span>
                                    Сейчас: <b>{e.currentBuildingName}</b>
                                  </span>
                                ) : null}
                                {e.defaultBuildingName ? (
                                  <span>
                                    База: <b>{e.defaultBuildingName}</b>
                                  </span>
                                ) : null}
                              </div>

                              {(e.phone || e.email) && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#64748b",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 10,
                                  }}
                                >
                                  {e.phone ? <span>{e.phone}</span> : null}
                                  {e.email ? <span>{e.email}</span> : null}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEmployeeFromRequest(e)}
                            disabled={isRemoving}
                            title="Удалить назначение"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              border: "1px solid #fecaca",
                              background: isRemoving ? "#ffe4e6" : "#fff1f2",
                              color: "#e11d48",
                              cursor: isRemoving ? "not-allowed" : "pointer",
                              fontSize: 18,
                              fontWeight: 900,
                              lineHeight: "36px",
                            }}
                          >
                            {isRemoving ? "…" : "×"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(employeesPagination.TotalPages || 1) > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 14,
                      gap: 12,
                    }}
                  >
                    <button
                      type="button"
                      disabled={
                        !employeesPagination.HasPrevious || employeesLoading
                      }
                      onClick={() => changeEmployeesPage("prev")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      ←
                    </button>

                    <div style={{ color: "#64748b" }}>
                      Стр. {employeesPagination.CurrentPage} /{" "}
                      {employeesPagination.TotalPages}
                    </div>

                    <button
                      type="button"
                      disabled={
                        !employeesPagination.HasNext || employeesLoading
                      }
                      onClick={() => changeEmployeesPage("next")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAssignableRequestsBoard;
