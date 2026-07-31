import axios from "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
  }

  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}
import { clearAccessToken, getAccessToken } from "../features/auth/authStorage";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ?? "https://meu-baba-api.vercel.app/api",
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error?.config?.skipAuth) {
      clearAccessToken();
    }

    return Promise.reject(error);
  },
);
