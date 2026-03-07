import axios from "axios";
import { data } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class typeOfProblemServerApi {
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

  // Получение заявок текущего пользователя
  async GetProblemTypes() {
    try {
      const response = await this.api.get();
      console.log(response.data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при получении типов проблем:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Не удалось загрузить типы проблем",
      };
    }
  }
}

export default typeOfProblemServerApi;
