import axios from "axios";
import { data } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class RequestServerApi {
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
      console.log(params);

      // Запрос к API
      // Путь может отличаться: /api/users/{id}/requests или /api/requests/my
      const response = await this.api.get("", { params });
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
}

export default RequestServerApi;
