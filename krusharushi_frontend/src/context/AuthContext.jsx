import { createContext, useContext } from "react";

// Context + hook live here (no component export) so consumers can keep importing
// `useAuth` from "context/AuthContext"; the provider component lives in
// AuthProvider.jsx to satisfy react-refresh's single-concern rule.
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
