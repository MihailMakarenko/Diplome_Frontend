// apiServices/reportsApi.js
import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class ReportsApi {
  constructor() {
    // базовый: /api/reports
    this.baseUrl = `${baseUrl}/reports`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        // для blob "Content-Type" не обязателен, но не мешает
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      // если у вас авторизация через cookie — включите:
      // withCredentials: true,
    });
  }

  SetAccessToken(token) {
    this.api.defaults.headers.Authorization = token ? `Bearer ${token}` : "";
  }

  _err(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallback
    );
  }

  // -------- filename from Content-Disposition --------
  // Нужен заголовок с бэка: Content-Disposition: attachment; filename="xxx.pdf"
  // И чтобы фронт мог его прочитать по CORS:
  // Access-Control-Expose-Headers: Content-Disposition
  _getFileNameFromHeaders(headers, fallback) {
    const cd =
      headers?.["content-disposition"] ||
      headers?.["Content-Disposition"] ||
      "";

    if (!cd) return fallback;

    // filename*=UTF-8''report%20name.xlsx
    let match = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1].trim());
      } catch {
        return match[1].trim();
      }
    }

    // filename="report name.xlsx" OR filename=report.xlsx
    match = cd.match(/filename\s*=\s*"([^"]+)"/i);
    if (match?.[1]) return match[1].trim();

    match = cd.match(/filename\s*=\s*([^;]+)/i);
    if (match?.[1]) return match[1].trim();

    return fallback;
  }

  _downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  _normalizeParams(params = {}) {
    // axios нормально кодирует массивы (по умолчанию: key[]=a&key[]=b),
    // но ваш бэк может ожидать key=a&key=b.
    // Поэтому вручную превращаем массивы в повторяющиеся ключи через URLSearchParams
    // и отдаём как строку paramsSerializer (ниже).
    return params || {};
  }

  _paramsSerializer(params) {
    const qs = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (typeof val === "string" && val.trim() === "") return;

      if (Array.isArray(val)) {
        val.forEach((x) => {
          if (x === undefined || x === null) return;
          const s = String(x);
          if (!s.trim()) return;
          qs.append(key, s); // key=a&key=b
        });
        return;
      }

      qs.set(key, String(val));
    });

    return qs.toString();
  }

  async _download(endpoint, filters, fallbackName) {
    try {
      const response = await this.api.get(endpoint, {
        responseType: "blob",
        params: this._normalizeParams(filters),
        paramsSerializer: (params) => this._paramsSerializer(params),
      });

      const fileName = this._getFileNameFromHeaders(
        response.headers,
        fallbackName,
      );

      // Если сервер отдает корректный Content-Type, axios сохранит его в blob.type
      const blob = new Blob([response.data], {
        type: response.data?.type || response.headers?.["content-type"],
      });

      this._downloadBlob(blob, fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("Download report error:", error);
      return {
        success: false,
        message: this._err(error, "Не удалось скачать отчёт"),
      };
    }
  }

  // =========================
  // GET /api/reports/requests.pdf
  // =========================
  downloadRequestsPdf(filters = {}) {
    return this._download("/requests.pdf", filters, "requests.pdf");
  }

  // =========================
  // GET /api/reports/requests.xlsx
  // =========================
  downloadRequestsXlsx(filters = {}) {
    return this._download("/requests.xlsx", filters, "requests.xlsx");
  }

  // =========================
  // GET /api/reports/users.pdf
  // =========================
  downloadUsersPdf(filters = {}) {
    return this._download("/users.pdf", filters, "users.pdf");
  }

  // =========================
  // GET /api/reports/users.xlsx
  // =========================
  downloadUsersXlsx(filters = {}) {
    return this._download("/users.xlsx", filters, "users.xlsx");
  }
}

export default ReportsApi;
