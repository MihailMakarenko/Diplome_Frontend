import axios from "axios";
import { data } from "react-router-dom";
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

  // Получение заявок пользователя с пагинацией и сортировкой
  async GetRequestsForUser(pageNumber, pageSize, sortOrder) {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Токен не найден.");

      // Получаем ID пользователя из токена (или передаем аргументом, если нужно)
      const decoded = jwtDecode(token);
      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      // Формируем параметры запроса
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      // Если передана строка сортировки (например "createAt desc"), добавляем её
      if (sortOrder) {
        params.OrderBy = sortOrder;
      }

      // Запрос к API
      // Путь может отличаться: /api/users/{id}/requests или /api/requests/my
      const response = await this.api.get(`/${userId}/requests`, { params });
      console.log(response);
      // Парсинг заголовка пагинации
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

  // Создание заявки для текущего пользователя
  // requestData: { description, priority, status, typeOfProblemId, locationId }
  async CreateRequestForUser(requestData) {
    try {
      // Лог для проверки (покажет содержимое FormData)

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Токен не найден.");

      const decoded = jwtDecode(token);
      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      if (!userId) throw new Error("Не удалось получить ID пользователя.");

      // ИСПРАВЛЕНИЕ: Передаем requestData (FormData) напрямую
      const response = await this.api.post(`/${userId}/requests`, requestData, {
        headers: {
          // Важно для FormData: даем axios самому выставить Content-Type
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

  // Получение заявок пользователя с пагинацией и сортировкой
  async GetRequests(pageNumber, pageSize, sortOrder) {
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      // Если передана строка сортировки (например "createAt desc"), добавляем её
      if (sortOrder) {
        params.OrderBy = sortOrder;
      }

      // Запрос к API
      // Путь может отличаться: /api/users/{id}/requests или /api/requests/my
      const response = await this.api.get(`/requests`, { params });

      // Парсинг заголовка пагинации
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
