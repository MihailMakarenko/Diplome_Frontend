import React, { createContext, useMemo, useState, useCallback } from "react";
import {
  getToken,
  setToken as saveToken,
  isTokenValid,
  getRolesFromToken,
} from "./authUtils";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  const setToken = useCallback((t) => {
    saveToken(t);
    setTokenState(t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = useMemo(() => {
    const valid = isTokenValid(token);

    return {
      token,
      isAuth: valid,
      roles: valid ? getRolesFromToken(token) : [],
      setToken,
      logout,
    };
  }, [token, setToken, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
