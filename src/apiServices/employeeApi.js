import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class EmployeeServerApi {
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

  async GetEmployees(pageNumber, pageSize) {
    try {
      const response = await this.api.get("", {
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
        employees: response.data,
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error("EmployeeApi Error:", error);

      const errorMessage =
        error.response?.data?.message || "Ошибка получения сотрудников";

      return {
        success: false,
        message: errorMessage,
        employees: [],
        pagination: null,
      };
    }
  }

  async GetRequestsForEmployee(employeeId, pageNumber = 1, pageSize = 50) {
    try {
      const response = await this.api.get(`/${employeeId}/requests`, {
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
        requests: response.data,
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error("GetRequestsForEmployee Error:", error);

      const errorMessage =
        error.response?.data?.message || "Ошибка получения заявок сотрудника";

      return {
        success: false,
        message: errorMessage,
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

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("UpdateEmployeeAvailability Error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Не удалось обновить доступность сотрудника",
      };
    }
  }

  async UpdateCurrentBuilding(employeeId, buildingId) {
    try {
      const response = await this.api.patch(
        `/${employeeId}/current-building/${buildingId}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("UpdateCurrentBuilding Error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Не удалось обновить текущее здание сотрудника",
      };
    }
  }

  async UpdateDefaultBuilding(employeeId, buildingId) {
    try {
      const response = await this.api.patch(
        `/${employeeId}/default-building/${buildingId}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("UpdateDefaultBuilding Error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Не удалось обновить здание по умолчанию",
      };
    }
  }

  async GetEmployeeById(employeeId) {
    try {
      console.log("strtrstrtrrtsr");
      const response = await this.api.get(`/${employeeId}`);
      console.log(response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("GetEmployeeById Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Ошибка получения сотрудника",
        data: null,
      };
    }
  }
}

export default EmployeeServerApi;
