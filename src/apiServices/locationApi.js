import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class LocationApi {
  constructor() {
    this.baseUrl = `${baseUrl}/floors`; // Используем корень, так как пути динамические

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  // Внимание!
  // В вашем контроллере нет метода "GetLocationsForFloor" (список всех мест на этаже).
  // Есть только GetLocation (по ID).
  // Но для работы формы "Создать заявку" (где нужен список мест для выбора)
  // вам, скорее всего, ПОНАДОБИТСЯ такой метод на сервере: GET /api/floors/{floorId}/locations

  // Если вы его добавите, он будет выглядеть так:
  async getLocationsForFloor(floorId) {
    try {
      // Предлагаемый путь, если вы расширите контроллер
      const response = await this.api.get(`/${floorId}/locations`);

      console.log(response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error getting locations for floor ${floorId}:`, error);
      // Если метода нет, вернем пустой массив, чтобы фронт не падал
      return {
        success: false,
        data: [],
        message: "Метод получения списка мест не реализован",
      };
    }
  }

  // Получить конкретное место
  // GET /api/floors/{floorId}/locations/{id}
  async getLocation(floorId, locationId) {
    try {
      const response = await this.api.get(
        `/${floorId}/locations/${locationId}`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Место не найдено",
      };
    }
  }

  // Создать место
  // POST /api/floors/{floorId}/locations
  async createLocation(floorId, locationData) {
    try {
      // locationData = { name, description, isAudience }
      const response = await this.api.post(
        `/${floorId}/locations`,
        locationData,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating location:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось создать место",
      };
    }
  }

  // Удалить место
  // DELETE /api/floors/{floorId}/locations/{id}
  async deleteLocation(floorId, locationId) {
    try {
      await this.api.delete(`/${floorId}/locations/${locationId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting location:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Не удалось удалить место",
      };
    }
  }
}

export default LocationApi;
