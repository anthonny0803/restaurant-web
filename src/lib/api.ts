import type { ValidationError } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;
const TOKEN_KEY = "auth_token";

export class ApiValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(data: ValidationError) {
    super(data.message);
    this.errors = data.errors;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, headers: extraHeaders } = options;

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null as T;
  }

  if (response.status === 401) {
    removeStoredToken();
    window.location.href = "/login";
    return Promise.reject(new Error("No autenticado"));
  }

  if (response.status === 422) {
    const data: ValidationError = await response.json();
    return Promise.reject(new ApiValidationError(data));
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message ?? `Error ${response.status}`;
    return Promise.reject(new Error(message));
  }

  return response.json() as Promise<T>;
}
