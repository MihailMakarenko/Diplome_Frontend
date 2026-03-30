import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class LocationApi {
  constructor() {
    // базовый: /api/floors
    this.baseUrl = `${baseUrl}/floors`;

    const token = localStorage.getItem("accessToken");

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }

  SetAccessToken(token) {
    this.api.defaults.headers.Authorization = token ? `Bearer ${token}` : "";
  }

  _parsePagination(response) {
    const header = response.headers?.["x-pagination"]; // axios приводит к lower-case
    if (!header) return null;
    try {
      return JSON.parse(header);
    } catch (e) {
      console.error("Ошибка парсинга X-Pagination:", e);
      return null;
    }
  }

  _err(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallback
    );
  }

  // =========================
  // Получить места для этажа (с пагинацией)
  // GET /api/floors/{floorId}/locations?PageNumber=&PageSize=
  // =========================
  async getLocationsForFloor(floorId, pageNumber = 1, pageSize = 100) {
    try {
      const response = await this.api.get(`/${floorId}/locations`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      return {
        success: true,
        data: response.data,
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      console.error(`Error getting locations for floor ${floorId}:`, error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: this._err(error, "Не удалось загрузить места"),
      };
    }
  }

  // =========================
  // Получить конкретное место
  // GET /api/floors/{floorId}/locations/{id}
  // =========================
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
        message: this._err(error, "Место не найдено"),
      };
    }
  }

  // =========================
  // Создать место
  // POST /api/floors/{floorId}/locations
  // body: { name, isAudience, description }
  // =========================
  async createLocation(floorId, locationData) {
    try {
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
        message: this._err(error, "Не удалось создать место"),
      };
    }
  }

  // =========================
  // Удалить место
  // DELETE /api/floors/{floorId}/locations/{id}
  // =========================
  async deleteLocation(floorId, locationId) {
    try {
      await this.api.delete(`/${floorId}/locations/${locationId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting location:", error);
      return {
        success: false,
        message: this._err(error, "Не удалось удалить место"),
      };
    }
  }

  // =========================
  // Обновить место (на будущее)
  // PUT /api/floors/{floorId}/locations/{id}
  //
  // ВНИМАНИЕ: на твоём LocationController сейчас НЕТ [HttpPut],
  // поэтому метод будет работать только после добавления PUT на бэке.
  //
  // expected body (пример): { name, isAudience, description }
  // =========================
  async updateLocation(floorId, locationId, locationData) {
    try {
      const response = await this.api.put(
        `/${floorId}/locations/${locationId}`,
        locationData,
      );

      // если сервер вернёт NoContent() -> response.data будет undefined, это нормально
      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      console.error("Error updating location:", error);
      return {
        success: false,
        message: this._err(error, "Не удалось обновить место"),
      };
    }
  }
}

export default LocationApi;
