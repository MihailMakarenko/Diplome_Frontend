import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5035/api";

class EmployeeTypeOfProblemServerApi {
  constructor() {
    this.baseUrl = baseUrl;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
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

      let pagination = null;
      const paginationHeader = response.headers["x-pagination"];

      if (paginationHeader) {
        try {
          pagination = JSON.parse(paginationHeader);
        } catch (e) {
          console.error("Ошибка парсинга x-pagination:", e);
        }
      }

      return {
        success: true,
        data: response.data || [],
        pagination,
      };
    } catch (error) {
      console.error("getEmployeeProblemTypes Error:", error);

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.response?.data?.title ||
          "Ошибка получения назначенных типов проблем сотрудника",
        data: [],
        pagination: null,
      };
    }
  }

  async getAllProblemTypes() {
    try {
      const response = await this.api.get("/problem-types");

      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      console.error("getAllProblemTypes Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка получения всех типов проблем",
        ),
        data: [],
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
