import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import "./EmployeeSettingsPage.css";
import { toast } from "react-toastify";
import EmployeeTypeOfProblemServerApi from "../../apiServices/employeeTypeOfProblemApi";
import EmployeeWorkspacesModal from "../../components/EmployeeWorkspacesModal/EmployeeWorkspacesModal";

const ASSIGNED_PAGE_SIZE = 3;
const ASSIGNABLE_PAGE_SIZE = 20;

function EmployeeSettingsPage() {
  const [searchParams] = useSearchParams();

  const employeeId =
    searchParams.get("employeeId") || "66666666-6666-6666-6666-666666666666";
  const fullName = searchParams.get("fullName") || "Иванов Иван Иванович";

  const api = useMemo(() => new EmployeeTypeOfProblemServerApi(), []);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // -------- Assigned (уже назначенные) ----------
  const [assignedProblemTypes, setAssignedProblemTypes] = useState([]);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPagination, setAssignedPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: ASSIGNED_PAGE_SIZE,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [pageError, setPageError] = useState("");

  // -------- Assignable (доступные для назначения) ----------
  const [assignableProblemTypes, setAssignableProblemTypes] = useState([]);
  const [assignablePage, setAssignablePage] = useState(1);
  const [assignablePagination, setAssignablePagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: ASSIGNABLE_PAGE_SIZE,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });
  const [loadingAssignable, setLoadingAssignable] = useState(false);

  // -------- Form ----------
  const [selectedProblemTypeId, setSelectedProblemTypeId] = useState("");
  const [skills, setSkills] = useState(1);
  const [desire, setDesire] = useState(1);

  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // защита от гонок ответов
  const assignedReqSeq = useRef(0);
  const assignableReqSeq = useRef(0);

  const employee = useMemo(
    () => ({
      id: employeeId,
      fullName,
      name: fullName,
    }),
    [employeeId, fullName],
  );

  const normalizeRate = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.min(5, numeric));
  };

  const resetAssignForm = () => {
    setSelectedProblemTypeId("");
    setSkills(1);
    setDesire(1);
  };

  // ------------------ LOAD ASSIGNED ------------------
  const loadAssignedProblemTypes = useCallback(
    async (page) => {
      if (!employeeId) return;

      const seq = ++assignedReqSeq.current;

      setLoadingAssigned(true);
      setPageError("");

      try {
        const res = await api.getEmployeeProblemTypes(
          employeeId,
          page,
          ASSIGNED_PAGE_SIZE,
        );

        if (seq !== assignedReqSeq.current) return;

        if (!res.success) {
          setAssignedProblemTypes([]);
          setAssignedPagination({
            CurrentPage: 1,
            TotalPages: 1,
            PageSize: ASSIGNED_PAGE_SIZE,
            TotalCount: 0,
            HasPrevious: false,
            HasNext: false,
          });
          setPageError(
            res.message || "Не удалось загрузить назначенные типы проблем",
          );
          return;
        }

        const items = Array.isArray(res.data) ? res.data : [];
        const p = res.pagination || {};

        const currentPage = p.CurrentPage ?? p.currentPage ?? page;
        const totalPages = p.TotalPages ?? p.totalPages ?? 1;
        const totalCount = p.TotalCount ?? p.totalCount ?? items.length;
        const pageSize = p.PageSize ?? p.pageSize ?? ASSIGNED_PAGE_SIZE;

        const hasPrev = p.HasPrevious ?? p.hasPrevious ?? currentPage > 1;
        const hasNext = p.HasNext ?? p.hasNext ?? currentPage < totalPages;

        setAssignedProblemTypes(items);
        setAssignedPagination({
          CurrentPage: currentPage,
          TotalPages: totalPages,
          PageSize: pageSize,
          TotalCount: totalCount,
          HasPrevious: hasPrev,
          HasNext: hasNext,
        });
      } catch (e) {
        if (seq !== assignedReqSeq.current) return;

        console.error(e);
        setAssignedProblemTypes([]);
        setAssignedPagination({
          CurrentPage: 1,
          TotalPages: 1,
          PageSize: ASSIGNED_PAGE_SIZE,
          TotalCount: 0,
          HasPrevious: false,
          HasNext: false,
        });
        setPageError("Ошибка загрузки назначенных типов проблем");
      } finally {
        if (seq === assignedReqSeq.current) setLoadingAssigned(false);
      }
    },
    [api, employeeId],
  );

  // ------------------ LOAD ASSIGNABLE ------------------
  const loadAssignableProblemTypes = useCallback(
    async (page) => {
      if (!employeeId) return;

      const seq = ++assignableReqSeq.current;

      setLoadingAssignable(true);

      try {
        const res = await api.getAssignableProblemTypes(
          employeeId,
          page,
          ASSIGNABLE_PAGE_SIZE,
        );

        if (seq !== assignableReqSeq.current) return;

        if (!res.success) {
          toast.error(
            res.message || "Не удалось загрузить доступные типы проблем",
          );
          if (page === 1) setAssignableProblemTypes([]);
          return;
        }

        const items = Array.isArray(res.data) ? res.data : [];
        const p = res.pagination || {};

        const currentPage = p.CurrentPage ?? p.currentPage ?? page;
        const totalPages = p.TotalPages ?? p.totalPages ?? 1;
        const totalCount = p.TotalCount ?? p.totalCount ?? items.length;
        const pageSize = p.PageSize ?? p.pageSize ?? ASSIGNABLE_PAGE_SIZE;

        const hasPrev = p.HasPrevious ?? p.hasPrevious ?? currentPage > 1;
        const hasNext = p.HasNext ?? p.hasNext ?? currentPage < totalPages;

        setAssignablePagination({
          CurrentPage: currentPage,
          TotalPages: totalPages,
          PageSize: pageSize,
          TotalCount: totalCount,
          HasPrevious: hasPrev,
          HasNext: hasNext,
        });

        setAssignableProblemTypes((prev) => {
          if (page === 1) return items;

          // append + unique by id
          const map = new Map(prev.map((x) => [x.id, x]));
          for (const it of items) map.set(it.id, it);
          return Array.from(map.values());
        });

        setAssignablePage(currentPage);
      } catch (e) {
        if (seq !== assignableReqSeq.current) return;

        console.error(e);
        toast.error("Ошибка загрузки доступных типов проблем");
        if (page === 1) setAssignableProblemTypes([]);
      } finally {
        if (seq === assignableReqSeq.current) setLoadingAssignable(false);
      }
    },
    [api, employeeId],
  );

  const reloadAssignableFirstPage = useCallback(async () => {
    setAssignablePage(1);
    setAssignableProblemTypes([]);
    await loadAssignableProblemTypes(1);
  }, [loadAssignableProblemTypes]);

  // -------- Effects --------

  // При смене сотрудника: сброс
  useEffect(() => {
    setAssignedPage(1);
    setAssignablePage(1);
    setAssignableProblemTypes([]);
    resetAssignForm();
    setPageError("");
  }, [employeeId]);

  // Назначенные грузим ТОЛЬКО по employeeId + assignedPage
  useEffect(() => {
    loadAssignedProblemTypes(assignedPage);
  }, [employeeId, assignedPage, loadAssignedProblemTypes]);

  // Доступные: первая страница при смене сотрудника
  useEffect(() => {
    loadAssignableProblemTypes(1);
  }, [employeeId, loadAssignableProblemTypes]);

  // -------- Pagination controls (assigned) --------
  const handleAssignedPageChange = (direction) => {
    if (direction === "prev" && assignedPagination.HasPrevious) {
      setAssignedPage((prev) => prev - 1);
    }
    if (direction === "next" && assignedPagination.HasNext) {
      setAssignedPage((prev) => prev + 1);
    }
  };

  const renderRateOptions = () => {
    const values = [1, 2, 3, 4, 5];
    return values.map((value) => (
      <option key={value} value={value}>
        {value}
      </option>
    ));
  };

  // -------- react-select options --------
  const assignableOptions = useMemo(() => {
    return assignableProblemTypes.map((type) => ({
      value: type.id,
      label: `${type.title} (${type.basePriority})`,
      type,
    }));
  }, [assignableProblemTypes]);

  const selectedOption = useMemo(() => {
    return (
      assignableOptions.find((o) => o.value === selectedProblemTypeId) || null
    );
  }, [assignableOptions, selectedProblemTypeId]);

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }),
    [],
  );

  // -------- Assign --------
  const handleAssignProblemType = async (e) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error("Не найден employeeId");
      return;
    }

    if (!selectedProblemTypeId) {
      toast.error("Выберите тип проблемы");
      return;
    }

    const payload = {
      skills: normalizeRate(skills),
      desire: normalizeRate(desire),
    };

    setSubmittingAssign(true);

    try {
      const res = await api.assignProblemType(
        employeeId,
        selectedProblemTypeId,
        payload,
      );

      if (!res.success) {
        toast.error(res.message || "Не удалось назначить тип проблемы");
        return;
      }

      toast.success("Тип проблемы успешно назначен");
      resetAssignForm();

      // Обновляем назначенные:
      // если уже на 1 странице — вручную перезагрузим (иначе useEffect не сработает)
      if (assignedPage === 1) {
        await loadAssignedProblemTypes(1);
      } else {
        setAssignedPage(1); // useEffect загрузит
      }

      // Обновляем доступные
      await reloadAssignableFirstPage();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при назначении типа проблемы");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // -------- Delete assigned --------
  const handleDeleteAssignedProblemType = async (assignment) => {
    const assignmentId = assignment?.id;
    const typeOfProblemId = assignment?.typeOfProblem?.id;

    if (!assignmentId || !typeOfProblemId) {
      toast.error("Недостаточно данных для удаления");
      return;
    }

    const confirmed = window.confirm(
      `Удалить тип проблемы "${assignment?.typeOfProblem?.title || "Без названия"}" у сотрудника?`,
    );
    if (!confirmed) return;

    setDeletingId(assignmentId);

    // optimistic: убрать сразу из UI
    const wasOnlyOneOnPage = assignedProblemTypes.length === 1;

    setAssignedProblemTypes((prev) =>
      prev.filter((x) => x.id !== assignmentId),
    );
    setAssignedPagination((prev) => ({
      ...prev,
      TotalCount: Math.max(0, (prev.TotalCount || 0) - 1),
    }));

    try {
      const res = await api.deleteEmployeeProblemType(
        employeeId,
        typeOfProblemId,
        assignmentId,
      );

      if (!res.success) {
        toast.error(res.message || "Не удалось удалить назначение");
        // откат: просто перезагрузим текущую страницу
        await loadAssignedProblemTypes(assignedPage);
        return;
      }

      toast.success("Назначение успешно удалено");

      // Если страница стала пустой и есть предыдущая — перейдём назад
      if (wasOnlyOneOnPage && assignedPage > 1) {
        setAssignedPage((p) => p - 1); // useEffect загрузит
      } else {
        // Иначе нужно догрузить “хвост”, чтобы страница заполнилась
        await loadAssignedProblemTypes(assignedPage);
      }

      // доступные обновим
      await reloadAssignableFirstPage();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при удалении назначения");
      // откат: перезагрузка
      await loadAssignedProblemTypes(assignedPage);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="employee-settings-page">
      <div className="employee-settings-page__container">
        <header className="employee-settings-page__header">
          <div>
            <div className="employee-settings-page__eyebrow">
              Настройка сотрудника
            </div>
            <h1 className="employee-settings-page__title">{fullName}</h1>
          </div>

          <div className="employee-settings-page__header-actions">
            <button
              type="button"
              className="employee-settings-page__btn employee-settings-page__btn--primary"
              onClick={() => setWorkspaceOpen(true)}
            >
              Управление рабочими зонами
            </button>
          </div>
        </header>

        <section className="employee-settings-page__section">
          <div className="employee-settings-page__section-head employee-settings-page__section-head--column">
            <div>
              <h2 className="employee-settings-page__section-title">
                Типы проблем сотрудника
              </h2>
              <p className="employee-settings-page__section-text">
                Здесь можно назначить сотруднику типы проблем, которые он может
                решать, а также указать уровень навыков и желания.
              </p>
            </div>

            {pageError ? (
              <div className="employee-settings-page__error">{pageError}</div>
            ) : null}
          </div>

          <div className="employee-settings-page__grid">
            {/* ---------- Assign new ---------- */}
            <div className="employee-settings-page__card">
              <div className="employee-settings-page__card-title">
                Назначить новый тип проблемы
              </div>

              <form
                className="employee-settings-page__form"
                onSubmit={handleAssignProblemType}
              >
                <div className="employee-settings-page__field">
                  <label className="employee-settings-page__label">
                    Тип проблемы (доступные для назначения)
                  </label>

                  <Select
                    value={selectedOption}
                    onChange={(opt) =>
                      setSelectedProblemTypeId(opt?.value || "")
                    }
                    options={assignableOptions}
                    isLoading={loadingAssignable}
                    isDisabled={loadingAssignable || submittingAssign}
                    placeholder="-- Выберите тип проблемы --"
                    maxMenuHeight={240}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                    noOptionsMessage={() =>
                      loadingAssignable
                        ? "Загрузка..."
                        : "Нет доступных типов проблем"
                    }
                    onMenuScrollToBottom={() => {
                      if (loadingAssignable) return;
                      if (!assignablePagination.HasNext) return;
                      loadAssignableProblemTypes(assignablePage + 1);
                    }}
                  />
                </div>

                <div className="employee-settings-page__field-row">
                  <div className="employee-settings-page__field">
                    <label className="employee-settings-page__label">
                      Навыки (skills)
                    </label>
                    <select
                      className="employee-settings-page__select"
                      value={skills}
                      onChange={(e) => setSkills(Number(e.target.value))}
                      disabled={submittingAssign}
                    >
                      {renderRateOptions()}
                    </select>
                  </div>

                  <div className="employee-settings-page__field">
                    <label className="employee-settings-page__label">
                      Желание (desire)
                    </label>
                    <select
                      className="employee-settings-page__select"
                      value={desire}
                      onChange={(e) => setDesire(Number(e.target.value))}
                      disabled={submittingAssign}
                    >
                      {renderRateOptions()}
                    </select>
                  </div>
                </div>

                {selectedProblemTypeId ? (
                  <div className="employee-settings-page__selected-info">
                    {selectedOption?.type ? (
                      <>
                        <div className="employee-settings-page__selected-title">
                          {selectedOption.type.title}
                        </div>
                        <div className="employee-settings-page__selected-priority">
                          Базовый приоритет: {selectedOption.type.basePriority}
                        </div>
                        <div className="employee-settings-page__selected-description">
                          {selectedOption.type.description ||
                            "Описание отсутствует"}
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="employee-settings-page__form-actions">
                  <button
                    type="submit"
                    className="employee-settings-page__btn employee-settings-page__btn--primary"
                    disabled={
                      submittingAssign ||
                      loadingAssignable ||
                      !selectedProblemTypeId
                    }
                  >
                    {submittingAssign ? "Сохранение..." : "Назначить"}
                  </button>

                  <button
                    type="button"
                    className="employee-settings-page__btn employee-settings-page__btn--ghost"
                    onClick={resetAssignForm}
                    disabled={submittingAssign}
                  >
                    Сбросить
                  </button>
                </div>
              </form>
            </div>

            {/* ---------- Assigned list ---------- */}
            <div className="employee-settings-page__card">
              <div
                className="employee-settings-page__card-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Уже назначенные типы проблем</span>
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}
                >
                  Всего: {assignedPagination.TotalCount}
                </span>
              </div>

              {loadingAssigned ? (
                <div className="employee-settings-page__empty">
                  Загрузка назначений...
                </div>
              ) : assignedProblemTypes.length === 0 ? (
                <div className="employee-settings-page__empty">
                  У сотрудника пока нет назначенных типов проблем
                </div>
              ) : (
                <>
                  <div className="employee-settings-page__assigned-list">
                    {assignedProblemTypes.map((assignment) => {
                      const title =
                        assignment?.typeOfProblem?.title || "Без названия";
                      const description =
                        assignment?.typeOfProblem?.description ||
                        "Описание отсутствует";
                      const priority =
                        assignment?.typeOfProblem?.basePriority || "—";

                      return (
                        <div
                          key={assignment.id}
                          className="employee-settings-page__assigned-item"
                        >
                          <div className="employee-settings-page__assigned-main">
                            <div className="employee-settings-page__assigned-top">
                              <div className="employee-settings-page__assigned-title">
                                {title}
                              </div>
                              <div className="employee-settings-page__priority-badge">
                                {priority}
                              </div>
                            </div>

                            <div className="employee-settings-page__assigned-description">
                              {description}
                            </div>

                            <div className="employee-settings-page__assigned-metrics">
                              <div className="employee-settings-page__metric">
                                <span className="employee-settings-page__metric-label">
                                  Навыки:
                                </span>
                                <span className="employee-settings-page__metric-value">
                                  {assignment.skills}
                                </span>
                              </div>

                              <div className="employee-settings-page__metric">
                                <span className="employee-settings-page__metric-label">
                                  Желание:
                                </span>
                                <span className="employee-settings-page__metric-value">
                                  {assignment.desire}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="employee-settings-page__assigned-actions">
                            <button
                              type="button"
                              className="employee-settings-page__btn employee-settings-page__btn--danger"
                              onClick={() =>
                                handleDeleteAssignedProblemType(assignment)
                              }
                              disabled={deletingId === assignment.id}
                            >
                              {deletingId === assignment.id
                                ? "Удаление..."
                                : "Удалить"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontSize: 14, color: "#64748b" }}>
                      Страница {assignedPagination.CurrentPage} из{" "}
                      {assignedPagination.TotalPages || 1}
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <button
                        type="button"
                        className="employee-settings-page__btn employee-settings-page__btn--ghost"
                        disabled={
                          !assignedPagination.HasPrevious || loadingAssigned
                        }
                        onClick={() => handleAssignedPageChange("prev")}
                      >
                        &lt;
                      </button>

                      <button
                        type="button"
                        className="employee-settings-page__btn employee-settings-page__btn--ghost"
                        disabled={
                          !assignedPagination.HasNext || loadingAssigned
                        }
                        onClick={() => handleAssignedPageChange("next")}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <EmployeeWorkspacesModal
        isOpen={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        employee={employee}
      />
    </div>
  );
}

export default EmployeeSettingsPage;
