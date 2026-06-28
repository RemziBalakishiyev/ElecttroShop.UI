import apiClient from "./apiClient";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "../types/auth.types";

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials
    );
    console.log("auth.api.ts - Raw response:", response);
    console.log("auth.api.ts - Response data:", response.data);
    return response.data;
  },

  refreshToken: async (
    refreshToken: RefreshTokenRequest
  ): Promise<ApiResponse<RefreshTokenResponse>> => {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      "/auth/refresh-token",
      refreshToken
    );
    return response.data;
  },
};
