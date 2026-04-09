import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CancelModal from "../components/CancelModal";
import * as reservationService from "../services/reservation.service";
import type { Reservation, ReservationStatus } from "../types/api";

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; colors: string }
> = {
  pending: { label: "Pendiente", colors: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmada", colors: "bg-green-100 text-green-800" },
  completed: { label: "Completada", colors: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Cancelada", colors: "bg-red-100 text-red-800" },
  expired: { label: "Expirada", colors: "bg-gray-100 text-gray-800" },
  no_show: { label: "No asistio", colors: "bg-orange-100 text-orange-800" },
};

const CANCELLABLE_STATUSES: ReservationStatus[] = ["pending", "confirmed"];

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${config.colors}`}
    >
      {config.label}
    </span>
  );
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const detailRequestId = useRef(0);

  useEffect(() => {
    reservationService
      .getAll()
      .then((response) => setReservations(response.data))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar reservaciones",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  function toggleAccordion(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }

    setExpandedId(id);
    setDetail(null);
    setIsDetailLoading(true);

    const currentRequest = ++detailRequestId.current;

    reservationService
      .getById(id)
      .then((response) => {
        if (detailRequestId.current !== currentRequest) return;
        setDetail(response.data);
      })
      .catch(() => {
        if (detailRequestId.current !== currentRequest) return;
        setDetail(null);
      })
      .finally(() => {
        if (detailRequestId.current !== currentRequest) return;
        setIsDetailLoading(false);
      });
  }

  function handleCancelConfirm() {
    if (!cancellingId) return;

    setIsCancelling(true);

    reservationService
      .cancel(cancellingId)
      .then((response) => {
        setReservations((prev) =>
          prev.map((r) => (r.id === cancellingId ? response.data : r)),
        );
        if (expandedId === cancellingId) {
          setDetail(response.data);
        }
        setCancellingId(null);
      })
      .catch((err) => {
        setCancelError(
          err instanceof Error
            ? err.message
            : "Error al cancelar la reservacion",
        );
        setCancellingId(null);
      })
      .finally(() => setIsCancelling(false));
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-center text-gray-600">
          Cargando reservaciones...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="rounded-md bg-red-50 p-4 text-center text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Mis reservaciones
        </h1>
        <p className="text-center text-gray-600">
          No tienes reservaciones aun.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Mis reservaciones
      </h1>

      {cancelError && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{cancelError}</p>
          <button
            type="button"
            onClick={() => setCancelError(null)}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="space-y-3">
        {reservations.map((reservation) => {
          const isExpanded = expandedId === reservation.id;

          return (
            <div
              key={reservation.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(reservation.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900">
                    {formatDate(reservation.date)}
                  </span>
                  <span className="text-gray-600">
                    {formatTime(reservation.start_time)}
                  </span>
                  {reservation.table && (
                    <span className="text-gray-600">
                      {reservation.table.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={reservation.status} />
                  <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-4">
                  {isDetailLoading ? (
                    <p className="text-sm text-gray-600">
                      Cargando detalles...
                    </p>
                  ) : detail ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Fecha</span>
                          <p className="font-medium text-gray-900">
                            {formatDate(detail.date)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Horario</span>
                          <p className="font-medium text-gray-900">
                            {formatTime(detail.start_time)} -{" "}
                            {formatTime(detail.end_time)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Personas</span>
                          <p className="font-medium text-gray-900">
                            {detail.seats_requested}
                          </p>
                        </div>
                        {detail.table && (
                          <div>
                            <span className="text-gray-500">Mesa</span>
                            <p className="font-medium text-gray-900">
                              {detail.table.name} · {detail.table.location}
                            </p>
                          </div>
                        )}
                        {detail.payment && (
                          <>
                            <div>
                              <span className="text-gray-500">Deposito</span>
                              <p className="font-medium text-gray-900">
                                ${detail.payment.amount}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Estado del pago
                              </span>
                              <p className="font-medium text-gray-900">
                                {detail.payment.status}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        {detail.status === "confirmed" && (
                          <Link
                            to={`/my-reservations/${detail.id}/pre-order`}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                          >
                            Pre-ordenar
                          </Link>
                        )}
                        {CANCELLABLE_STATUSES.includes(detail.status) && (
                          <button
                            type="button"
                            onClick={() => setCancellingId(detail.id)}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      No se pudieron cargar los detalles.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CancelModal
        isOpen={cancellingId !== null}
        isSubmitting={isCancelling}
        onConfirm={handleCancelConfirm}
        onClose={() => setCancellingId(null)}
      />
    </div>
  );
}
