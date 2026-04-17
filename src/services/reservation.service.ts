import { apiFetch } from "../lib/api";
import type {
  ApiResponse,
  PaginatedResponse,
  Reservation,
  Table,
  TimeSlot,
} from "../types/api";

interface HoldReservationBody {
  table_id: number;
  seats_requested: number;
  date: string;
  start_time: string;
}

interface HoldReservationResponse {
  reservation: Reservation;
  client_secret: string;
}

interface AvailableTablesParams {
  date: string;
  start_time: string;
  seats_requested: number;
}

export function getTimeSlots(date: string, seatsRequested: number) {
  const query = new URLSearchParams({
    date,
    seats_requested: String(seatsRequested),
  });
  return apiFetch<ApiResponse<TimeSlot[]>>(
    `/reservations/time-slots?${query}`,
  );
}

export function getAvailableTables(params: AvailableTablesParams) {
  const query = new URLSearchParams({
    date: params.date,
    start_time: params.start_time,
    seats_requested: String(params.seats_requested),
  });
  return apiFetch<ApiResponse<Table[]>>(
    `/reservations/available-tables?${query}`,
  );
}

export function createHold(body: HoldReservationBody) {
  return apiFetch<ApiResponse<HoldReservationResponse>>("/reservations", {
    method: "POST",
    body,
  });
}

export function getAll() {
  return apiFetch<PaginatedResponse<Reservation>>("/reservations");
}

export function getById(id: number) {
  return apiFetch<ApiResponse<Reservation>>(`/reservations/${id}`);
}

export function cancel(id: number) {
  return apiFetch<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, {
    method: "POST",
  });
}
