import axios from "axios";
console.log("ENV CHECK");
console.log(import.meta.env);
console.log(import.meta.env.VITE_API_URL);
console.log("MODE =", import.meta.env.MODE);
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);

export const apiClient = axios.create({
  baseURL: "https://volunteerapi-0x7y.onrender.com",
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
              "https://volunteerapi-0x7y.onrender.com" + "/api/auth/refresh",
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
