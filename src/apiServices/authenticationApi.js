import axios from "axios";
import { data } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class UserServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/authentication`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Регистрация пользователя
  // userData приходит из RegistrationModal
  async registerUser(userData) {
    try {
      const formData = new FormData();

      formData.append("FirstName", userData.firstName);
      formData.append("LastName", userData.lastName);
      formData.append("SecondName", userData.secondName);

      formData.append("Email", userData.email);
      formData.append("PhoneNumber", userData.phone);

      formData.append("Roles", userData.role);

      // Фото (IFormFile)
      if (userData.photo) {
        formData.append("Photo", userData.photo);
      }

      const response = await this.api.post("", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, message: response.data };
    } catch (error) {
      console.error("Registration Error:", error);

      let errorMessage = "Ошибка при регистрации";

      if (error.response && error.response.data) {
        const data = error.response.data;

        if (typeof data === "object") {
          const messages = Object.values(data).flat();
          if (messages.length > 0) {
            errorMessage = messages.join(", ");
          }
        } else {
          errorMessage = data;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async loginUser(email, password) {
    try {
      const response = await this.api.post("/login", {
        Email: email,
        Password: password,
      });
      const token = response.data;

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshTokenToken", response.data.refreshToken);

      const decoded = jwtDecode(token.accessToken);
      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      localStorage.setItem("userId", userId);

      return {
        success: true,
        message: "Вход выполнен успешно",
        data: response.data, // Возвращаем данные для использования
      };
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message || "Ошибка при входе"
        : "Произошла ошибка сервера";

      return {
        success: false,
        message: errorMessage,
        error, // Возвращаем объект ошибки, если нужно
      };
    }
  }
}

export default UserServerApi;
