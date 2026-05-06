import React, { useEffect, useMemo, useState } from "react";
import "./ReportsDownloadModal.css";

import ReportsApi from "../../apiServices/reportsApi";
import UserFiltersModal from "../../components/UserFiltersModal/UserFiltersModal";

export default function AdminReportsDownloadModal({
  isOpen,
  onClose,
  initialUserFilters = {},
}) {
  const reportsApi = useMemo(() => new ReportsApi(), []);

  const [userFilters, setUserFilters] = useState(initialUserFilters || {});
  const [showFilters, setShowFilters] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [count, setCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState("");

  // уведомление
  const [notice, setNotice] = useState("");

  // выбор количества: all | custom
  const [takeMode, setTakeMode] = useState("all");
  const [takeCustom, setTakeCustom] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    setUserFilters(initialUserFilters || {});
    setShowFilters(true);

    setLoading(false);
    setError("");

    setCount(null);
    setCountLoading(false);
    setCountError("");

    setNotice("");

    setTakeMode("all");
    setTakeCustom(100);
  }, [isOpen, initialUserFilters]);

  // auto-hide notice
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2000);
    return () => clearTimeout(t);
  }, [notice]);

  // lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const buildQuery = (params = {}) => {
    const qs = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (typeof val === "string" && val.trim() === "") return;

      if (Array.isArray(val)) {
        if (!val.length) return;
        val.forEach((x) => {
          if (x === undefined || x === null) return;
          const s = String(x);
          if (!s.trim()) return;
          qs.append(key, s);
        });
        return;
      }

      qs.set(key, String(val));
    });

    const s = qs.toString();
    return s ? `?${s}` : "";
  };

  const readCountFromResponse = async (res) => {
    const headerCandidates = [
      res.headers.get("x-count"),
      res.headers.get("x-total-count"),
      res.headers.get("x-pagination"),
    ].filter(Boolean);

    for (const h of headerCandidates) {
      if (h.trim().startsWith("{")) {
        try {
          const pag = JSON.parse(h);
          const total =
            pag?.TotalCount ??
            pag?.totalCount ??
            pag?.totalItems ??
            pag?.total ??
            null;
          if (typeof total === "number") return total;
        } catch {
          // ignore
        }
      }

      const n = Number(h);
      if (Number.isFinite(n)) return n;
    }

    const text = await res.text().catch(() => "");
    if (!text) return null;

    const asNumber = Number(text);
    if (Number.isFinite(asNumber)) return asNumber;

    try {
      const j = JSON.parse(text);
      const n =
        j?.count ?? j?.Count ?? j?.totalCount ?? j?.TotalCount ?? j?.total;
      if (typeof n === "number") return n;
    } catch {
      // ignore
    }

    return null;
  };

  // load count when applied filters change
  useEffect(() => {
    if (!isOpen) return;

    const baseUrl = process.env.REACT_APP_BASE_URL; // ".../api"
    if (!baseUrl) {
      setCount(null);
      setCountError("Не задан REACT_APP_BASE_URL");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const endpoint = `${baseUrl}/users/count`;

    const controller = new AbortController();

    (async () => {
      setCountLoading(true);
      setCountError("");

      try {
        // чистим пустые значения
        const q = { ...(userFilters || {}) };
        Object.keys(q).forEach((k) => {
          const v = q[k];
          if (v === "" || v === undefined || v === null) delete q[k];
        });

        const url = `${endpoint}${buildQuery(q)}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Ошибка count: ${res.status}`);
        }

        const total = await readCountFromResponse(res);
        setCount(typeof total === "number" ? total : null);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setCount(null);
        setCountError(e?.message || "Не удалось получить количество");
      } finally {
        setCountLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isOpen, userFilters]);

  if (!isOpen) return null;

  const title = "Отчёт по пользователям";
  const countText = countLoading
    ? "Найдено: считаем…"
    : typeof count === "number"
      ? `Найдено: ${count}`
      : "Найдено: —";

  const clampPageSize = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return null;
    if (num <= 0) return null;
    if (typeof count === "number" && count > 0) return Math.min(num, count);
    return num;
  };

  // сервер ждёт PageNumber/PageSize (как у тебя в swagger)
  const pageSize =
    takeMode === "custom"
      ? (clampPageSize(takeCustom) ?? undefined)
      : typeof count === "number"
        ? count
        : undefined;

  const onDownload = async (format) => {
    setError("");
    setLoading(true);

    try {
      const params = {
        ...(userFilters || {}),
        ...(pageSize ? { PageNumber: 1, PageSize: pageSize } : {}),
      };

      Object.keys(params).forEach((k) => {
        const v = params[k];
        if (v === "" || v === undefined || v === null) delete params[k];
      });

      const res =
        format === "pdf"
          ? await reportsApi.downloadUsersPdf(params)
          : await reportsApi.downloadUsersXlsx(params);

      if (!res?.success) setError(res?.message || "Не удалось скачать файл");
    } catch (e) {
      setError(e?.message || "Не удалось скачать файл");
    } finally {
      setLoading(false);
    }
  };

  const disableDownload =
    loading ||
    countLoading ||
    (typeof count === "number" && count === 0) ||
    // “Все” невозможно, если не смогли получить count (иначе сервер может вернуть только дефолтную страницу)
    (takeMode === "all" && typeof count !== "number");

  const handleFiltersApply = (f) => {
    setUserFilters(f || {});
    setNotice("Фильтры применены");
  };

  return (
    <div className="reportsDownload-overlay" onMouseDown={onClose}>
      <div
        className="reportsDownload-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="reportsDownload-header">
          <div>
            <h3 className="reportsDownload-title">Отчёты (Администратор)</h3>
            <div className="reportsDownload-subtitle">
              {title} • {countText}
              {takeMode === "custom" && pageSize
                ? ` • В отчёт: ${pageSize}`
                : ""}
            </div>
          </div>

          <button
            className="reportsDownload-close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Панель управления (всегда видна) */}
        <div className="reportsDownload-toolbar">
          <div className="reportsDownload-toolbarLeft">
            <button
              type="button"
              className="reportsDownload-btn reportsDownload-btn--secondary"
              onClick={() => setShowFilters((v) => !v)}
              disabled={loading}
            >
              {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
            </button>
          </div>

          <div className="reportsDownload-take">
            <div className="reportsDownload-takeLabel">В отчёт:</div>

            <select
              className="reportsDownload-select"
              value={takeMode}
              onChange={(e) => setTakeMode(e.target.value)}
              disabled={
                countLoading || (typeof count === "number" && count === 0)
              }
            >
              <option value="all">Все</option>
              <option value="custom">Своё количество</option>
            </select>

            {takeMode === "custom" && (
              <input
                className="reportsDownload-input"
                type="number"
                min={1}
                max={typeof count === "number" ? count : undefined}
                value={takeCustom}
                onChange={(e) => setTakeCustom(e.target.value)}
                disabled={
                  countLoading || (typeof count === "number" && count === 0)
                }
                placeholder="Напр. 200"
              />
            )}
          </div>

          <div className="reportsDownload-actionsRight">
            <button
              type="button"
              className="reportsDownload-btn reportsDownload-btn--primary"
              onClick={() => onDownload("pdf")}
              disabled={disableDownload}
              title={
                takeMode === "all" && typeof count !== "number"
                  ? "Нельзя скачать 'Все', пока не получено количество"
                  : ""
              }
            >
              Скачать PDF
            </button>

            <button
              type="button"
              className="reportsDownload-btn reportsDownload-btn--primary"
              onClick={() => onDownload("xlsx")}
              disabled={disableDownload}
              title={
                takeMode === "all" && typeof count !== "number"
                  ? "Нельзя скачать 'Все', пока не получено количество"
                  : ""
              }
            >
              Скачать XLSX
            </button>
          </div>
        </div>

        {/* уведомление */}
        {notice && <div className="reportsDownload-notice">{notice}</div>}

        {/* Скролл */}
        <div className="reportsDownload-body">
          {countError && (
            <div className="reportsDownload-error">{countError}</div>
          )}

          {loading && (
            <div className="reportsDownload-info">
              Генерация отчёта… Подождите.
            </div>
          )}

          {error && <div className="reportsDownload-error">{error}</div>}

          {showFilters ? (
            <div className="reportsDownload-filtersWrap">
              <UserFiltersModal
                embedded
                isOpen
                onClose={() => setShowFilters(false)}
                initialFilters={userFilters}
                onApply={handleFiltersApply}
              />
            </div>
          ) : (
            <div className="reportsDownload-hint">
              Фильтры скрыты. Нажмите «Показать фильтры», чтобы изменить условия
              отчёта.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
