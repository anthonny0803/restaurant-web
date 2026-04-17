import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CancelModal from "../components/CancelModal";
import { ReservationCardSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import * as reservationService from "../services/reservation.service";
import type { Reservation, ReservationStatus } from "../types/api";

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; colors: string }
> = {
  pending: { label: "Pendiente", colors: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmada", colors: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Completada", colors: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Cancelada", colors: "bg-red-100 text-red-800" },
  expired: { label: "Expirada", colors: "bg-zinc-100 text-zinc-600" },
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
      className={`inline-block rounded-sm px-3 py-1 text-xs font-medium tracking-wide ${config.colors}`}
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
  const toast = useToast();
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
        toast.success("Reservacion cancelada exitosamente.");
      })
      .catch((err) => {
        toast.error(
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
      <div className="mx-auto max-w-3xl px-6 py-12 animate-fade-in">
        <h1 className="mb-8 font-serif text-4xl font-medium text-white">
          Mis reservaciones
        </h1>
        <div className="space-y-3">
          <ReservationCardSkeleton />
          <ReservationCardSkeleton />
          <ReservationCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="rounded-sm bg-red-900/30 p-4 text-center text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 animate-fade-in-up">
        <h1 className="mb-8 font-serif text-4xl font-medium text-white">
          Mis reservaciones
        </h1>
        <div className="rounded-sm border border-zinc-800 bg-zinc-800 px-8 py-14 text-center shadow-lg">
          <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 font-serif text-lg text-zinc-300">
            Aun no tienes reservaciones
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Reserva una mesa y disfruta de una experiencia gastronomica unica.
          </p>
          <Link
            to="/reservations/new"
            className="mt-6 inline-block rounded-sm bg-amber-500 px-6 py-2.5 text-sm font-medium tracking-wide text-zinc-900 transition-colors duration-200 hover:bg-amber-400"
          >
            Reservar mesa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 animate-fade-in-up">
      <h1 className="mb-8 font-serif text-4xl font-medium text-white">
        Mis reservaciones
      </h1>

      <div className="space-y-3">
        {reservations.map((reservation) => {
          const isExpanded = expandedId === reservation.id;

          return (
            <div
              key={reservation.id}
              className="overflow-hidden rounded-sm border border-zinc-800 bg-zinc-800"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(reservation.id)}
                className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left transition-colors duration-200 hover:bg-zinc-800"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium text-white">
                    {formatDate(reservation.date)}
                  </span>
                  <span className="text-zinc-400">
                    {formatTime(reservation.start_time)}
                  </span>
                  {reservation.table && (
                    <span className="hidden text-zinc-500 sm:inline">
                      {reservation.table.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={reservation.status} />
                  <svg
                    className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-700 px-6 py-5">
                  {isDetailLoading ? (
                    <p className="text-sm text-zinc-500">
                      Cargando detalles...
                    </p>
                  ) : detail ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <span className="text-zinc-500">Fecha</span>
                          <p className="font-medium text-white">
                            {formatDate(detail.date)}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Horario</span>
                          <p className="font-medium text-white">
                            {formatTime(detail.start_time)} -{" "}
                            {formatTime(detail.end_time)}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Personas</span>
                          <p className="font-medium text-white">
                            {detail.seats_requested}
                          </p>
                        </div>
                        {detail.table && (
                          <div>
                            <span className="text-zinc-500">Mesa</span>
                            <p className="font-medium text-white">
                              {detail.table.name} · {detail.table.location}
                            </p>
                          </div>
                        )}
                        {detail.payment && (
                          <>
                            <div>
                              <span className="text-zinc-500">Deposito</span>
                              <p className="font-medium text-amber-500">
                                ${detail.payment.amount}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500">
                                Estado del pago
                              </span>
                              <p className="font-medium text-white">
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
                            className="rounded-sm bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors duration-200 hover:bg-amber-400"
                          >
                            Pre-ordenar
                          </Link>
                        )}
                        {CANCELLABLE_STATUSES.includes(detail.status) && (
                          <button
                            type="button"
                            onClick={() => setCancellingId(detail.id)}
                            className="cursor-pointer rounded-sm border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-900/30"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">
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
