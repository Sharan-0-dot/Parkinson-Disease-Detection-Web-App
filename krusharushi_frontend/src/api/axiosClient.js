import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach the JWT to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally catch expired/invalid tokens and force a re-login.
// AuthContext registers the actual logout handler at app startup
// so this file doesn't need to import React context directly.
let onUnauthorized = () => {};
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Pull a human-readable message out of the backend's standardized error
// envelope ({ error: { code, message } }), falling back gracefully.
export function getApiErrorMessage(error, fallback = "Something went wrong") {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

export default axiosClient;