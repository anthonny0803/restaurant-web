import { apiFetch } from "../lib/api";
import type { ApiResponse, PublicSettings } from "../types/api";

export function getPublicSettings() {
  return apiFetch<ApiResponse<PublicSettings>>("/settings/public");
}
