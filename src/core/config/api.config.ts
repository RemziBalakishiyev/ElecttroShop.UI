export const API_CONFIG = {
  BASE_URL: "https://localhost:44312",
  API_PREFIX: "/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH_TOKEN: "/auth/refresh-token",
    },
  },
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};

