import React, { useState, useEffect, useMemo } from "react";
import RequestFiltersModal from "../../components/RequestFilters/RequestFiltersModal";
import RequestServerApi from "../../apiServices/requestApi";
import RequestPhotoApi from "../../apiServices/requestPhotoApi";
import CommentsApi from "../../apiServices/commentsApi";
import AssignEmployeeModal from "../../components/AssignEmployeeModal/AssignEmployeeModal";
import RequestDetailsForManagerModal from "../../components/RequestDetailsForManager/RequestDetailsForManager";
import { IconSearch } from "../../components/Icons";
import "./ManagerRequestsBoard.css";

const ManagerRequestsBoard = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 6;

  const requestApi = useMemo(() => new RequestServerApi(), []);
  const requestPhotoServerApi = useMemo(() => new RequestPhotoApi(), []);
  const commentsServerApi = useMemo(() => new CommentsApi(), []);

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

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignRequestId, setAssignRequestId] = useState(null);
  const [assignProblemId, setAssignProblemId] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await requestApi.GetRequests(
        currentPage,
        pageSize,
        filters,
      );

      if (response.success && response.data) {
        setRequests(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.TotalPages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        console.error("Error fetching requests:", response.message);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const openDetails = async (req) => {
    const baseMapped = {
      id: req.id,
      number: req.number,
      category: req.typeOfProblem?.title || "Заявка",
      date: new Date(req.createAt).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
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
      console.error("Details error (manager):", err);
    } finally {
      setPhotoLoading(false);
    }
  };

  const openAssignModal = (req) => {
    setAssignRequestId(req.id);
    setAssignProblemId(req.typeOfProblem?.id || null);
    setIsAssignOpen(true);
  };

  const handleAssign = async (employeeId) => {
    if (!assignRequestId || !employeeId) return;

    console.log(
      "Назначаем заявку",
      assignRequestId,
      "на сотрудника",
      employeeId,
    );

    await fetchRequests();
  };

  return (
    <div className="manager-requests-page">
      <div className="manager-requests-shell">
        <header className="manager-requests-header">
          <div className="manager-requests-headerText">
            <h1 className="manager-requests-title">Управление заявками</h1>
            <p className="manager-requests-subtitle">
              Центр мониторинга и распределения задач
            </p>
          </div>

          <button
            className="manager-requests-filterBtn"
            onClick={() => setIsFilterOpen(true)}
          >
            <IconSearch size={18} />
            <span>Фильтры</span>
          </button>
        </header>

        {isLoading ? (
          <div className="manager-requests-loaderBox">
            <div className="manager-requests-spinner"></div>
            <p className="manager-requests-loaderText">
              Синхронизация данных...
            </p>
          </div>
        ) : (
          <>
            <main className="manager-requests-grid">
              {requests.map((req) => (
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
                        #
                        {req.number ||
                          req.id.toString().substring(0, 6).toUpperCase()}
                      </span>

                      <time className="manager-request-date">
                        {new Date(req.createAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <h3 className="manager-request-title">
                      {req.typeOfProblem?.title || "Обращение в сервис"}
                    </h3>

                    <p className="manager-request-description">
                      {req.description ||
                        "Клиент не предоставил детальное описание проблемы."}
                    </p>

                    <div className="manager-request-badges">
                      <span className="manager-request-status">
                        {req.status || "В очереди"}
                      </span>

                      <span
                        className={`manager-request-priority ${
                          req.priority === "Высокий"
                            ? "manager-request-priority--high"
                            : ""
                        }`}
                      >
                        {req.priority || "Обычный"}
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
                        className="manager-request-btn manager-request-btn--primary"
                        onClick={() => openAssignModal(req)}
                      >
                        Назначить
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </main>

            {totalPages > 1 && (
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
                  <span>{currentPage}</span> / {totalPages}
                </div>

                <button
                  type="button"
                  className="manager-requests-pageBtn"
                  disabled={currentPage === totalPages}
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

        <AssignEmployeeModal
          isOpen={isAssignOpen}
          onClose={() => {
            setIsAssignOpen(false);
            setAssignRequestId(null);
            setAssignProblemId(null);
          }}
          requestId={assignRequestId}
          problemId={assignProblemId}
          onAssign={handleAssign}
        />
      </div>
    </div>
  );
};

export default ManagerRequestsBoard;
