import axios, { AxiosRequestConfig } from "axios";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function normalizeApiUrl(url: string) {
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) {
    return `${trimmed}/v1`;
  }
  return trimmed;
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }
  const cookieValue = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
  return cookieValue || null;
}

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const API_URL = normalizeApiUrl(RAW_API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 20_000,
});

const pendingGetRequests = new Map<string, AbortController>();

export async function dedupedGet<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
  dedupeKey?: string,
) {
  const key = dedupeKey || `${url}:${JSON.stringify(config.params || {})}`;

  const previousController = pendingGetRequests.get(key);
  if (previousController) {
    previousController.abort();
  }

  const controller = new AbortController();
  pendingGetRequests.set(key, controller);

  try {
    const response = await apiClient.get<T>(url, {
      ...config,
      signal: controller.signal,
    });
    return response;
  } finally {
    if (pendingGetRequests.get(key) === controller) {
      pendingGetRequests.delete(key);
    }
  }
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      window.localStorage.getItem(ACCESS_TOKEN_KEY) || getCookie(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const message =
          error.response?.data?.message ||
          "Your session has expired. Please log in again.";

        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        document.cookie =
          "accessToken=; Path=/; Max-Age=0; SameSite=Lax";

        if (!window.location.pathname.includes("/login")) {
          (window as any).__sessionExpiredMessage = message;
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
