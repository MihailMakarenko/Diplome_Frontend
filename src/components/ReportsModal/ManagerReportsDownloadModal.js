import React, { useEffect, useMemo, useState } from "react";
import "./ReportsDownloadModal.css";

import ReportsApi from "../../apiServices/reportsApi";
import RequestFiltersModal from "../../components/RequestFilters/RequestFiltersModal";

export default function ManagerReportsDownloadModal({
  isOpen,
  onClose,
  initialRequestFilters = {},
}) {
  const reportsApi = useMemo(() => new ReportsApi(), []);

  const [requestFilters, setRequestFilters] = useState(
    initialRequestFilters || {},
  );

  const [showFilters, setShowFilters] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [count, setCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState("");

  // ===== уведомление =====
  const [notice, setNotice] = useState("");

  // ===== выбор количества =====
  // all | custom
  const [takeMode, setTakeMode] = useState("all");
  const [takeCustom, setTakeCustom] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    setRequestFilters(initialRequestFilters || {});
    setShowFilters(true);

    setLoading(false);
    setError("");

    setCount(null);
    setCountLoading(false);
    setCountError("");

    setTakeMode("all");
    setTakeCustom(100);

    setNotice("");
  }, [isOpen, initialRequestFilters]);

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

  // Маппинг фильтров из UI в то, что ожидает сервер (по Swagger)
  const mapRequestFiltersToApi = (filters) => {
    const f = filters || {};
    return {
      // сервер ждёт BuildingId/FloorId/LocationId/OrderBy (регистронезависимо, но лучше так)
      BuildingId: f.buildingId || f.BuildingId || "",
      FloorId: f.floorId || f.FloorId || "",
      LocationId: f.locationId || f.LocationId || "",
      ValidDateRange: f.ValidDateRange ?? f.validDateRange, // если у тебя нет — просто не будет отправлено ниже
      OrderBy: f.OrderBy || f.orderBy || f.sort || f.Sort || "",

      // если на сервере реально есть фильтры приоритета/статуса — оставим (если нет, просто игнорируются)
      Priorities: f.priorities || f.Priorities,
      Statuses: f.statuses || f.Statuses,

      // если сервер у тебя принимает даты — возможно нужны другие имена.
      // оставляем как есть (если бэк их не использует, он их проигнорирует)
      MinCreatedAt: f.minCreatedAt || f.MinCreatedAt,
      MaxCreatedAt: f.maxCreatedAt || f.MaxCreatedAt,
    };
  };

  // load count when filters change
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
        const queryFilters = mapRequestFiltersToApi(requestFilters);
        // не отправляем пустые ключи
        Object.keys(queryFilters).forEach((k) => {
          const v = queryFilters[k];
          if (v === "" || v === undefined || v === null) delete queryFilters[k];
        });

        const url = `${endpoint}${buildQuery(queryFilters)}`;

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

  const clampPageSize = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return null;
    if (num <= 0) return null;
    if (typeof count === "number" && count > 0) return Math.min(num, count);
    return num;
  };

  // ВАЖНО: сервер ждёт PageNumber/PageSize.
  // - если "Все" и count известен => PageSize = count
  // - если "Своё" => PageSize = введённое (с ограничением по count)
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
      const base = mapRequestFiltersToApi(requestFilters);

      // если PageSize не определён (например, count не получили), отправим без пагинации
      // (если на бэке дефолтная пагинация — лучше починить бэк или требовать count)
      const params = {
        ...base,
        ...(pageSize ? { PageNumber: 1, PageSize: pageSize } : {}),
      };

      // удаляем пустые значения, чтобы не засорять query
      Object.keys(params).forEach((k) => {
        const v = params[k];
        if (v === "" || v === undefined || v === null) delete params[k];
      });

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
    loading ||
    countLoading ||
    (typeof count === "number" && count === 0) ||
    // если выбрали "Все", но count не смогли получить — лучше не давать скачать, иначе бэк может отдать только 1 страницу
    (takeMode === "all" && typeof count !== "number");

  const handleFiltersApply = (f) => {
    setRequestFilters(f);
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
            <h3 className="reportsDownload-title">Отчёты (Менеджер)</h3>
            <div className="reportsDownload-subtitle">
              {title} • {countText}
              {pageSize && takeMode !== "all" ? ` • В отчёт: ${pageSize}` : ""}
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

        {notice && <div className="reportsDownload-notice">{notice}</div>}

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
              <RequestFiltersModal
                embedded
                isOpen
                onClose={() => {}}
                currentFilters={requestFilters}
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
