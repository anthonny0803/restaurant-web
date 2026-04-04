import { apiFetch } from "../lib/api";
import type { ApiResponse, ReservationItem } from "../types/api";

interface AddPreOrderBody {
  menu_item_id: number;
  quantity: number;
}

export function getItems(reservationId: number) {
  return apiFetch<ApiResponse<ReservationItem[]>>(
    `/reservations/${reservationId}/pre-orders`,
  );
}

export function addItem(reservationId: number, body: AddPreOrderBody) {
  return apiFetch<ApiResponse<ReservationItem>>(
    `/reservations/${reservationId}/pre-orders`,
    {
      method: "POST",
      body,
    },
  );
}

export function removeItem(reservationId: number, itemId: number) {
  return apiFetch<null>(
    `/reservations/${reservationId}/pre-orders/${itemId}`,
    {
      method: "DELETE",
    },
  );
}
