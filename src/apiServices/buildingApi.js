import axios from "axios";
import { LiaCoinsSolid } from "react-icons/lia";

const baseUrl = process.env.REACT_APP_BASE_URL;

class BuildingApi {
  constructor() {
    // Базовый URL для зданий: api/buildings
    this.baseUrl = `${baseUrl}/buildings`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Получить список всех зданий (с пагинацией, если сервер поддерживает)
  // GET /api/buildings
  async getBuildings(pageNumber = 1, pageSize = 100) {
    try {
      const response = await this.api.get("", {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      console.log(response.data);
      // Сервер может возвращать массив или объект с пагинацией
      // В вашем примере возвращается массив объектов
      return {
        success: true,
        data: response.data,
        pagination: response.headers["x-pagination"]
          ? JSON.parse(response.headers["x-pagination"])
          : null,
      };
    } catch (error) {
      console.error("Error getting buildings:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось загрузить здания",
      };
    }
  }

  // Получить здание по ID
  // GET /api/buildings/{id}
  async getBuildingById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error getting building ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Здание не найдено",
      };
    }
  }

  // Создать здание
  // POST /api/buildings
  async createBuilding(buildingData) {
    try {
      // buildingData = { name, description, address }
      const response = await this.api.post("", buildingData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating building:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось создать здание",
      };
    }
  }

  // Обновить здание
  // PUT /api/buildings/{id}
  async updateBuilding(id, buildingData) {
    try {
      // buildingData = { name, description, address }
      const response = await this.api.put(`/${id}`, buildingData);

      return {
        success: true,
        data: response.data, // если сервер возвращает сущность/DTO
      };
    } catch (error) {
      console.error(`Error updating building ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось обновить здание",
      };
    }
  }
}

export default BuildingApi;
