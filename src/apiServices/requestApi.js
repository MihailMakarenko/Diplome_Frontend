import axios from "axios";
import qs from "qs";

const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5035/api";

class RequestServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/requests`;

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      paramsSerializer: (params) =>
        qs.stringify(params, {
          arrayFormat: "repeat",
          encode: true,
        }),
    });

    // чтобы токен всегда был актуальный
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;

      console.log(
        "[REQUEST]",
        config.method?.toUpperCase(),
        config.baseURL + (config.url || ""),
        "params:",
        config.params,
      );

      return config;
    });
  }

  extractErrorMessage(error, fallbackMessage) {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.title ||
      fallbackMessage
    );
  }

  toUtcString(localValue) {
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async GetRequests(pageNumber, pageSize, filters = {}) {
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      if (filters.minCreatedAt) {
        const utc = this.toUtcString(filters.minCreatedAt);
        if (utc) params.MinDateCreated = utc;
      }

      if (filters.maxCreatedAt) {
        const utc = this.toUtcString(filters.maxCreatedAt);
        if (utc) params.MaxDateCreated = utc;
      }

      if (Array.isArray(filters.priorities) && filters.priorities.length > 0) {
        params.Priorities = filters.priorities;
      }

      if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
        params.Statuses = filters.statuses;
      }

      if (filters.buildingId) params.BuildingId = filters.buildingId;
      if (filters.floorId) params.FloorId = filters.floorId;
      if (filters.locationId) params.LocationId = filters.locationId;

      if (typeof filters.sort === "string" && filters.sort.trim().length > 0) {
        params.OrderBy = filters.sort.trim();
      }

      const response = await this.api.get("", { params });

      let paginationMeta = null;
      const paginationHeader = response.headers["x-pagination"];
      if (paginationHeader) {
        try {
          paginationMeta = JSON.parse(paginationHeader);
        } catch (e) {
          console.error("Pagination parse error:", e);
        }
      }

      return {
        success: true,
        data: response.data || [],
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error("GetRequests Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(error, "Ошибка загрузки заявок"),
        data: [],
        pagination: null,
      };
    }
  }

  // NEW: поиск заявки по номеру
  // GET /api/requests/numbers/{number}
  async GetRequestByNumber(number) {
    try {
      const response = await this.api.get(`/numbers/${number}`);

      return {
        success: true,
        data: response.data || null,
      };
    } catch (error) {
      console.error("GetRequestByNumber Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(error, "Заявка не найдена"),
        data: null,
      };
    }
  }
}

export default RequestServerApi;
