import apiClient from "./apiClient";
import { getApiUrl } from "../config/api.config";
import { API_CONFIG } from "../config/api.config";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "../types/auth.types";

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN),
      credentials
    );
    console.log("auth.api.ts - Raw response:", response);
    console.log("auth.api.ts - Response data:", response.data);
    return response.data;
  },

  // Refresh Token
  refreshToken: async (
    refreshToken: RefreshTokenRequest
  ): Promise<ApiResponse<RefreshTokenResponse>> => {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN),
      refreshToken
    );
    return response.data;
  },
};

