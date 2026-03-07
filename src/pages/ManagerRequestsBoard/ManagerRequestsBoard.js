import React, { useState, useEffect } from "react";
import RequestFiltersModal from "../../components/RequestFilters/RequestFiltersModal";
import RequestApi from "../../apiServices/requestApi";
import { IconSearch } from "../../components/Icons";
import "./ManagerRequestsBoard.css";

const ManagerRequestsBoard = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Установили 6 заявок на страницу
  const pageSize = 6;
  const requestApi = new RequestApi();

  const [filters, setFilters] = useState({
    status: "",
    type: "",
    location: "",
    executor: "",
    sort: "dateDesc",
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await requestApi.GetRequests(currentPage, pageSize);

      if (response.success && response.data) {
        setRequests(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.TotalPages || 1);
        }
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
    setCurrentPage(1); // Сброс на первую страницу при фильтрации
    setIsFilterOpen(false);
  };

  return (
    <div className="requests-page-wrapper">
      <div className="requests-page-container">
        <header className="requests-header-bar">
          <div className="header-text">
            <h1 className="page-title">Управление заявками</h1>
            <p className="page-subtitle">
              Центр мониторинга и распределения задач
            </p>
          </div>
          <button
            className="btn-filter-main"
            onClick={() => setIsFilterOpen(true)}
          >
            <IconSearch size={20} />
            <span>Фильтры</span>
          </button>
        </header>

        {isLoading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Синхронизация данных...</p>
          </div>
        ) : (
          <>
            <main className="requests-grid">
              {requests.map((req) => (
                <article
                  key={req.id}
                  className={`request-card ${req.priority === "Высокий" ? "high-priority" : ""}`}
                >
                  <div className="card-inner-content">
                    <div className="req-top-row">
                      <span className="req-id-tag">
                        #
                        {req.number ||
                          req.id.toString().substring(0, 6).toUpperCase()}
                      </span>
                      <time className="req-date-label">
                        {new Date(req.createAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <h3 className="req-card-title">
                      {req.typeOfProblem?.title || "Обращение в сервис"}
                    </h3>

                    <p className="req-card-description">
                      {req.description ||
                        "Клиент не предоставил детальное описание проблемы."}
                    </p>

                    <div className="req-badges-row">
                      <span className="status-badge">
                        {req.status || "В очереди"}
                      </span>
                      <span
                        className={`priority-badge ${req.priority === "Высокий" ? "high" : ""}`}
                      >
                        {req.priority || "Обычный"}
                      </span>
                    </div>

                    <div className="req-card-footer">
                      <button className="btn-secondary" onClick={() => {}}>
                        Просмотр
                      </button>
                      <button className="btn-primary" onClick={() => {}}>
                        Назначить
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </main>

            {totalPages > 1 && (
              <nav className="pagination-nav">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  ← Назад
                </button>
                <div className="page-counter">
                  <span>{currentPage}</span> / {totalPages}
                </div>
                <button
                  className="page-btn"
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
      </div>
    </div>
  );
};

export default ManagerRequestsBoard;
