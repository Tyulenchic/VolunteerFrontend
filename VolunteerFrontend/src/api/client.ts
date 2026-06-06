import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "https://localhost:7227",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh && !err.config._retry) {
        err.config._retry = true;
        try {
          const { data } = await axios.post(
            (import.meta.env.VITE_API_URL ?? "https://localhost:7227") + "/api/auth/refresh",
            { refreshToken: refresh }
          );
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          err.config.headers.Authorization = "Bearer " + data.accessToken;
          return apiClient.request(err.config);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    }
    return Promise.reject(err);
  }
);
