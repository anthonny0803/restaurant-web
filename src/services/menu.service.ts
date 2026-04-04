import { apiFetch } from "../lib/api";
import type { MenuItem, MenuCategory, PaginatedResponse } from "../types/api";

export function getMenuItems(category?: MenuCategory) {
  const params = category ? `?category=${category}` : "";
  return apiFetch<PaginatedResponse<MenuItem>>(`/menu-items${params}`);
}
