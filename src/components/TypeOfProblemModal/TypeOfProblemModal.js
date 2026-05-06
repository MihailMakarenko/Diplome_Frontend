import React, { useEffect, useMemo, useState } from "react";
import "./TypeOfProblemModal.css";
import { toast } from "react-toastify";
import TypeOfProblemServerApi from "../../apiServices/typeProblemsApi";

const PRIORITY_OPTIONS = [
  { value: "Низкий", label: "Низкий" },
  { value: "Средний", label: "Средний" },
  { value: "Высокий", label: "Высокий" },
  { value: "Критический", label: "Критический" },
];

const PAGE_SIZE = 3;
const MAX_DESC_TEXT = 20;

const TITLE_MIN_LEN = 2;
const TITLE_MAX_LEN = 32;

function totalPagesFrom(pagination) {
  return (
    pagination?.TotalPages ??
    pagination?.totalPages ??
    pagination?.total_pages ??
    1
  );
}

function currentPageFrom(pagination) {
  return (
    pagination?.CurrentPage ??
    pagination?.currentPage ??
    pagination?.current_page ??
    1
  );
}

function totalCountFrom(pagination, fallback = 0) {
  return (
    pagination?.TotalCount ??
    pagination?.totalCount ??
    pagination?.total_count ??
    fallback
  );
}

function hasPreviousFrom(pagination, currentPage) {
  if (pagination?.HasPrevious != null) return pagination.HasPrevious;
  if (pagination?.hasPrevious != null) return pagination.hasPrevious;
  return currentPage > 1;
}

function hasNextFrom(pagination, currentPage, totalPages) {
  if (pagination?.HasNext != null) return pagination.HasNext;
  if (pagination?.hasNext != null) return pagination.hasNext;
  return currentPage < totalPages;
}

function cut20(text) {
  if (!text) return "";
  return text.length > MAX_DESC_TEXT
    ? `${text.slice(0, MAX_DESC_TEXT)}…`
    : text;
}

function isLong20(text) {
  return (text?.length ?? 0) > MAX_DESC_TEXT;
}

function ConfirmDelete({ open, loading, title, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="topm-confirm-overlay"
      onClick={loading ? undefined : onClose}
    >
      <div className="topm-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="topm-confirm-title">Подтверждение удаления</div>
        <div className="topm-confirm-text">
          {title || "Вы действительно хотите удалить тип проблемы?"}
        </div>

        <div className="topm-confirm-actions">
          <button
            type="button"
            className="topm-btn topm-btn-light"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="button"
            className="topm-btn topm-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onChange,
  disabled,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="topm-pagination-compact">
      <button
        type="button"
        className="topm-compact-btn"
        disabled={disabled || !hasPrevious}
        onClick={() => onChange(currentPage - 1)}
      >
        ← Назад
      </button>

      <div className="topm-compact-current">
        <span className="topm-compact-currentPage">{currentPage}</span>
        <span className="topm-compact-divider">/</span>
        <span className="topm-compact-totalPages">{totalPages}</span>
      </div>

      <button
        type="button"
        className="topm-compact-btn"
        disabled={disabled || !hasNext}
        onClick={() => onChange(currentPage + 1)}
      >
        Вперед →
      </button>
    </div>
  );
}

export default function TypeOfProblemModal({ isOpen, onClose }) {
  const api = useMemo(() => new TypeOfProblemServerApi(), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    basePriority: "Средний",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedDescId, setExpandedDescId] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    CurrentPage: 1,
    TotalPages: 1,
    PageSize: PAGE_SIZE,
    TotalCount: 0,
    HasPrevious: false,
    HasNext: false,
  });

  const resetForm = () => {
    setEditingId("");
    setForm({
      title: "",
      description: "",
      basePriority: "Средний",
    });
  };

  const loadItems = async (targetPage = page) => {
    setLoading(true);
    setPageError("");

    try {
      const res = await api.GetProblemTypes(targetPage, PAGE_SIZE);

      if (!res?.success) {
        setItems([]);
        setPagination({
          CurrentPage: 1,
          TotalPages: 1,
          PageSize: PAGE_SIZE,
          TotalCount: 0,
          HasPrevious: false,
          HasNext: false,
        });
        setPageError(res?.message || "Не удалось загрузить типы проблем");
        return;
      }

      const nextItems = Array.isArray(res.data) ? res.data : [];
      const p = res.pagination || {};

      const currentPage = currentPageFrom(p);
      const totalPages = totalPagesFrom(p);
      const totalCount = totalCountFrom(p, nextItems.length);

      setItems(nextItems);
      setPagination({
        CurrentPage: currentPage,
        TotalPages: totalPages,
        PageSize: PAGE_SIZE,
        TotalCount: totalCount,
        HasPrevious: hasPreviousFrom(p, currentPage),
        HasNext: hasNextFrom(p, currentPage, totalPages),
      });
      setExpandedDescId(null);
    } catch (e) {
      console.error(e);
      setItems([]);
      setPagination({
        CurrentPage: 1,
        TotalPages: 1,
        PageSize: PAGE_SIZE,
        TotalCount: 0,
        HasPrevious: false,
        HasNext: false,
      });
      setPageError("Не удалось загрузить типы проблем");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    setPage(1);
    setExpandedDescId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    loadItems(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, page]);

  const onChangeField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item?.id || "");
    setForm({
      title: (item?.title || "").slice(0, TITLE_MAX_LEN),
      description: item?.description || "",
      basePriority: item?.basePriority || "Средний",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = (form.title || "").trim();

    if (title.length < TITLE_MIN_LEN) {
      toast.error(`Название должно быть минимум ${TITLE_MIN_LEN} символа`);
      return;
    }

    if (title.length > TITLE_MAX_LEN) {
      toast.error(`Название должно быть не более ${TITLE_MAX_LEN} символов`);
      return;
    }

    if (!form.basePriority) {
      toast.error("Выберите базовый приоритет");
      return;
    }

    const payload = {
      title: title.slice(0, TITLE_MAX_LEN),
      description: (form.description || "").trim(),
      basePriority: form.basePriority,
    };

    setSaving(true);

    try {
      let res;

      if (editingId) {
        res = await api.UpdateProblemType(editingId, payload);
      } else {
        res = await api.CreateProblemType(payload);
      }

      if (!res?.success) {
        toast.error(
          res?.message ||
            (editingId
              ? "Не удалось обновить тип проблемы"
              : "Не удалось создать тип проблемы"),
        );
        return;
      }

      toast.success(
        editingId
          ? "Тип проблемы успешно обновлен"
          : "Тип проблемы успешно создан",
      );

      resetForm();
      setPage(1);
      await loadItems(1);
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при сохранении типа проблемы");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (item) => {
    setDeleteTarget(item);
  };

  const closeDelete = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    setDeleteLoading(true);

    try {
      const res = await api.DeleteProblemType(deleteTarget.id);

      if (!res?.success) {
        toast.error(res?.message || "Не удалось удалить тип проблемы");
        return;
      }

      toast.success("Тип проблемы удален");

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);

      const nextPage =
        items.length === 1 && pagination.CurrentPage > 1
          ? pagination.CurrentPage - 1
          : pagination.CurrentPage;

      setPage(nextPage);
      await loadItems(nextPage);
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при удалении типа проблемы");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleDescription = (id) => {
    setExpandedDescId((prev) => (prev === id ? null : id));
  };

  if (!isOpen) return null;

  return (
    <div className="type-of-problem-modal">
      <div className="topm-overlay" onClick={onClose}>
        <div className="topm-card" onClick={(e) => e.stopPropagation()}>
          <div className="topm-header">
            <h3 className="topm-title">Управление типами проблем</h3>

            <button
              type="button"
              className="topm-close"
              onClick={onClose}
              aria-label="Закрыть"
              title="Закрыть"
            >
              &times;
            </button>
          </div>

          <div className="topm-body">
            <div className="topm-grid">
              <div className="topm-panel">
                <div className="topm-panel-title">
                  {editingId
                    ? "Редактировать тип проблемы"
                    : "Создать тип проблемы"}
                </div>

                <form className="topm-form" onSubmit={handleSubmit}>
                  <div className="topm-field">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <label className="topm-label">Название</label>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {form.title?.length || 0}/{TITLE_MAX_LEN}
                      </span>
                    </div>

                    <input
                      className="topm-input"
                      value={form.title}
                      onChange={(e) =>
                        onChangeField(
                          "title",
                          (e.target.value || "").slice(0, TITLE_MAX_LEN),
                        )
                      }
                      placeholder="Например: Электрика"
                      disabled={saving}
                      required
                      minLength={TITLE_MIN_LEN}
                      maxLength={TITLE_MAX_LEN}
                    />
                  </div>

                  <div className="topm-field">
                    <label className="topm-label">Описание</label>
                    <textarea
                      className="topm-textarea"
                      value={form.description}
                      onChange={(e) =>
                        onChangeField("description", e.target.value)
                      }
                      placeholder="Введите описание типа проблемы"
                      disabled={saving}
                      rows={5}
                    />
                  </div>

                  <div className="topm-field">
                    <label className="topm-label">Базовый приоритет</label>
                    <select
                      className="topm-input"
                      value={form.basePriority}
                      onChange={(e) =>
                        onChangeField("basePriority", e.target.value)
                      }
                      disabled={saving}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="topm-actions">
                    <button
                      type="submit"
                      className="topm-btn topm-btn-primary"
                      disabled={saving}
                    >
                      {saving
                        ? "Сохранение..."
                        : editingId
                          ? "Сохранить"
                          : "Создать"}
                    </button>

                    <button
                      type="button"
                      className="topm-btn topm-btn-light"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Сбросить
                    </button>
                  </div>
                </form>
              </div>

              <div className="topm-panel">
                <div className="topm-panel-head">
                  <div className="topm-panel-title">Список типов проблем</div>
                  <div className="topm-total">
                    Всего: {pagination.TotalCount}
                  </div>
                </div>

                {pageError ? (
                  <div className="topm-error">{pageError}</div>
                ) : null}

                {loading ? (
                  <div className="topm-empty">Загрузка...</div>
                ) : items.length ? (
                  <>
                    <div className="topm-list">
                      {items.map((item) => {
                        const desc = item.description || "Описание отсутствует";
                        const isExpanded = expandedDescId === item.id;
                        const canExpand = isLong20(desc);

                        return (
                          <div key={item.id} className="topm-item">
                            <div className="topm-item-main">
                              <div className="topm-item-top">
                                <div className="topm-item-title">
                                  {item.title || "Без названия"}
                                </div>
                                <div className="topm-priority">
                                  {item.basePriority ?? "—"}
                                </div>
                              </div>

                              <div className="topm-item-desc-wrap">
                                <div className="topm-item-desc">
                                  {isExpanded ? desc : cut20(desc)}
                                </div>

                                {canExpand && (
                                  <button
                                    type="button"
                                    className={`topm-expand-btn ${isExpanded ? "open" : ""}`}
                                    onClick={() => toggleDescription(item.id)}
                                    title={
                                      isExpanded ? "Свернуть" : "Развернуть"
                                    }
                                  >
                                    ▾
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="topm-item-actions">
                              <button
                                type="button"
                                className="topm-btn topm-btn-edit"
                                onClick={() => handleEdit(item)}
                              >
                                Изменить
                              </button>

                              <button
                                type="button"
                                className="topm-btn topm-btn-danger"
                                onClick={() => openDelete(item)}
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="topm-pagination-wrap">
                      <div className="topm-page-info">
                        Страница {pagination.CurrentPage} из{" "}
                        {pagination.TotalPages}
                      </div>

                      <Pagination
                        currentPage={pagination.CurrentPage}
                        totalPages={pagination.TotalPages}
                        hasPrevious={pagination.HasPrevious}
                        hasNext={pagination.HasNext}
                        onChange={setPage}
                        disabled={loading}
                      />
                    </div>
                  </>
                ) : (
                  <div className="topm-empty">Список типов проблем пуст</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDelete
        open={!!deleteTarget}
        loading={deleteLoading}
        title={
          deleteTarget ? `Удалить тип проблемы "${deleteTarget.title}"?` : ""
        }
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
