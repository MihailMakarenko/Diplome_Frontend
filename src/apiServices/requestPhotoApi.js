import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = process.env.REACT_APP_BASE_URL;

class requestPhotoServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/requests`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Получение фотографий заявки
  async GethotosForRequest(requestId) {
    try {
      const response = await this.api.get(`/${requestId}/photos`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при получении фото:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось загрузить фото",
      };
    }
  }

  async UploadPhotosForRequest(requestId, files) {
    try {
      const formData = new FormData();
      console.log(requestId);
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append("Photos", files[i]);
        }
      } else {
        throw new Error("Файлы не выбраны");
      }

      const response = await this.api.post(`/${requestId}/photos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Ошибка при загрузке фото:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось загрузить фото",
      };
    }
  }
}

export default requestPhotoServerApi;
