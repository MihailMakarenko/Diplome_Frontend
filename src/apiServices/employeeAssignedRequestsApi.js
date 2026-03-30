import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class EmployeeAssignedRequestsApi {
  constructor() {
    this.baseUrl = `${baseUrl}/employees`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  getCurrentUserId() {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Токен не найден.");

    const decoded = jwtDecode(token);
    const userId =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    if (!userId) {
      throw new Error("Не удалось получить ID пользователя из токена.");
    }

    return userId;
  }

  toUtcString(localDateTime) {
    if (!localDateTime) return null;

    try {
      const date = new Date(localDateTime);
      if (Number.isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch (error) {
      console.error("toUtcString error:", error);
      return null;
    }
  }

  buildQueryString(pageNumber, pageSize, filters = {}) {
    const employeeId = localStorage.getItem("employeeId");
    const params = new URLSearchParams();

    params.append("PageNumber", String(pageNumber));
    params.append("PageSize", String(pageSize));

    if (employeeId) {
      params.append("EmployeeId", employeeId);
    }

    if (filters.minCreatedAt) {
      const utc = this.toUtcString(filters.minCreatedAt);
      if (utc) params.append("MinDateCreated", utc);
    }

    if (filters.maxCreatedAt) {
      const utc = this.toUtcString(filters.maxCreatedAt);
      if (utc) params.append("MaxDateCreated", utc);
    }

    if (Array.isArray(filters.priorities) && filters.priorities.length > 0) {
      filters.priorities.forEach((priority) => {
        params.append("Priorities", priority);
      });
    }

    if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
      filters.statuses.forEach((status) => {
        params.append("Statuses", status);
      });
    }

    if (filters.buildingId) {
      params.append("BuildingId", filters.buildingId);
    }

    if (filters.floorId) {
      params.append("FloorId", filters.floorId);
    }

    if (filters.locationId) {
      params.append("LocationId", filters.locationId);
    }

    if (
      typeof filters.statusGroup === "string" &&
      filters.statusGroup.trim().length > 0
    ) {
      params.append("StatusGroup", filters.statusGroup.trim());
    }

    if (typeof filters.sort === "string" && filters.sort.trim().length > 0) {
      params.append("OrderBy", filters.sort.trim());
    }

    return {
      employeeId,
      queryString: params.toString(),
    };
  }

  async GetMyAssignedRequests(pageNumber, pageSize, filters = {}) {
    try {
      const { employeeId, queryString } = this.buildQueryString(
        pageNumber,
        pageSize,
        filters,
      );

      const url = `/${employeeId}/requests?${queryString}`;

      console.log("EMPLOYEE REQUEST FILTERS:", filters);
      console.log("EMPLOYEE REQUEST URL:", `${this.baseUrl}${url}`);

      const response = await this.api.get(url);

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
        data: response.data,
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error("GetMyAssignedRequests Error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Ошибка загрузки назначенных заявок",
        data: [],
        pagination: null,
      };
    }
  }

  async UpdateRequestStatus(requestId, status) {
    try {
      const employeeId = localStorage.getItem("employeeId");

      if (!employeeId) {
        return {
          success: false,
          message: "Не найден employeeId в localStorage",
        };
      }

      const response = await this.api.patch(
        `/${employeeId}/requests/${requestId}`,
        {
          status,
        },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("UpdateRequestStatus Error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Не удалось изменить статус заявки",
      };
    }
  }
}

export default EmployeeAssignedRequestsApi;
