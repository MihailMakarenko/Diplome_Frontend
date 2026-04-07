import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class UserTelegramApi {
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

  getCurrentUserId() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Токен не найден. Пользователь не авторизован.");
    }

    const decoded = jwtDecode(token);

    const userId =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    if (!userId) {
      throw new Error("Не удалось получить ID пользователя из токена.");
    }

    return userId;
  }

  async connectTelegram(chatId) {
    try {
      const userId = this.getCurrentUserId();

      const response = await this.api.post(`/${userId}/telegram/connection`, {
        chatId,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при подключении Telegram:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.Message ||
          "Не удалось подключить Telegram",
      };
    }
  }

  async deleteTelegramConnection(chatId) {
    try {
      const userId = this.getCurrentUserId();

      await this.api.delete(`/${userId}/telegram/${chatId}/delete`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Ошибка при удалении Telegram:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.Message ||
          "Не удалось удалить привязку Telegram",
      };
    }
  }
}

export default UserTelegramApi;
