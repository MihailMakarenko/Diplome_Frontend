import React, { useEffect, useMemo, useState } from "react";
import "./UserFiltersModal.css";

export default function UserFiltersModal({
  isOpen,
  onClose,
  initialFilters,
  onApply,
  embedded = false,
}) {
  const opened = embedded ? true : isOpen;

  const [secondName, setSecondName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // all | true | false
  const [blockedMode, setBlockedMode] = useState("all");
  const [emailConfirmedMode, setEmailConfirmedMode] = useState("all");
  const [hasEmployeeMode, setHasEmployeeMode] = useState("all");
  const [hasTgUserMode, setHasTgUserMode] = useState("all");

  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [createdSort, setCreatedSort] = useState("desc"); // desc | asc

  const [error, setError] = useState("");

  const normalizeDateForInput = (v) => {
    if (!v) return "";
    const s = String(v);
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10);
    return "";
  };

  const makeBool = (mode) => {
    if (mode === "true") return true;
    if (mode === "false") return false;
    return undefined;
  };

  const toUtcIsoStart = (yyyyMmDd) => `${yyyyMmDd}T00:00:00.000Z`;
  const toUtcIsoEnd = (yyyyMmDd) => `${yyyyMmDd}T23:59:59.999Z`;

  const toUtcDateForCompare = (yyyyMmDd, endOfDay = false) => {
    const iso = endOfDay ? toUtcIsoEnd(yyyyMmDd) : toUtcIsoStart(yyyyMmDd);
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? null : new Date(ms);
  };

  useEffect(() => {
    if (!opened) return;

    setError("");
    const f = initialFilters || {};

    setSecondName(f.SecondName ?? "");
    setEmail(f.Email ?? "");
    setPhoneNumber(f.PhoneNumber ?? "");

    setBlockedMode(
      f.isBlocked === true ? "true" : f.isBlocked === false ? "false" : "all",
    );
    setEmailConfirmedMode(
      f.emailConfirmed === true
        ? "true"
        : f.emailConfirmed === false
          ? "false"
          : "all",
    );
    setHasEmployeeMode(
      f.hasEmployee === true
        ? "true"
        : f.hasEmployee === false
          ? "false"
          : "all",
    );
    setHasTgUserMode(
      f.hasTgUser === true ? "true" : f.hasTgUser === false ? "false" : "all",
    );

    setCreatedFrom(normalizeDateForInput(f.CreatedFrom));
    setCreatedTo(normalizeDateForInput(f.CreatedTo));

    const orderBy = (f.OrderBy || "").toLowerCase();
    if (orderBy.includes("createdat") && orderBy.includes("asc"))
      setCreatedSort("asc");
    else setCreatedSort("desc");
  }, [opened, initialFilters]);

  useEffect(() => {
    if (!opened || embedded) return;

    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [opened, embedded, onClose]);

  const buildFilters = () => {
    const fromD = createdFrom ? toUtcDateForCompare(createdFrom, false) : null;
    const toD = createdTo ? toUtcDateForCompare(createdTo, true) : null;

    if ((createdFrom && !fromD) || (createdTo && !toD)) {
      return { ok: false, message: "Некорректная дата", filters: null };
    }
    if (fromD && toD && fromD > toD) {
      return {
        ok: false,
        message: "Дата 'От' не может быть больше даты 'До'",
        filters: null,
      };
    }

    const filters = {};

    if (secondName.trim()) filters.SecondName = secondName.trim();
    if (email.trim()) filters.Email = email.trim();
    if (phoneNumber.trim()) filters.PhoneNumber = phoneNumber.trim();

    const isBlocked = makeBool(blockedMode);
    if (isBlocked !== undefined) filters.isBlocked = isBlocked;

    const emailConfirmed = makeBool(emailConfirmedMode);
    if (emailConfirmed !== undefined) filters.emailConfirmed = emailConfirmed;

    const hasEmployee = makeBool(hasEmployeeMode);
    if (hasEmployee !== undefined) filters.hasEmployee = hasEmployee;

    const hasTgUser = makeBool(hasTgUserMode);
    if (hasTgUser !== undefined) filters.hasTgUser = hasTgUser;

    if (createdFrom) filters.CreatedFrom = toUtcIsoStart(createdFrom);
    if (createdTo) filters.CreatedTo = toUtcIsoEnd(createdTo);

    filters.OrderBy =
      createdSort === "asc" ? "CreatedAt ascending" : "CreatedAt descending";

    return { ok: true, message: "", filters };
  };

  const handleApply = () => {
    setError("");

    const built = buildFilters();
    if (!built.ok) {
      setError(built.message);
      return;
    }

    onApply?.(built.filters);

    // В embedded режиме — закрываем блок фильтров
    if (embedded) onClose?.();
  };

  const handleReset = () => {
    setError("");
    setSecondName("");
    setEmail("");
    setPhoneNumber("");

    setBlockedMode("all");
    setEmailConfirmedMode("all");
    setHasEmployeeMode("all");
    setHasTgUserMode("all");

    setCreatedFrom("");
    setCreatedTo("");

    setCreatedSort("desc");

    // Сбрасываем и применяем (пустые фильтры)
    onApply?.({});
    if (embedded) onClose?.();
  };

  const activeCount = useMemo(() => {
    let c = 0;

    if (secondName.trim()) c++;
    if (email.trim()) c++;
    if (phoneNumber.trim()) c++;

    if (blockedMode !== "all") c++;
    if (emailConfirmedMode !== "all") c++;
    if (hasEmployeeMode !== "all") c++;
    if (hasTgUserMode !== "all") c++;

    if (createdFrom) c++;
    if (createdTo) c++;

    return c;
  }, [
    secondName,
    email,
    phoneNumber,
    blockedMode,
    emailConfirmedMode,
    hasEmployeeMode,
    hasTgUserMode,
    createdFrom,
    createdTo,
  ]);

  if (!opened) return null;

  const content = (
    <div
      className={
        "userFilters-modal" + (embedded ? " userFilters-modal--embedded" : "")
      }
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="userFilters-header">
        <div>
          <h3>Фильтры пользователей</h3>
          <div className="userFilters-subtitle">
            Активных фильтров: <b>{activeCount}</b>
          </div>
        </div>

        {!embedded && (
          <button className="userFilters-close" onClick={onClose} type="button">
            ×
          </button>
        )}
      </div>

      <div className="userFilters-body">
        <div className="userFilters-grid">
          <div className="userFilters-row">
            <label>Фамилия (SecondName)</label>
            <input
              value={secondName}
              onChange={(e) => setSecondName(e.target.value)}
              placeholder="Например: Иванов"
            />
          </div>

          <div className="userFilters-row">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Например: ivanov@example.com"
            />
          </div>

          <div className="userFilters-row">
            <label>Телефон</label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Например: +375..."
            />
          </div>

          <div className="userFilters-row">
            <label>Статус блокировки</label>
            <select
              value={blockedMode}
              onChange={(e) => setBlockedMode(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="false">Только активные</option>
              <option value="true">Только заблокированные</option>
            </select>
          </div>

          <div className="userFilters-row">
            <label>Email подтверждён</label>
            <select
              value={emailConfirmedMode}
              onChange={(e) => setEmailConfirmedMode(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="true">Подтверждён</option>
              <option value="false">Не подтверждён</option>
            </select>
          </div>

          <div className="userFilters-row">
            <label>Есть профиль сотрудника</label>
            <select
              value={hasEmployeeMode}
              onChange={(e) => setHasEmployeeMode(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          </div>

          <div className="userFilters-row">
            <label>Привязан Telegram</label>
            <select
              value={hasTgUserMode}
              onChange={(e) => setHasTgUserMode(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          </div>

          <div className="userFilters-row">
            <label>Дата регистрации — от</label>
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
            />
          </div>

          <div className="userFilters-row">
            <label>Дата регистрации — до</label>
            <input
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
            />
          </div>

          <div className="userFilters-row userFilters-row--full">
            <label>Сортировка по дате регистрации</label>
            <select
              value={createdSort}
              onChange={(e) => setCreatedSort(e.target.value)}
            >
              <option value="desc">Сначала новые (CreatedAt descending)</option>
              <option value="asc">Сначала старые (CreatedAt ascending)</option>
            </select>
          </div>
        </div>

        {error && <div className="userFilters-error">{error}</div>}
      </div>

      {/* Кнопки теперь есть и в embedded тоже */}
      <div
        className={
          "userFilters-footer" +
          (embedded ? " userFilters-footer--embedded" : "")
        }
      >
        <button className="btn btn-outline" onClick={handleReset} type="button">
          Сбросить
        </button>
        <button className="btn btn-primary" onClick={handleApply} type="button">
          Применить
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div
        className="userFilters-overlay userFilters-overlay--embedded"
        style={{
          position: "static",
          inset: "auto",
          background: "transparent",
          padding: 0,
          display: "block",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div className="userFilters-overlay" onMouseDown={onClose}>
      {content}
    </div>
  );
}
