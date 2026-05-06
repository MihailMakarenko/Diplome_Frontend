import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5035/api";

class EmployeeApi {
  constructor() {
    this.api = axios.create({
      baseURL: `${baseUrl}/employees`,
      headers: { "Content-Type": "application/json" },
    });

    // токен всегда актуальный
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  parsePagination(response) {
    const header = response?.headers?.["x-pagination"];
    if (!header) return null;
    try {
      return JSON.parse(header);
    } catch (e) {
      console.error("Ошибка парсинга x-pagination:", e);
      return null;
    }
  }

  extractErrorMessage(error, fallback) {
    return (
      error?.response?.data?.message || error?.response?.data?.title || fallback
    );
  }

  async GetEmployees(pageNumber = 1, pageSize = 20, filters = {}) {
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      // isAvailable
      if (filters.isAvailable !== undefined && filters.isAvailable !== null) {
        params.isAvailable = filters.isAvailable; // true/false
      }

      // isBlocked (NEW)
      if (filters.isBlocked !== undefined && filters.isBlocked !== null) {
        params.isBlocked = filters.isBlocked; // true/false
      }

      // TypeOfProblemId
      if (filters.typeOfProblemId) {
        params.TypeOfProblemId = filters.typeOfProblemId;
      }

      // Иерархия: разрешён только один из BuildingId/FloorId/LocationId
      if (filters.buildingId) params.BuildingId = filters.buildingId;
      if (filters.floorId) params.FloorId = filters.floorId;
      if (filters.locationId) params.LocationId = filters.locationId;

      // Поиск по фамилии (SecondName)
      if (filters.secondName && filters.secondName.trim().length > 0) {
        params.SecondName = filters.secondName.trim();
      }

      const response = await this.api.get("", { params });

      return {
        success: true,
        employees: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("GetEmployees Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения сотрудников",
        ),
        employees: [],
        pagination: null,
      };
    }
  }

  async GetRequestsForEmployee(employeeId, pageNumber = 1, pageSize = 50) {
    try {
      const response = await this.api.get(`/${employeeId}/requests`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      return {
        success: true,
        requests: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("GetRequestsForEmployee Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения заявок сотрудника",
        ),
        requests: [],
        pagination: null,
      };
    }
  }

  async UpdateEmployeeAvailability(employeeId, isAvailable) {
    try {
      const response = await this.api.patch(`/${employeeId}/availability`, {
        isAvailable,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("UpdateEmployeeAvailability Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Не удалось обновить доступность сотрудника",
        ),
      };
    }
  }

  async UpdateCurrentBuilding(employeeId, buildingId) {
    try {
      const response = await this.api.patch(
        `/${employeeId}/current-building/${buildingId}`,
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error("UpdateCurrentBuilding Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Не удалось обновить текущее здание сотрудника",
        ),
      };
    }
  }

  async UpdateDefaultBuilding(employeeId, buildingId) {
    try {
      const response = await this.api.patch(
        `/${employeeId}/default-building/${buildingId}`,
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error("UpdateDefaultBuilding Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Не удалось обновить здание по умолчанию",
        ),
      };
    }
  }

  async GetEmployeeById(employeeId) {
    try {
      const response = await this.api.get(`/${employeeId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("GetEmployeeById Error:", error);
      return {
        success: false,
        message: this.extractErrorMessage(error, "Ошибка получения сотрудника"),
        data: null,
      };
    }
  }
}

export default EmployeeApi;
