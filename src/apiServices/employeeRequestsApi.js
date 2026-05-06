import axios from "axios";
import qs from "qs";

const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5035/api";

class EmployeeRequestsServerApi {
  constructor() {
    this.api = axios.create({
      baseURL: baseUrl,
      headers: { "Content-Type": "application/json" },
    });

    // токен всегда актуальный
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
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

  parsePagination(response) {
    const paginationHeader = response?.headers?.["x-pagination"];
    if (!paginationHeader) return null;

    try {
      return JSON.parse(paginationHeader);
    } catch (e) {
      console.error("Ошибка парсинга заголовка x-pagination:", e);
      return null;
    }
  }

  // ===== ASSIGNABLE (доступные) =====
  // GET /api/employees/{employeeId}/requests/assignable
  async GetAssignableRequestsForEmployee(
    employeeId,
    pageNumber = 1,
    pageSize = 6,
    filters = {},
  ) {
    try {
      const params = {
        employeeId,
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      if (filters.minCreatedAt) params.MinCreatedAt = filters.minCreatedAt;
      if (filters.maxCreatedAt) params.MaxCreatedAt = filters.maxCreatedAt;

      if (Array.isArray(filters.priorities) && filters.priorities.length > 0)
        params.Priorities = filters.priorities;

      if (Array.isArray(filters.statuses) && filters.statuses.length > 0)
        params.Statuses = filters.statuses;

      if (filters.buildingId) params.BuildingId = filters.buildingId;
      if (filters.floorId) params.FloorId = filters.floorId;
      if (filters.locationId) params.LocationId = filters.locationId;

      if (filters.sort) params.OrderBy = filters.sort;

      const response = await this.api.get(
        `/employees/${employeeId}/requests/assignable`,
        {
          params,
          paramsSerializer: (p) =>
            qs.stringify(p, { arrayFormat: "repeat", skipNulls: true }),
        },
      );

      return {
        success: true,
        data: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("GetAssignableRequestsForEmployee Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения доступных заявок для сотрудника",
        ),
        data: [],
        pagination: null,
      };
    }
  }

  // ===== ASSIGNED (назначенные) =====
  // GET /api/employees/{employeeId}/requests
  async GetAssignedRequestsForEmployee(
    employeeId,
    pageNumber = 1,
    pageSize = 6,
    filters = {},
  ) {
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      // даты (у вас в разных местах встречались оба нейминга — оставим оба)
      if (filters.minCreatedAt) {
        params.MinCreatedAt = filters.minCreatedAt;
        params.MinDateCreated = filters.minCreatedAt;
      }

      if (filters.maxCreatedAt) {
        params.MaxCreatedAt = filters.maxCreatedAt;
        params.MaxDateCreated = filters.maxCreatedAt;
      }

      if (Array.isArray(filters.priorities) && filters.priorities.length > 0)
        params.Priorities = filters.priorities;

      if (Array.isArray(filters.statuses) && filters.statuses.length > 0)
        params.Statuses = filters.statuses;

      if (filters.buildingId) params.BuildingId = filters.buildingId;
      if (filters.floorId) params.FloorId = filters.floorId;
      if (filters.locationId) params.LocationId = filters.locationId;

      if (filters.sort) params.OrderBy = filters.sort;

      const response = await this.api.get(`/employees/${employeeId}/requests`, {
        params,
        paramsSerializer: (p) =>
          qs.stringify(p, { arrayFormat: "repeat", skipNulls: true }),
      });

      return {
        success: true,
        data: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("GetAssignedRequestsForEmployee Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения назначенных заявок сотрудника",
        ),
        data: [],
        pagination: null,
      };
    }
  }

  // GET /api/employees/{employeeId}/requests/{number}/assignable
  async GetAssignableRequestByNumber(employeeId, number) {
    try {
      const response = await this.api.get(
        `/employees/${employeeId}/requests/${number}/assignable`,
      );

      return {
        success: true,
        data: response.data || null,
      };
    } catch (error) {
      console.error("GetAssignableRequestByNumber Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Заявка не найдена или недоступна для сотрудника",
        ),
        data: null,
      };
    }
  }

  // GET /api/requests/{requestId}/employees
  async GetEmployeesForRequest(requestId, pageNumber = 1, pageSize = 10) {
    try {
      const response = await this.api.get(`/requests/${requestId}/employees`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      return {
        success: true,
        employees: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("GetEmployeesForRequest Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения назначенных сотрудников",
        ),
        employees: [],
        pagination: null,
      };
    }
  }

  // POST /api/requests/{requestId}/employees/{employeeId}
  async AssignEmployeeToRequest(requestId, employeeId, assignmentStatus) {
    try {
      const response = await this.api.post(
        `/requests/${requestId}/employees/${employeeId}`,
        { assignmentStatus },
      );

      return {
        success: true,
        data: response.data || null,
      };
    } catch (error) {
      console.error("AssignEmployeeToRequest Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка назначения сотрудника на заявку",
        ),
      };
    }
  }

  // DELETE /api/requests/{requestId}/employees/{employeeId}/{id}
  async RemoveEmployeeFromRequest(requestId, employeeId, assignmentId) {
    try {
      const response = await this.api.delete(
        `/requests/${requestId}/employees/${employeeId}/${assignmentId}`,
      );

      return {
        success: true,
        data: response.data || null,
      };
    } catch (error) {
      console.error("RemoveEmployeeFromRequest Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка удаления сотрудника с заявки",
        ),
      };
    }
  }
}

export default EmployeeRequestsServerApi;
