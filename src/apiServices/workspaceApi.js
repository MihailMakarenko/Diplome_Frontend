import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class WorkspaceServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/workspaces`;

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

  _errorMessage(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallback
    );
  }

  _parsePagination(response) {
    const paginationHeader = response.headers?.["x-pagination"];
    if (!paginationHeader) return null;

    try {
      return JSON.parse(paginationHeader);
    } catch (e) {
      console.error("Ошибка парсинга x-pagination:", e);
      return null;
    }
  }

  async GetBuildings(pageNumber = 1, pageSize = 50) {
    try {
      const response = await this.api.get("/buildings", {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      return {
        success: true,
        items: response.data || [],
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        pagination: null,
        message: this._errorMessage(error, "Ошибка получения зданий"),
      };
    }
  }

  async GetFloors(buildingId, pageNumber = 1, pageSize = 50) {
    try {
      const response = await this.api.get(`/buildings/${buildingId}/floors`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      return {
        success: true,
        items: response.data || [],
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        pagination: null,
        message: this._errorMessage(error, "Ошибка получения этажей"),
      };
    }
  }

  async GetLocations(buildingId, floorId, pageNumber = 1, pageSize = 50) {
    try {
      const response = await this.api.get(
        `/buildings/${buildingId}/floors/${floorId}/locations`,
        {
          params: { PageNumber: pageNumber, PageSize: pageSize },
        },
      );

      return {
        success: true,
        items: response.data || [],
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        pagination: null,
        message: this._errorMessage(error, "Ошибка получения локаций"),
      };
    }
  }

  async CreateWorkspace(dto) {
    try {
      const response = await this.api.post("", dto);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка создания рабочей зоны"),
      };
    }
  }

  async DeleteWorkspace(workspaceId) {
    try {
      const response = await this.api.delete("", {
        params: { workspaceId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка удаления рабочей зоны"),
      };
    }
  }
}

export default WorkspaceServerApi;
