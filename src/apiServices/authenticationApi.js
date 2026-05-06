import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class UserServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/authentication`;

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: { "Content-Type": "application/json" },
    });

    // Всегда подставляем актуальный accessToken из localStorage
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      else delete config.headers.Authorization;
      return config;
    });
  }

  extractErrorMessage(error, fallbackMessage) {
    const data = error?.response?.data;
    if (!data) return fallbackMessage;

    if (typeof data === "string") return data;

    if (data.message) return data.message;
    if (data.Message) return data.Message;

    if (data.title) return data.title;
    if (data.Title) return data.Title;

    if (data.detail) return data.detail;
    if (data.Detail) return data.Detail;

    if (data.errors && typeof data.errors === "object") {
      const all = Object.values(data.errors).flat();
      if (all.length > 0) return all.join(" ");
    }

    try {
      return JSON.stringify(data);
    } catch {
      return fallbackMessage;
    }
  }

  // Регистрация пользователя
  async registerUser(userData) {
    try {
      const formData = new FormData();

      formData.append("FirstName", userData.firstName);
      formData.append("LastName", userData.lastName);
      formData.append("SecondName", userData.secondName);

      formData.append("Email", userData.email);
      formData.append("PhoneNumber", userData.phone);

      formData.append("Roles", userData.role);

      if (userData.photo) {
        formData.append("Photo", userData.photo);
      }

      const response = await this.api.post("", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { success: true, message: response.data };
    } catch (error) {
      console.error("Registration Error:", error);

      return {
        success: false,
        message: this.extractErrorMessage(error, "Ошибка при регистрации"),
      };
    }
  }

  async loginUser(email, password) {
    try {
      const response = await this.api.post("/login", {
        Email: email,
        Password: password,
      });

      const tokenData = response.data;

      // сохраняем токены
      if (tokenData?.accessToken) {
        localStorage.setItem("accessToken", tokenData.accessToken);
      }
      if (tokenData?.refreshToken) {
        localStorage.setItem("refreshToken", tokenData.refreshToken);
      }

      // извлекаем нужные значения из accessToken
      if (tokenData?.accessToken) {
        const decoded = jwtDecode(tokenData.accessToken);

        const userId =
          decoded[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ];

        const employeeId = decoded.EmployeeId || null;

        if (userId) localStorage.setItem("userId", userId);

        if (employeeId) localStorage.setItem("employeeId", employeeId);
        else localStorage.removeItem("employeeId");
      }

      return {
        success: true,
        message: "Вход выполнен успешно",
        data: tokenData,
      };
    } catch (error) {
      return {
        success: false,
        message: this.extractErrorMessage(error, "Ошибка при входе"),
        error,
      };
    }
  }

  // === FORGOT PASSWORD ===
  // Backend: POST /api/authentication/forgotpassword?email=...
  async forgotPassword(email) {
    try {
      // ВАЖНО: у тебя на бэке параметр "email" не [FromBody],
      // поэтому отправляем его как query string.
      const response = await this.api.post("/forgotpassword", null, {
        params: { email },
      });

      // backend возвращает строку
      return {
        success: true,
        message: response.data || "Письмо для сброса пароля отправлено",
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: this.extractErrorMessage(
          error,
          "Ошибка восстановления пароля",
        ),
        error,
      };
    }
  }
}

export default UserServerApi;
