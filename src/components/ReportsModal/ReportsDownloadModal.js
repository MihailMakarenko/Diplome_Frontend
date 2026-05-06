import React, { useEffect, useMemo, useState } from "react";
import "./ReportsDownloadModal.css";

import ReportsApi from "../../apiServices/reportsApi";
import RequestFiltersModal from "../../components/RequestFilters/RequestFiltersModal";
import UserFiltersModal from "../../components/UserFiltersModal/UserFiltersModal";

export default function ManagerReportsDownloadModal({
  isOpen,
  onClose,
  initialRequestFilters = {},
}) {
  const reportsApi = useMemo(() => new ReportsApi(), []);

  const [requestFilters, setRequestFilters] = useState(
    initialRequestFilters || {},
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [count, setCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState("");

  // take selection
  const [takeMode, setTakeMode] = useState("all"); // all | 100 | 500 | 1000

  useEffect(() => {
    if (!isOpen) return;

    setRequestFilters(initialRequestFilters || {});
    setLoading(false);
    setError("");

    setCount(null);
    setCountLoading(false);
    setCountError("");

    setTakeMode("all");
  }, [isOpen, initialRequestFilters]);

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
    const endpoint = `${baseUrl}/requests/count`;

    const controller = new AbortController();

    (async () => {
      setCountLoading(true);
      setCountError("");

      try {
        const url = `${endpoint}${buildQuery(requestFilters)}`;

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
  }, [isOpen, requestFilters]);

  if (!isOpen) return null;

  const title = "Отчёт по заявкам";
  const countText = countLoading
    ? "Найдено: считаем…"
    : typeof count === "number"
      ? `Найдено: ${count}`
      : "Найдено: —";

  const getTake = () => {
    if (takeMode === "all") return undefined;
    const n = Number(takeMode);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    if (typeof count === "number") return Math.min(n, count);
    return n;
  };

  const take = getTake();

  const onDownload = async (format) => {
    setError("");
    setLoading(true);

    try {
      const params = { ...requestFilters, ...(take ? { Take: take } : {}) };

      const res =
        format === "pdf"
          ? await reportsApi.downloadRequestsPdf(params)
          : await reportsApi.downloadRequestsXlsx(params);

      if (!res?.success) setError(res?.message || "Не удалось скачать файл");
    } catch (e) {
      setError(e?.message || "Не удалось скачать файл");
    } finally {
      setLoading(false);
    }
  };

  const disableDownload =
    loading || countLoading || (typeof count === "number" && count === 0);

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
            <h3 className="reportsDownload-title">Отчёты (Менеджер)</h3>
            <div className="reportsDownload-subtitle">
              {title} • {countText}
              {take ? ` • В отчёт: ${take}` : ""}
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

        {/* Панель управления всегда видна */}
        <div className="reportsDownload-toolbar">
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
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
            </select>
          </div>

          <div className="reportsDownload-actionsRight">
            <button
              type="button"
              className="reportsDownload-btn reportsDownload-btn--primary"
              onClick={() => onDownload("pdf")}
              disabled={disableDownload}
            >
              Скачать PDF
            </button>

            <button
              type="button"
              className="reportsDownload-btn reportsDownload-btn--primary"
              onClick={() => onDownload("xlsx")}
              disabled={disableDownload}
            >
              Скачать XLSX
            </button>
          </div>
        </div>

        {/* Скролл только тут */}
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

          <div className="reportsDownload-filtersWrap">
            <RequestFiltersModal
              embedded
              isOpen
              onClose={() => {}}
              currentFilters={requestFilters}
              onApply={(f) => setRequestFilters(f)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
