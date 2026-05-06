import axios from "axios";
import qs from "qs";

const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5035/api";

class EmployeeRequestsServerApi {
  constructor() {
    this.api = axios.create({
      baseURL: baseUrl,
      headers: { "Content-Type": "application/json" },
    });

    // чтобы токен всегда был актуальный
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  extractErrorMessage(error, fallbackMessage) {
    const data = error?.response?.data;

    if (!data) return fallbackMessage;

    // сервер мог вернуть строку
    if (typeof data === "string") return data;

    // часто у ASP.NET/твоего middleware бывает PascalCase
    if (data.message) return data.message;
    if (data.Message) return data.Message;

    if (data.title) return data.title;
    if (data.Title) return data.Title;

    if (data.detail) return data.detail;
    if (data.Detail) return data.Detail;

    // ModelState errors: { errors: { Field: ["msg"] } }
    if (data.errors && typeof data.errors === "object") {
      const all = Object.values(data.errors).flat();
      if (all.length > 0) return all.join(" ");
    }

    // если вообще непонятно что пришло
    try {
      return JSON.stringify(data);
    } catch {
      return fallbackMessage;
    }
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

  buildFilterParams(pageNumber, pageSize, filters = {}) {
    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
    };

    if (filters.minCreatedAt) {
      params.MinCreatedAt = filters.minCreatedAt;
      // на всякий случай (если где-то на бэке другое имя)
      params.MinDateCreated = filters.minCreatedAt;
    }

    if (filters.maxCreatedAt) {
      params.MaxCreatedAt = filters.maxCreatedAt;
      params.MaxDateCreated = filters.maxCreatedAt;
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

    if (filters.sort) params.OrderBy = filters.sort;

    return params;
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
      const params = this.buildFilterParams(pageNumber, pageSize, filters);

      // ВАЖНО: employeeId НЕ дублируем в query params (он уже в URL)
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
        status: error?.response?.status,
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
      const params = this.buildFilterParams(pageNumber, pageSize, filters);

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
        status: error?.response?.status,
      };
    }
  }

  // ===== COMPAT: методы под “старый” интерфейс компонента =====
  // чтобы не переписывать EmployeeProfile, если он вызывает GetMyAssignedRequests(...)
  async GetMyAssignedRequests(
    pageNumber = 1,
    pageSize = 6,
    filters = {},
    employeeId,
  ) {
    const id = employeeId || localStorage.getItem("employeeId");
    if (!id) {
      return {
        success: false,
        message: "employeeId не найден (ни в аргументах, ни в localStorage)",
        data: [],
        pagination: null,
      };
    }
    return this.GetAssignedRequestsForEmployee(
      id,
      pageNumber,
      pageSize,
      filters,
    );
  }

  async GetMyAssignableRequests(
    pageNumber = 1,
    pageSize = 6,
    filters = {},
    employeeId,
  ) {
    const id = employeeId || localStorage.getItem("employeeId");
    if (!id) {
      return {
        success: false,
        message: "employeeId не найден (ни в аргументах, ни в localStorage)",
        data: [],
        pagination: null,
      };
    }
    return this.GetAssignableRequestsForEmployee(
      id,
      pageNumber,
      pageSize,
      filters,
    );
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
        status: error?.response?.status,
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
        status: error?.response?.status,
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
        status: error?.response?.status,
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
        status: error?.response?.status,
      };
    }
  }
}

export default EmployeeRequestsServerApi;
