import { apiFetch } from "../lib/api";
import type { MenuItem, MenuCategory, PaginatedResponse } from "../types/api";

export function getMenuItems(category?: MenuCategory) {
  const params = new URLSearchParams({ per_page: "100" });
  if (category) params.set("category", category);
  return apiFetch<PaginatedResponse<MenuItem>>(`/menu-items?${params}`);
}
