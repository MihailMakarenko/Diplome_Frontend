import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class RequestForUesrServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/users`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Вспомогательный метод: получить id текущего пользователя из accessToken
  getCurrentUserId() {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Токен не найден.");

    const decoded = jwtDecode(token);
    const userId =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    if (!userId)
      throw new Error("Не удалось получить ID пользователя из токена.");

    return { token, userId };
  }

  // Получение заявок КОНКРЕТНОГО пользователя по его userId
  // userId: Guid, pageNumber, pageSize, sortOrder: "CreateAt desc" и т.п.
  async GetRequestsForUserById(userId, pageNumber, pageSize, sortOrder) {
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      if (sortOrder) {
        params.OrderBy = sortOrder;
      }

      const response = await this.api.get(`/${userId}/requests`, { params });

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
      console.error("GetRequestsForUserById Error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Ошибка загрузки заявок пользователя",
        data: [],
        pagination: null,
      };
    }
  }

  // Удобный метод: получить заявки ДЛЯ ТЕКУЩЕГО пользователя (по accessToken)
  async GetRequestsForUser(pageNumber, pageSize, sortOrder) {
    try {
      const { userId } = this.getCurrentUserId();

      return await this.GetRequestsForUserById(
        userId,
        pageNumber,
        pageSize,
        sortOrder,
      );
    } catch (error) {
      console.error("GetRequestsForUser Error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Ошибка загрузки заявок",
        data: [],
        pagination: null,
      };
    }
  }

  // Создание заявки для текущего пользователя
  // requestData: { description, priority, status, typeOfProblemId, locationId }
  async CreateRequestForUser(requestData) {
    try {
      const { token, userId } = this.getCurrentUserId();

      const response = await this.api.post(`/${userId}/requests`, requestData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось создать заявку",
      };
    }
  }

  // Получение всех заявок (возможно, для админа/менеджера), если такой эндпоинт есть
  async GetRequests(pageNumber, pageSize, sortOrder) {
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      if (sortOrder) {
        params.OrderBy = sortOrder;
      }

      // здесь базовый URL /users, поэтому /requests — это /users/requests,
      // если твой эндпоинт для всех заявок другой (например /api/requests),
      // этот метод лучше держать в отдельном RequestServerApi.
      const response = await this.api.get(`/requests`, { params });

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
      console.error("GetRequests Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Ошибка загрузки заявок",
        data: [],
        pagination: null,
      };
    }
  }
}

export default RequestForUesrServerApi;
