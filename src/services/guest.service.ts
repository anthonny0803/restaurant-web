import { apiFetch } from "../lib/api";
import type { ApiResponse, Reservation } from "../types/api";

interface GuestReservationBody {
  name: string;
  email: string;
  phone: string;
  table_id: number;
  seats_requested: number;
  date: string;
  start_time: string;
}

interface GuestReservationResponse {
  reservation: Reservation;
  payment_intent_client_secret: string;
}

export function createGuestReservation(body: GuestReservationBody) {
  return apiFetch<ApiResponse<GuestReservationResponse>>(
    "/guest/reservations",
    {
      method: "POST",
      body,
    },
  );
}
