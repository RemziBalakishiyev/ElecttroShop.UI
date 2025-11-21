import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../utils/tokenStorage";
import type { LoginRequest, RefreshTokenRequest, LoginResponse } from "../types/auth.types";
import { useAuthContext } from "../context/AuthContext";

export const useLogin = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { setAuthState } = useAuthContext();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (response: any) => {
      console.log("useLogin onSuccess - Response:", response);
      console.log("Response type check:", {
        isResponse: !!response,
        hasIsSuccess: "isSuccess" in (response || {}),
        hasValue: "value" in (response || {}),
        isSuccess: response?.isSuccess,
        hasDirectAccessToken: "accessToken" in (response || {}),
      });
      
      let loginData: LoginResponse | null = null;

      // Check if response has wrapper structure (isSuccess + value)
      if (response && response.isSuccess && response.value) {
        loginData = response.value;
        console.log("Using wrapped structure (response.value)");
      } 
      // Check if response is direct (no wrapper - accessToken directly in response)
      else if (response && "accessToken" in response && response.accessToken) {
        loginData = response as LoginResponse;
        console.log("Using direct structure (response itself)");
      }

      if (loginData && loginData.accessToken) {
        const { accessToken, refreshToken, expiresAt, user } = loginData;

        console.log("Saving tokens and updating state...", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!user,
        });

        // Save tokens to storage
        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(refreshToken);
        tokenStorage.setExpiresAt(expiresAt);
        tokenStorage.setUser(user);

        // Update auth state
        setAuthState({
          user,
          accessToken,
          refreshToken,
          expiresAt,
          isAuthenticated: true,
        });

        console.log("Auth state updated, calling callback...");

        // Invalidate queries if needed
        queryClient.invalidateQueries();

        // Call navigation callback if provided
        if (onSuccessCallback) {
          console.log("Calling navigation callback...");
          onSuccessCallback();
        } else {
          console.warn("No navigation callback provided!");
        }
      } else {
        console.warn("Login response is not successful or has unexpected structure:", response);
      }
    },
  });
};

export const useRefreshToken = () => {
  const { setAuthState } = useAuthContext();

  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => authApi.refreshToken(data),
    onSuccess: (response) => {
      if (response.isSuccess && response.value) {
        const { accessToken, refreshToken, expiresAt } = response.value;

        // Update tokens in storage
        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(refreshToken);
        tokenStorage.setExpiresAt(expiresAt);

        // Update auth state
        setAuthState((prev) => ({
          ...prev,
          accessToken,
          refreshToken,
          expiresAt,
        }));
      }
    },
  });
};

