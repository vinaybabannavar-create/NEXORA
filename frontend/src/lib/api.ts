import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/store/auth-store";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";


export const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});


let isRefreshing = false;

let refreshPromise: Promise<string | null> | null = null;


const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken =
    useAuthStore.getState().refreshToken;


  if (!refreshToken) {
    return null;
  }


  try {
    const response = await axios.post(
      `${API_URL}/auth/refresh/`,
      {
        refresh: refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );


    const newAccessToken =
      response.data.access;


    if (!newAccessToken) {
      return null;
    }


    useAuthStore
      .getState()
      .setAccessToken(newAccessToken);


    return newAccessToken;
  } catch (error) {
    console.error(
      "Token refresh failed:",
      error
    );


    useAuthStore
      .getState()
      .clear();


    return null;
  }
};


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig
  ) => {
    const accessToken =
      useAuthStore
        .getState()
        .accessToken;


    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }


    return config;
  }
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,


  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };


    // Only handle 401 once
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }


    // Don't refresh the refresh endpoint itself
    if (
      originalRequest.url?.includes(
        "/auth/refresh/"
      )
    ) {
      useAuthStore
        .getState()
        .clear();


      if (
        typeof window !== "undefined"
      ) {
        window.location.href =
          "/login";
      }


      return Promise.reject(error);
    }


    originalRequest._retry = true;


    try {
      if (!isRefreshing) {
        isRefreshing = true;

        refreshPromise =
          refreshAccessToken()
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
      }


      const newAccessToken =
        await refreshPromise;


      if (!newAccessToken) {
        if (
          typeof window !== "undefined"
        ) {
          window.location.href =
            "/login";
        }


        return Promise.reject(error);
      }


      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;


      return api(
        originalRequest
      );
    } catch (refreshError) {
      useAuthStore
        .getState()
        .clear();


      if (
        typeof window !== "undefined"
      ) {
        window.location.href =
          "/login";
      }


      return Promise.reject(
        refreshError
      );
    }
  }
);