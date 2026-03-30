import axios from "axios";

const baseUrl = process.env.REACT_APP_BASE_URL;

class EmployeeWorkspacesServerApi {
  constructor() {
    this.baseUrl = `${baseUrl}/employees`;

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
    const paginationHeader = response.headers?.["x-pagination"];
    if (!paginationHeader) return null;

    try {
      return JSON.parse(paginationHeader);
    } catch (e) {
      console.error("Ошибка парсинга x-pagination:", e);
      return null;
    }
  }

  _errorMessage(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallback
    );
  }

  // ========== ASSIGNED ==========
  async GetBuildingWorkspacesForEmployee(
    employeeId,
    pageNumber = 1,
    pageSize = 50,
  ) {
    try {
      const response = await this.api.get(
        `${employeeId}/workspaces/buildings`,
        {
          params: { PageNumber: pageNumber, PageSize: pageSize },
        },
      );

      return {
        success: true,
        assignments: response.data,
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(
          error,
          "Ошибка получения зданий сотрудника",
        ),
        assignments: [],
        pagination: null,
      };
    }
  }

  async GetFloorWorkspacesForEmployee(
    employeeId,
    pageNumber = 1,
    pageSize = 50,
  ) {
    try {
      const response = await this.api.get(`${employeeId}/workspaces/floors`, {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      });

      return {
        success: true,
        assignments: response.data,
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(
          error,
          "Ошибка получения этажей сотрудника",
        ),
        assignments: [],
        pagination: null,
      };
    }
  }

  async GetLocationWorkspacesForEmployee(
    employeeId,
    pageNumber = 1,
    pageSize = 50,
  ) {
    try {
      const response = await this.api.get(
        `${employeeId}/workspaces/locations`,
        {
          params: { PageNumber: pageNumber, PageSize: pageSize },
        },
      );

      return {
        success: true,
        assignments: response.data,
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка получения мест сотрудника"),
        assignments: [],
        pagination: null,
      };
    }
  }

  // ========== WITH ASSIGNMENT ==========
  async GetBuildingsWithAssignmentForEmployee(
    employeeId,
    pageNumber = 1,
    pageSize = 50,
  ) {
    try {
      const response = await this.api.get(
        `${employeeId}/workspaces/buildings/with-assignment`,
        { params: { PageNumber: pageNumber, PageSize: pageSize } },
      );

      return {
        success: true,
        items: response.data, // [{ building, isAssigned, workspaceId? }]
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка получения списка зданий"),
        items: [],
        pagination: null,
      };
    }
  }

  async GetFloorsWithAssignmentForEmployee(
    employeeId,
    buildingId,
    pageNumber = 1,
    pageSize = 50,
  ) {
    try {
      const response = await this.api.get(
        `${employeeId}/workspaces/buildings/${buildingId}/floors/with-assignment`,
        { params: { PageNumber: pageNumber, PageSize: pageSize } },
      );

      return {
        success: true,
        items: response.data, // [{ floor, isAssigned, workspaceId? }]
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка получения списка этажей"),
        items: [],
        pagination: null,
      };
    }
  }

  async GetLocationsWithAssignmentForEmployee(
    employeeId,
    buildingId,
    floorId,
    pageNumber = 1,
    pageSize = 50,
  ) {
    try {
      const response = await this.api.get(
        `${employeeId}/workspaces/buildings/${buildingId}/floors/${floorId}/locations/with-assignment`,
        { params: { PageNumber: pageNumber, PageSize: pageSize } },
      );

      return {
        success: true,
        items: response.data, // [{ location, isAssigned, workspaceId? }]
        pagination: this._parsePagination(response),
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка получения списка мест"),
        items: [],
        pagination: null,
      };
    }
  }

  // ========== CREATE ASSIGNMENT ==========
  // POST /api/employees/{employeeId}/workspaces/{workspaceId}
  async CreateEmployeeWorkspaceAssignment(employeeId, workspaceId, dto) {
    try {
      const response = await this.api.post(
        `${employeeId}/workspaces/${workspaceId}`,
        dto,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка назначения рабочей зоны"),
      };
    }
  }

  // ========== DELETE ASSIGNMENT ==========
  // DELETE /api/employees/{employeeId}/workspaces/{workspaceId}/{assignmentId}
  async DeleteEmployeeWorkspaceAssignment(
    employeeId,
    workspaceId,
    assignmentId,
  ) {
    try {
      const response = await this.api.delete(
        `${employeeId}/workspaces/${workspaceId}/${assignmentId}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: this._errorMessage(error, "Ошибка удаления назначения"),
      };
    }
  }
}

export default EmployeeWorkspacesServerApi;
