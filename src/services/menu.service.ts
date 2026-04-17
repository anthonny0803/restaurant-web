import { apiFetch } from "../lib/api";
import type { MenuItem, MenuCategory, PaginatedResponse } from "../types/api";

interface GetMenuItemsOptions {
  category?: MenuCategory;
  featured?: boolean;
  perPage?: number;
}

export function getMenuItems(options: GetMenuItemsOptions = {}) {
  const { category, featured, perPage = 100 } = options;
  const params = new URLSearchParams({ per_page: String(perPage) });
  if (category) params.set("category", category);
  if (featured) params.set("featured", "1");
  return apiFetch<PaginatedResponse<MenuItem>>(`/menu-items?${params}`);
}
