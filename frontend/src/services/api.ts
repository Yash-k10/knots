const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const DEFAULT_API_URL = isLocal
  ? "http://localhost:8000/api/v1"
  : "https://knots-backend-6snz.onrender.com/api/v1";

const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
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

// In-flight GET request deduplication to prevent duplicate concurrent network calls
const inFlightRequests = new Map<string, Promise<any>>();

// SWR Micro-cache for instantaneous tab switches & low latency
interface CacheEntry {
  data: any;
  freshUntil: number;
  staleUntil: number;
}
const apiCache = new Map<string, CacheEntry>();

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.startsWith(prefix)) {
        apiCache.delete(key);
      }
    }
  }
}

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
      clearApiCache();
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
    clearApiCache();
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();
  const isGet = method === "GET";

  // Invalidate cache on mutations
  if (!isGet) {
    clearApiCache();
  }

  // Check SWR micro-cache for idempotent GET endpoints
  const cacheKey = `${endpoint}`;
  if (isGet) {
    const cached = apiCache.get(cacheKey);
    const now = Date.now();
    if (cached) {
      if (now < cached.freshUntil) {
        return cached.data as T;
      }
      if (now < cached.staleUntil) {
        // Return stale data immediately so UI renders in 0ms, revalidate in background
        if (!inFlightRequests.has(cacheKey)) {
          const bgPromise = execRequest()
            .then((fresh) => {
              const current = apiCache.get(cacheKey);
              if (current) current.data = fresh;
              return fresh;
            })
            .catch(() => {})
            .finally(() => {
              inFlightRequests.delete(cacheKey);
            });
          inFlightRequests.set(cacheKey, bgPromise);
        }
        return cached.data as T;
      }
    }

    // Return in-flight promise if an identical GET is already resolving
    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  async function execRequest(): Promise<T> {
    const token = localStorage.getItem("knots_token");
    const headers = new Headers(options?.headers);

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        "Unable to connect to the backend server. Please verify the server is running on " + API_URL,
        0,
        "NETWORK_ERROR"
      );
    }

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
        try {
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } catch (err: any) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(
            "Unable to connect to the backend server. Please verify the server is running on " + API_URL,
            0,
            "NETWORK_ERROR"
          );
        }
      } else {
        // Refresh failed or no refresh token - clear credentials and redirect to login
        localStorage.removeItem("knots_token");
        localStorage.removeItem("knots_refresh_token");
        clearApiCache();
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
      let errorMessage =
        json.error?.message ||
        json.detail ||
        json.message ||
        "Something went wrong";
      const errorCode = json.error?.code || "HTTP_ERROR";
      const errorDetails = json.error?.details;

      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        const fieldErrors = errorDetails
          .map((d: any) => {
            if (typeof d === "string") return d;
            if (d?.field && d?.message) return `${d.field}: ${d.message}`;
            return d?.message || JSON.stringify(d);
          })
          .filter(Boolean)
          .join("; ");
        if (fieldErrors && (!errorMessage || errorMessage === "Input validation failed.")) {
          errorMessage = fieldErrors;
        }
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    const result = json.data as T;

    // Cache GET requests to reduce redundant network calls and enable instant tab renders
    if (isGet) {
      // Identity/meta endpoints (stable, fresh 60s, stale 5m)
      const longCacheEndpoints = [
        "/users/me",
        "/users/roles",
        "/jobs/companies",
        "/events/categories",
      ];
      // Dynamic lists & feeds (fresh 20s, stale 2m)
      const shortCacheEndpoints = [
        "/notifications/unread-count",
        "/messages/unread/count",
        "/analytics/stats",
        "/analytics/platform/engagement-summary",
        "/posts/feed",
        "/jobs",
        "/jobs/applications/me",
        "/events",
        "/clubs",
        "/departments",
        "/opportunities",
        "/connections",
        "/profiles",
      ];

      const now = Date.now();
      if (longCacheEndpoints.some((ep) => endpoint.startsWith(ep))) {
        apiCache.set(cacheKey, {
          data: result,
          freshUntil: now + 60000,
          staleUntil: now + 300000,
        });
      } else if (shortCacheEndpoints.some((ep) => endpoint.startsWith(ep))) {
        apiCache.set(cacheKey, {
          data: result,
          freshUntil: now + 20000,
          staleUntil: now + 120000,
        });
      }
    }

    return result;
  }

  if (isGet) {
    const p = execRequest().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, p);
    return p;
  }

  return execRequest();
}
