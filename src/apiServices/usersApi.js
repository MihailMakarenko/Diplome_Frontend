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

  // Деактивация пользователя (Блокировка)
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

  // Получение профиля текущего пользователя
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

  async getUsersWithPagination(pageNumber, pageSize) {
    try {
      // Используем params для автоматического кодирования URL (более надежно)
      const response = await this.api.get("", {
        params: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      });

      // 1. Пытаемся достать и распарсить заголовок пагинации
      let paginationMeta = null;
      const paginationHeader = response.headers["x-pagination"];

      if (paginationHeader) {
        try {
          paginationMeta = JSON.parse(paginationHeader);
        } catch (e) {
          console.error("Ошибка парсинга заголовка x-pagination:", e);
        }
      }

      // 2. Возвращаем чистый нормализованный объект
      return {
        success: true,
        users: response.data, // Сами данные
        pagination: paginationMeta, // Объект пагинации или null
      };
    } catch (error) {
      console.error("UserApi Error:", error);

      const errorMessage =
        error.response?.data?.message || "Ошибка получения пользователей";

      return {
        success: false,
        message: errorMessage,
        users: [],
        pagination: null,
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

  // async getPDFUserHistory(userId) {
  //   try {
  //     console.log(`Запрос PDF истории для пользователя ${userId}...`);

  //     const response = await this.api.get(`/generateUserHistoryPdf/${userId}`, {
  //       responseType: "blob", // Используем blob для PDF
  //       headers: {
  //         Accept: "application/pdf",
  //       },
  //     });

  //     if (response.status !== 200) {
  //       throw new Error(`Ошибка сервера: статус ${response.status}`);
  //     }

  //     console.log("PDF успешно получен");
  //     return response.data; // Возвращаем blob
  //   } catch (error) {
  //     let errorMessage = "Произошла ошибка";

  //     if (error.response) {
  //       switch (error.response.status) {
  //         case 400:
  //           errorMessage =
  //             "Неверный запрос: ID пользователя должен быть числом";
  //           break;
  //         case 404:
  //           errorMessage = "Пользователь не найден";
  //           break;
  //         case 500:
  //           errorMessage = "Ошибка генерации отчета на сервере";
  //           break;
  //         default:
  //           errorMessage = `Ошибка сервера: статус ${error.response.status}`;
  //       }
  //     } else if (error.request) {
  //       errorMessage = "Нет ответа от сервера";
  //     } else {
  //       errorMessage = error.message;
  //     }

  //     console.error("Ошибка при получении PDF:", errorMessage);
  //     throw new Error(errorMessage);
  //   }
  // }

  // async deactivateUser(userId) {
  //   try {
  //     console.log(`Запрос PDF истории для пользователя ${userId}...`);

  //     const response = await this.api.patch(`/deactivateUser/${userId}`);

  //     if (response.status !== 200) {
  //       throw new Error(`Ошибка сервера: статус ${response.status}`);
  //     }
  //     return response.data; // Возвращаем blob
  //   } catch (error) {
  //     let errorMessage = "Произошла ошибка";

  //     if (error.response) {
  //       switch (error.response.status) {
  //         case 400:
  //           errorMessage =
  //             "Неверный запрос: ID пользователя должен быть числом";
  //           break;
  //         case 404:
  //           errorMessage = "Пользователь не найден";
  //           break;
  //         case 500:
  //           errorMessage = "Ошибка генерации отчета на сервере";
  //           break;
  //         default:
  //           errorMessage = `Ошибка сервера: статус ${error.response.status}`;
  //       }
  //     } else if (error.request) {
  //       errorMessage = "Нет ответа от сервера";
  //     } else {
  //       errorMessage = error.message;
  //     }

  //     console.error("Ошибка при получении PDF:", errorMessage);
  //     throw new Error(errorMessage);
  //   }
  // }

  // async deleteNotActivatedUsers() {
  //   try {
  //     console.log("Запрос на удаление неактивированных пользователей...");

  //     // Отправляем DELETE запрос на сервер
  //     const response = await this.api.delete("/not-activated");

  //     if (response.status !== 200) {
  //       throw new Error(`Ошибка сервера: статус ${response.status}`);
  //     }

  //     // Успешное удаление
  //     console.log("Пользователи удалены", response.data);
  //     return response.data;
  //   } catch (error) {
  //     let errorMessage = "Произошла ошибка при удалении пользователей";

  //     // Обработка различных ошибок
  //     if (error.response) {
  //       switch (error.response.status) {
  //         case 401:
  //           errorMessage = "Требуется авторизация";
  //           break;
  //         case 403:
  //           errorMessage = "Недостаточно прав для выполнения операции";
  //           break;
  //         case 404:
  //           errorMessage = "Нет пользователей для удаления";
  //           break;
  //         case 500:
  //           errorMessage = "Ошибка на сервере при удалении пользователей";
  //           break;
  //         default:
  //           errorMessage = `Ошибка сервера: ${error.response.status}`;
  //       }
  //     } else if (error.request) {
  //       errorMessage = "Сервер не отвечает";
  //     } else {
  //       errorMessage = error.message;
  //     }

  //     console.error("Ошибка удаления:", errorMessage);
  //     throw new Error(errorMessage);
  //   }
  // }
}

export default UserServerApi;
