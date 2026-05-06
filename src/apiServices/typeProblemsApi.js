import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class TypeOfProblemServerApi {
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

  SetAccessToken(token) {
    this.api.defaults.headers.Authorization = token ? `Bearer ${token}` : "";
  }

  _errorMessage(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.Message ||
      error?.response?.data?.error ||
      error?.response?.data?.Error ||
      error?.message ||
      fallback
    );
  }

  _parsePagination(response) {
    const paginationHeader = response.headers?.["x-pagination"];
    if (!paginationHeader) return null;

    try {
      return JSON.parse(paginationHeader);
    } catch (e) {
      console.error("Ошибка парсинга x-pagination:", e);
      return null;
    }
  }

  async GetProblemTypes(pageNumber = 1, pageSize = 10) {
    try {
      const response = await this.api.get("", {
        params: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      });

      return {
        success: true,
        data: response.data || [],
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      const message = this._errorMessage(
        error,
        "Не удалось загрузить типы проблем",
      );

      console.error("Ошибка при получении типов проблем:", message);

      return {
        success: false,
        data: [],
        pagination: null,
        statusCode: error?.response?.status || 500,
        message,
      };
    }
  }

  async GetProblemTypeById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const message = this._errorMessage(
        error,
        "Не удалось загрузить тип проблемы",
      );

      console.error("Ошибка при получении типа проблемы:", message);

      return {
        success: false,
        data: null,
        statusCode: error?.response?.status || 500,
        message,
      };
    }
  }

  async CreateProblemType(dto) {
    try {
      const response = await this.api.post("", dto);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const message = this._errorMessage(
        error,
        "Не удалось создать тип проблемы",
      );

      console.error("Ошибка при создании типа проблемы:", message);

      return {
        success: false,
        statusCode: error?.response?.status || 500,
        message,
      };
    }
  }

  async UpdateProblemType(id, dto) {
    try {
      const response = await this.api.put(`/${id}`, dto);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const message = this._errorMessage(
        error,
        "Не удалось обновить тип проблемы",
      );

      console.error("Ошибка при обновлении типа проблемы:", message);

      return {
        success: false,
        statusCode: error?.response?.status || 500,
        message,
      };
    }
  }

  async DeleteProblemType(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const message = this._errorMessage(
        error,
        "Не удалось удалить тип проблемы",
      );

      console.error("Ошибка при удалении типа проблемы:", message);

      return {
        success: false,
        statusCode: error?.response?.status || 500,
        message,
      };
    }
  }

  async GetEmployeesByProblemType(id) {
    try {
      const response = await this.api.get(`/${id}/employees`);
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      const message = this._errorMessage(
        error,
        "Не удалось загрузить сотрудников по типу проблемы",
      );

      console.error("Ошибка при получении сотрудников типа проблемы:", message);

      return {
        success: false,
        data: [],
        statusCode: error?.response?.status || 500,
        message,
      };
    }
  }
}

export default TypeOfProblemServerApi;
