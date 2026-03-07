import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class commentsServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/requests`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        // Убираем Content-Type по умолчанию, так как для multipart/form-data
        // axios должен сам выставить boundary, если передать FormData
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Добавление комментария к заявке
  async AddCommentForRequest(requestId, text) {
    try {
      const response = await this.api.post(`/${requestId}/comments`, {
        Text: text,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при добавлении комментария:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Не удалось добавить комментарий",
      };
    }
  }

  // Получение комментариев к заявке
  async GetCommentsForRequest(requestId) {
    try {
      const response = await this.api.get(`/${requestId}/comments`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при получении комментариев:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Не удалось загрузить комментарии",
      };
    }
  }
}

export default commentsServerApi;
