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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

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
