import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_CONFIG, getApiUrl } from "../config/api.config";
import { tokenStorage } from "../utils/tokenStorage";
import type { ApiResponse } from "../types/auth.types";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response for debugging
    console.log("API Response:", response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post<ApiResponse<any>>(
            getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN),
            { refreshToken }
          );

          if (response.data.isSuccess && response.data.value) {
            const { accessToken, refreshToken: newRefreshToken, expiresAt } = response.data.value;
            tokenStorage.setAccessToken(accessToken);
            tokenStorage.setRefreshToken(newRefreshToken);
            tokenStorage.setExpiresAt(expiresAt);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          tokenStorage.clearAll();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    // Format error response
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

