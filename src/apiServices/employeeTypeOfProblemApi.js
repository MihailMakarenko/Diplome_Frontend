import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5035/api";

class EmployeeTypeOfProblemServerApi {
  constructor() {
    this.baseUrl = baseUrl;

    this.api = axios.create({
      baseURL: this.baseUrl,
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
    return (
      error?.response?.data?.message ||
      error?.response?.data?.title ||
      fallbackMessage
    );
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

  // Назначенные типы проблем сотрудника (пагинация)
  async getEmployeeProblemTypes(employeeId, pageNumber = 1, pageSize = 3) {
    try {
      const response = await this.api.get(
        `/employees/${employeeId}/problem-types`,
        {
          params: {
            PageNumber: pageNumber,
            PageSize: pageSize,
          },
        },
      );

      return {
        success: true,
        data: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("getEmployeeProblemTypes Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения назначенных типов проблем сотрудника",
        ),
        data: [],
        pagination: null,
      };
    }
  }

  // Доступные для назначения типы проблем (пагинация)
  // GET /api/problem-types/assignable?employeeId=...&PageNumber=...&PageSize=...
  async getAssignableProblemTypes(employeeId, pageNumber = 1, pageSize = 20) {
    try {
      const response = await this.api.get(`/problem-types/assignable`, {
        params: {
          employeeId,
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      });

      return {
        success: true,
        data: response.data || [],
        pagination: this.parsePagination(response),
      };
    } catch (error) {
      console.error("getAssignableProblemTypes Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения доступных типов проблем",
        ),
        data: [],
        pagination: null,
      };
    }
  }

  async assignProblemType(employeeId, typeOfProblemId, payload) {
    try {
      const response = await this.api.post(
        `/employees/${employeeId}/problem-types/${typeOfProblemId}`,
        payload,
      );

      return {
        success: true,
        data: response.data || null,
      };
    } catch (error) {
      console.error("assignProblemType Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка назначения типа проблемы сотруднику",
        ),
      };
    }
  }

  async deleteEmployeeProblemType(employeeId, typeOfProblemId, assignmentId) {
    try {
      const response = await this.api.delete(
        `/employees/${employeeId}/problem-types/${typeOfProblemId}/${assignmentId}`,
      );

      return {
        success: true,
        data: response.data || null,
      };
    } catch (error) {
      console.error("deleteEmployeeProblemType Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка удаления типа проблемы у сотрудника",
        ),
      };
    }
  }

  async GetEmployees(problemId, pageNumber, pageSize) {
    try {
      const response = await this.api.get(
        `/problem-types/${problemId}/employees`,
        {
          params: {
            PageNumber: pageNumber,
            PageSize: pageSize,
          },
        },
      );

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
          "Ошибка получения сотрудников для типа проблемы",
        ),
        employees: [],
        pagination: null,
      };
    }
  }
}

export default EmployeeTypeOfProblemServerApi;
