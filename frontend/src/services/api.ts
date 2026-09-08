const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
export const BACKEND_URL = API_URL.replace(/\/api\/v1\/?$/, "");

export function getMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }
}

// In-flight refresh promise to prevent duplicate refresh requests
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("knots_refresh_token");
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("knots_token");
      localStorage.removeItem("knots_refresh_token");
      return null;
    }

    const data = await res.json();
    if (data.data?.access_token) {
      localStorage.setItem("knots_token", data.data.access_token);
      if (data.data.refresh_token) {
        localStorage.setItem("knots_refresh_token", data.data.refresh_token);
      }
      return data.data.access_token as string;
    }
    return null;
  } catch {
    localStorage.removeItem("knots_token");
    localStorage.removeItem("knots_refresh_token");
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem("knots_token");
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized by trying silent token refresh
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/register")
  ) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed or no refresh token - clear credentials and redirect to login
      localStorage.removeItem("knots_token");
      localStorage.removeItem("knots_refresh_token");
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }
  }

  const contentType = response.headers.get("content-type");
  let json: any = {};
  if (contentType && contentType.includes("application/json")) {
    json = await response.json();
  } else {
    const text = await response.text();
    json = { success: response.ok, message: text };
  }

  if (!response.ok || json.success === false) {
    const errorMessage =
      json.error?.message || json.message || "Something went wrong";
    const errorCode = json.error?.code || "HTTP_ERROR";
    const errorDetails = json.error?.details;
    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  return json.data as T;
}
