import axios from "axios";
import { data } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class UserServerApi {
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

  async updateUser(id, userData) {
    try {
      const response = await this.api.put(`/${id}`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Ошибка обновления:", error);

      // Достаем текст ошибки из JSON, который прислал сервер
      let message =
        error.response?.data?.Message ||
        error.response?.data?.message ||
        "Ошибка обновления данных";

      return {
        success: false,
        message: message,
      };
    }
  }

  async activateUser(id) {
    try {
      await this.api.patch(`/${id}/activate`);

      return { success: true };
    } catch (error) {
      console.error("Ошибка при активации пользователя:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Не удалось активировать пользователя",
      };
    }
  }

  async deactivateUser(id) {
    try {
      await this.api.patch(`/${id}/deactivate`);

      return { success: true };
    } catch (error) {
      console.error("Ошибка при деактивации пользователя:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Не удалось заблокировать пользователя",
      };
    }
  }

  async deleteUser(id) {
    try {
      await this.api.delete(`/${id}`);

      return { success: true };
    } catch (error) {
      console.log(error.response);
      console.error("Ошибка при удалении пользователя:", error);
      return {
        success: false,
        message:
          error.response?.data?.Message || "Не удалось удалить пользователя",
      };
    }
  }

  async getMyProfile() {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Токен не найден. Пользователь не авторизован.");
      }

      // Декодируем токен, чтобы получить ID пользователя
      const decoded = jwtDecode(token);

      // Извлекаем ID из стандартного Claim NameIdentifier
      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      if (!userId) {
        throw new Error("Не удалось получить ID пользователя из токена.");
      }

      // Выполняем запрос к API.
      // Предполагается, что this.api - это настроенный axios instance с baseURL = /api/users
      const response = await this.api.get(`/${userId}`);

      console.log(response.data);

      return {
        success: true,
        data: response.data, // Возвращаем данные профиля
      };
    } catch (error) {
      console.error("Ошибка при получении профиля:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Ошибка загрузки профиля";

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // async loginUser(email, password) {
  //   try {
  //     const response = await this.api.post("/login", {
  //       Email: email,
  //       Password: password,
  //     });

  //     return {
  //       success: true,
  //       message: "Вход выполнен успешно",
  //       data: response.data, // Возвращаем данные для использования
  //     };
  //   } catch (error) {
  //     const errorMessage = error.response
  //       ? error.response.data.message || "Ошибка при входе"
  //       : "Произошла ошибка сервера";

  //     return {
  //       success: false,
  //       message: errorMessage,
  //       error, // Возвращаем объект ошибки, если нужно
  //     };
  //   }
  // }

  // async forgotPassword(email) {
  //   try {
  //     const response = await this.api.post("/forgot-password", {
  //       email: email,
  //     });

  //     return {
  //       success: true,
  //       message:
  //         response.data.message ||
  //         "Инструкции по сбросу пароля отправлены на вашу почту.",
  //     };
  //   } catch (error) {
  //     const errorMessage = error.response
  //       ? error.response.data.message || "Ошибка при запросе на сброс пароля"
  //       : "Произошла ошибка сервера";

  //     return {
  //       success: false,
  //       message: errorMessage,
  //       error, // Возвращаем объект ошибки, если нужно
  //     };
  //   }
  // }

  // async addPerson(userDetails) {
  //   try {
  //     const response = await this.api.post("/", {
  //       FirstName: userDetails.firstName,
  //       SecondName: userDetails.secondName,
  //       LastName: userDetails.lastName,
  //       Email: userDetails.email,
  //       PhoneNumber: userDetails.phone,
  //       Role: userDetails.role,
  //     });

  //     return {
  //       success: true,
  //       message: "Пользователь зарегистрирован!!!!",
  //       data: response.data, // Возвращаем данные
  //     };
  //   } catch (error) {
  //     const errorMessage = error.response
  //       ? "Ошибка регистрации"
  //       : "Произошла ошибка";

  //     return {
  //       success: false,
  //       message: errorMessage,
  //       error, // Возвращаем объект ошибки, если нужно
  //     };
  //   }
  // }

  // async updateUser(email, phone, photoPath, secondName) {
  //   try {
  //     // Создаем экземпляр FormData
  //     const formData = new FormData();
  //     formData.append("Email", email);
  //     formData.append("PhoneNumber", phone);
  //     formData.append("photo", photoPath);
  //     formData.append("SecondName", secondName);

  //     const response = await this.api.patch("/update", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     return {
  //       success: true,
  //       data: response.data,
  //     };
  //   } catch (error) {
  //     const errorMessage = error.response
  //       ? error.response.data.message || "Ошибка обновления данных"
  //       : "Произошла ошибка";

  //     return {
  //       success: false,
  //       message: errorMessage,
  //       error,
  //     };
  //   }
  // }

  // Внутри класса UserApi

  async getUsersWithPagination(pageNumber = 1, pageSize = 10, filters = {}) {
    try {
      const params = { PageNumber: pageNumber, PageSize: pageSize };

      // bool?
      if (filters.isBlocked !== undefined && filters.isBlocked !== null)
        params.isBlocked = filters.isBlocked;

      if (
        filters.emailConfirmed !== undefined &&
        filters.emailConfirmed !== null
      )
        params.emailConfirmed = filters.emailConfirmed;

      if (filters.hasEmployee !== undefined && filters.hasEmployee !== null)
        params.hasEmployee = filters.hasEmployee;

      if (filters.hasTgUser !== undefined && filters.hasTgUser !== null)
        params.hasTgUser = filters.hasTgUser;

      // string?
      if (filters.Email) params.Email = filters.Email;
      if (filters.PhoneNumber) params.PhoneNumber = filters.PhoneNumber;
      if (filters.SecondName) params.SecondName = filters.SecondName;

      // dates
      if (filters.CreatedFrom) params.CreatedFrom = filters.CreatedFrom;
      if (filters.CreatedTo) params.CreatedTo = filters.CreatedTo;

      // sort (RequestParameters.OrderBy)
      if (filters.OrderBy) params.OrderBy = filters.OrderBy;

      const response = await this.api.get("", { params });

      // ====== parse X-Pagination ======
      let pagination = null;
      const header = response?.headers?.["x-pagination"];
      if (header) {
        try {
          pagination = JSON.parse(header);
        } catch (e) {
          console.error("Ошибка парсинга x-pagination:", e);
        }
      }

      return {
        success: true,
        users: response.data || [],
        pagination,
      };
    } catch (error) {
      console.error("getUsersWithPagination error:", error);
      return {
        success: false,
        users: [],
        pagination: null,
        message:
          error?.response?.data?.message ||
          error?.response?.data?.title ||
          "Не удалось загрузить пользователей",
      };
    }
  }

  async addTelegram(chatId) {
    try {
      const response = await this.api.post("/addChatIdTg", {
        chatId: chatId,
      });

      return {
        success: true,
        message: response.message,
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

  async getPDFReport() {
    try {
      console.log("Запрос на получение PDF...");
      const response = await this.api.get(`/generatePdf`, {
        responseType: "blob",
      });
      console.log(response);

      return response; // Возвращаем ответ
    } catch (error) {
      let errorMessage;
      if (error.response) {
        errorMessage = "Ошибка скачивания билета";
      } else {
        errorMessage = "Произошла ошибка";
      }
      console.error(errorMessage);
      throw new Error(errorMessage); // Пробрасываем ошибку
    }
  }
}

export default UserServerApi;
