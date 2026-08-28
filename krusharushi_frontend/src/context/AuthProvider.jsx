import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { login as loginRequest } from "../api/auth";
import { registerUnauthorizedHandler } from "../api/axiosClient";
import { AuthContext } from "./AuthContext";

function decodeUser(token) {
  try {
    const payload = jwtDecode(token);
    // payload: { sub, hospital_id, role, exp }
    return {
      userId: payload.sub,
      hospitalId: payload.hospital_id,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(() => {
    const existing = localStorage.getItem("access_token");
    return existing ? decodeUser(existing) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  }, []);

  // Persist a token and derive the user from it. Shared by password login and
  // hospital signup (register-hospital returns a token that signs the admin in).
  const establishSession = useCallback((accessToken) => {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
    setUser(decodeUser(accessToken));
  }, []);

  const login = useCallback(
    async (username, password) => {
      const { access_token } = await loginRequest(username, password);
      establishSession(access_token);
    },
    [establishSession]
  );

  // Wire the axios 401 interceptor to this context's logout,
  // so an expired token anywhere in the app boots the user out.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, login, logout, establishSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
