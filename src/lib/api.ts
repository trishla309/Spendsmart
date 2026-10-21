import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

// Interceptor to attach JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to intercept expired tokens and redirect if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/verify-otp") || 
                           url.includes("/auth/request-otp") || 
                           url.includes("/auth/signup");

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      // If unauthorized on protected resource, clear invalid token and redirect to root
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);
