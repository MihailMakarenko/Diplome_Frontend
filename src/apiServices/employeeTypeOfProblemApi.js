// src/apiServices/employeeTypeOfProblemApi.js
import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class EmployeeTypeOfProblemServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/problem-types`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  async GetEmployees(problemId, pageNumber, pageSize) {
    try {
      const response = await this.api.get(`/${problemId}/employees`, {
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
        employees: response.data, // массив EmployeeTypeOfProblem
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error("EmployeeTypeOfProblemApi Error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Ошибка получения сотрудников для типа проблемы";

      return {
        success: false,
        message: errorMessage,
        employees: [],
        pagination: null,
      };
    }
  }
}

export default EmployeeTypeOfProblemServerApi;
