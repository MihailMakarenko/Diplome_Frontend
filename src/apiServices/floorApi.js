import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class FloorApi {
  constructor() {
    // Базовый URL формируется динамически, так как зависит от buildingId
    // Но для создания axios instance используем корень API
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

  // Получить этажи для конкретного здания
  // GET /api/buildings/{buildingId}/floors
  async getFloorsForBuilding(buildingId, pageNumber = 1, pageSize = 100) {
    try {
      const response = await this.api.get(`/${buildingId}/floors`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      console.log(response.data);
      return {
        success: true,
        data: response.data,
        pagination: response.headers["x-pagination"]
          ? JSON.parse(response.headers["x-pagination"])
          : null,
      };
    } catch (error) {
      console.error(`Error getting floors for building ${buildingId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось загрузить этажи",
      };
    }
  }

  // Получить конкретный этаж
  // GET /api/buildings/{buildingId}/floors/{id}
  async getFloor(buildingId, floorId) {
    try {
      const response = await this.api.get(`/${buildingId}/floors/${floorId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error getting floor:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Этаж не найден",
      };
    }
  }

  // Создать этаж
  // POST /api/buildings/{buildingId}/floors
  async createFloor(buildingId, floorData) {
    try {
      // floorData = { floorNumber, description }
      const response = await this.api.post(`/${buildingId}/floors`, floorData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating floor:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось создать этаж",
      };
    }
  }

  // Удалить этаж
  // DELETE /api/buildings/{buildingId}/floors/{id}
  async deleteFloor(buildingId, floorId) {
    try {
      await this.api.delete(`/${buildingId}/floors/${floorId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting floor:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось удалить этаж",
      };
    }
  }

  // Обновить этаж
  // PUT /api/buildings/{buildingId}/floors/{id}
  async updateFloor(buildingId, floorId, floorData) {
    try {
      // floorData = { floorNumber, description }
      const response = await this.api.put(
        `/${buildingId}/floors/${floorId}`,
        floorData,
      );

      // Сервер возвращает NoContent() => response.data будет undefined, это нормально
      return {
        success: true,
        status: response.status, // 204
      };
    } catch (error) {
      console.error("Error updating floor:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось обновить этаж",
      };
    }
  }
}

export default FloorApi;
