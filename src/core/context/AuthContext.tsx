import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, User } from "../types/auth.types";
import { tokenStorage } from "../utils/tokenStorage";

interface AuthContextType {
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  logout: () => void;
  isAuthenticated: boolean;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from localStorage
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const expiresAt = tokenStorage.getExpiresAt();
    const user = tokenStorage.getUser();

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
      isAuthenticated: !!accessToken && !!user,
    };
  });

  const logout = () => {
    tokenStorage.clearAll();
    setAuthState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    });
  };

  // Check token expiration
  useEffect(() => {
    const checkTokenExpiration = () => {
      const expiresAt = tokenStorage.getExpiresAt();
      if (expiresAt) {
        const expirationTime = new Date(expiresAt).getTime();
        const now = Date.now();
        
        if (now >= expirationTime) {
          // Token expired - try to refresh or logout
          const refreshToken = tokenStorage.getRefreshToken();
          if (!refreshToken) {
            tokenStorage.clearAll();
            setAuthState({
              user: null,
              accessToken: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
            });
          }
        }
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        setAuthState,
        logout,
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

