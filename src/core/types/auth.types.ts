// User Role Enum
export enum UserRole {
  Admin = 1,
  Agent = 2,
}

// API Response Types
export interface ApiResponse<T> {
  isSuccess: boolean;
  value: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  type: "Validation" | "Failure";
}

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
}
