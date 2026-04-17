import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../lib/form-errors";
import type { Reservation, Table, TimeSlot } from "../types/api";
import * as reservationService from "../services/reservation.service";
import * as guestService from "../services/guest.service";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface GuestForm {
  name: string;
  email: string;
  phone: string;
}

const GUEST_FIELDS: (keyof GuestForm)[] = ["name", "email", "phone"];

const STEP_LABELS = ["Buscar", "Elegir mesa", "Confirmar"];

const SEAT_GROUPS = [
  { label: "1-2", value: "2", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { label: "3-4", value: "4", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "5-6", value: "6", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "7-8", value: "8", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function NewReservationPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);
  const minDateStr = formatDate(today);
  const maxDateStr = formatDate(maxDate);

  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [seatsRequested, setSeatsRequested] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  useEffect(() => {
    if (!date || !seatsRequested) {
      setTimeSlots([]);
      return;
    }

    setIsSlotsLoading(true);
    setSlotsError("");
    setStartTime("");

    reservationService
      .getTimeSlots(date, Number(seatsRequested))
      .then((response) => setTimeSlots(response.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al cargar horarios";
        setSlotsError(message);
      })
      .finally(() => setIsSlotsLoading(false));
  }, [date, seatsRequested]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHoldSubmitting, setIsHoldSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit: handleGuestSubmit,
    setError: setGuestError,
    formState: { errors: guestErrors, isSubmitting: isGuestSubmitting },
  } = useForm<GuestForm>();

  const searchTables = async () => {
    if (!date || !startTime || !seatsRequested) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await reservationService.getAvailableTables({
        date,
        start_time: startTime,
        seats_requested: Number(seatsRequested),
      });

      if (response.data.length === 0) {
        setError("No hay mesas disponibles para los criterios seleccionados.");
        return;
      }

      setTables(response.data);
      setStep(2);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al buscar mesas";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPayment = (
    clientSecret: string,
    reservation: Reservation,
  ) => {
    navigate("/payment", { state: { clientSecret, reservation } });
  };

  const createRegisteredHold = async () => {
    if (!selectedTable) return;
    setIsHoldSubmitting(true);
    setError("");

    try {
      const response = await reservationService.createHold({
        table_id: selectedTable.id,
        seats_requested: Number(seatsRequested),
        date,
        start_time: startTime,
      });
      navigateToPayment(
        response.data.client_secret,
        response.data.reservation,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al crear la reservacion";
      setError(message);
    } finally {
      setIsHoldSubmitting(false);
    }
  };

  const createGuestHold = async (guestData: GuestForm) => {
    if (!selectedTable) return;

    try {
      const response = await guestService.createGuestReservation({
        ...guestData,
        table_id: selectedTable.id,
        seats_requested: Number(seatsRequested),
        date,
        start_time: startTime,
      });
      navigateToPayment(
        response.data.client_secret,
        response.data.reservation,
      );
    } catch (err) {
      handleApiError<GuestForm>(err, setGuestError, GUEST_FIELDS);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12 animate-fade-in-up">
      <h1 className="text-center font-serif text-4xl font-medium text-white">
        Reservar mesa
      </h1>
      <div className="mx-auto mt-3 h-px w-12 bg-amber-500" />

      <div className="mt-8 rounded-sm border border-zinc-700 bg-zinc-800 p-8 shadow-lg">

      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isCurrent = step === stepNum;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                    isCompleted
                      ? "bg-amber-500 text-zinc-900"
                      : isCurrent
                        ? "bg-white text-zinc-900 ring-2 ring-white ring-offset-2 ring-offset-zinc-800"
                        : "bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-xs tracking-wide ${
                    isCurrent ? "font-medium text-white" : "text-zinc-500"
                  }`}
                >
                  {label}
                </span>
              </div>

              {i < STEP_LABELS.length - 1 && (
                <div className="mx-2 mb-5 h-px flex-1">
                  <div
                    className={`h-full transition-colors duration-300 ${
                      isCompleted ? "bg-amber-500" : "bg-zinc-700"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-sm bg-red-900/30 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {slotsError && (
        <p className="mt-4 rounded-sm bg-red-900/30 p-3 text-sm text-red-400">
          {slotsError}
        </p>
      )}

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchTables();
          }}
          className="mt-6 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="date"
              className="text-sm font-medium text-zinc-400"
            >
              Fecha
            </label>
            <input
              id="date"
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-sm border border-zinc-600 bg-zinc-700 px-3 py-2.5 text-sm text-white outline-none
                transition-colors duration-200 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-400">Personas</span>
            <div className="grid grid-cols-4 gap-2">
              {SEAT_GROUPS.map((group) => (
                <button
                  key={group.value}
                  type="button"
                  onClick={() => setSeatsRequested(group.value)}
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-sm px-3 py-3 transition-all duration-200 ${
                    seatsRequested === group.value
                      ? "bg-amber-500 text-zinc-900 shadow-sm"
                      : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={group.icon} />
                  </svg>
                  <span className="text-xs font-medium">{group.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-400">Hora</span>
            {!date || !seatsRequested ? (
              <p className="text-sm text-zinc-500">Selecciona fecha y personas primero</p>
            ) : isSlotsLoading ? (
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-sm bg-zinc-700" />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay horarios disponibles para esta fecha</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {timeSlots.map((slot) => {
                  const isBlocked = slot.status === "blocked";
                  const isSelected = startTime === slot.start_time;

                  return (
                    <button
                      key={slot.start_time}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => setStartTime(slot.start_time)}
                      className={`rounded-sm px-2 py-2 text-xs font-medium transition-all duration-200 ${
                        isBlocked
                          ? "border border-zinc-800 bg-zinc-800 text-zinc-600 line-through cursor-not-allowed"
                          : isSelected
                            ? "cursor-pointer bg-amber-500 text-zinc-900 shadow-sm"
                            : "cursor-pointer border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      {slot.start_time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !date || !startTime || !seatsRequested}
            className="cursor-pointer rounded-sm bg-amber-500 py-2.5 text-sm font-medium tracking-wide text-zinc-900
              transition-colors duration-200 hover:bg-amber-600
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Buscando..." : "Buscar mesas disponibles"}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="mt-6">
          <p className="text-sm text-zinc-500">
            {tables.length}{" "}
            {tables.length === 1 ? "mesa disponible" : "mesas disponibles"}{" "}
            para {date} a las {startTime}
          </p>

          <div className="mt-4 grid gap-3">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTable(table)}
                className={`cursor-pointer rounded-sm border p-5 text-left transition-all duration-200 ${
                  selectedTable?.id === table.id
                    ? "border-amber-500 bg-amber-500/10 text-white"
                    : "border-zinc-700 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <p className="font-medium">{table.name}</p>
                <p className={`mt-1 text-sm ${
                  selectedTable?.id === table.id ? "text-amber-400" : "text-zinc-500"
                }`}>
                  {table.min_capacity}-{table.max_capacity} personas · {table.location}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedTable(null);
                setError("");
              }}
              className="cursor-pointer rounded-sm border border-zinc-700 px-4 py-2.5 text-sm
                font-medium text-zinc-400 transition-colors duration-200 hover:border-zinc-500 hover:text-white"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!selectedTable}
              className="cursor-pointer rounded-sm bg-amber-500 px-4 py-2.5 text-sm font-medium tracking-wide text-zinc-900
                transition-colors duration-200 hover:bg-amber-400
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedTable && (
        <div className="mt-6">
          <div className="rounded-sm border border-zinc-600 bg-zinc-700 p-5">
            <h2 className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
              Resumen
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Fecha</dt>
                <dd className="font-medium text-white">{date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Hora</dt>
                <dd className="font-medium text-white">{startTime}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Personas</dt>
                <dd className="font-medium text-white">{seatsRequested}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Mesa</dt>
                <dd className="font-medium text-white">{selectedTable.name}</dd>
              </div>
            </dl>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={createRegisteredHold}
              disabled={isHoldSubmitting}
              className="mt-6 w-full cursor-pointer rounded-sm bg-amber-500 py-2.5 text-sm font-medium
                tracking-wide text-zinc-900 transition-colors duration-200 hover:bg-amber-600
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isHoldSubmitting ? "Reservando..." : "Reservar"}
            </button>
          ) : (
            <form
              onSubmit={handleGuestSubmit(createGuestHold)}
              className="mt-6 flex flex-col gap-4"
            >
              <p className="text-sm text-zinc-400">
                Ingresa tus datos para continuar con la reservacion.
              </p>

              {guestErrors.root?.message && (
                <p className="rounded-sm bg-red-900/30 p-3 text-sm text-red-400">
                  {guestErrors.root.message}
                </p>
              )}

              <FormField<GuestForm>
                label="Nombre"
                name="name"
                register={register}
                errors={guestErrors}
              />

              <FormField<GuestForm>
                label="Correo electronico"
                name="email"
                type="email"
                register={register}
                errors={guestErrors}
              />

              <FormField<GuestForm>
                label="Telefono"
                name="phone"
                type="tel"
                register={register}
                errors={guestErrors}
              />

              <SubmitButton
                label="Reservar"
                loadingLabel="Reservando..."
                isSubmitting={isGuestSubmitting}
              />
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setStep(2);
              setError("");
            }}
            className="mt-3 w-full cursor-pointer rounded-sm border border-zinc-700 py-2.5 text-sm
              font-medium text-zinc-400 transition-colors duration-200 hover:border-zinc-500 hover:text-white"
          >
            Volver
          </button>
        </div>
      )}

      </div>
    </div>
  );
}
