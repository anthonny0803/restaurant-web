import { apiFetch } from "../lib/api";
import type {
  ApiResponse,
  AuthResponse,
  MessageResponse,
  User,
} from "../types/api";

interface RegisterBody {
  name: string;
  email: string;
  email_confirmation: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ResetPasswordBody {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface CompleteAccountBody {
  password: string;
  password_confirmation: string;
}

export function register(body: RegisterBody) {
  return apiFetch<ApiResponse<AuthResponse>>("/auth/register", {
    method: "POST",
    body,
  });
}

export function login(body: LoginBody) {
  return apiFetch<ApiResponse<AuthResponse>>("/auth/login", {
    method: "POST",
    body,
  });
}

export function logout() {
  return apiFetch<MessageResponse>("/auth/logout", {
    method: "POST",
  });
}

export function forgotPassword(email: string) {
  return apiFetch<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(body: ResetPasswordBody) {
  return apiFetch<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body,
  });
}

export function completeAccount(body: CompleteAccountBody) {
  return apiFetch<ApiResponse<User>>("/auth/complete-account", {
    method: "POST",
    body,
  });
}
