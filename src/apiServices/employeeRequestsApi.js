// src/apiServices/employeeRequestsApi.js
import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class EmployeeRequestsServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/requests`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Получить сотрудников, назначенных на заявку
  async GetEmployeesForRequest(requestId, pageNumber, pageSize) {
    try {
      const response = await this.api.get(`/${requestId}/employees`, {
        params: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      });

      let paginationMeta = null;
      const paginationHeader = response.headers["x-pagination"];

      if (paginationHeader) {
        try {
          paginationMeta = JSON.parse(paginationHeader);
        } catch (e) {
          console.error("Ошибка парсинга заголовка x-pagination:", e);
        }
      }

      return {
        success: true,
        employees: response.data, // массив назначений
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error("EmployeeRequestsServerApi Error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Ошибка получения назначенных сотрудников";

      return {
        success: false,
        message: errorMessage,
        employees: [],
        pagination: null,
      };
    }
  }

  // Назначить заявку сотруднику
  async AssignEmployeeToRequest(requestId, employeeId, assignmentStatus) {
    try {
      const response = await this.api.post(
        `/${requestId}/employees/${employeeId}`,
        {
          assignmentStatus, // строка, как в Swagger
        },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("AssignEmployeeToRequest Error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Ошибка назначения сотрудника на заявку";

      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

export default EmployeeRequestsServerApi;
