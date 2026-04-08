import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../lib/form-errors";
import type { Reservation, Table } from "../types/api";
import * as reservationService from "../services/reservation.service";
import * as guestService from "../services/guest.service";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 12; hour <= 22; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    if (hour < 22) {
      slots.push(`${String(hour).padStart(2, "0")}:30`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface GuestForm {
  name: string;
  email: string;
  phone: string;
}

const GUEST_FIELDS: (keyof GuestForm)[] = ["name", "email", "phone"];

const STEP_LABELS = ["Buscar", "Elegir mesa", "Confirmar"];

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
        response.data.payment_intent_client_secret,
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
        response.data.payment_intent_client_secret,
        response.data.reservation,
      );
    } catch (err) {
      handleApiError<GuestForm>(err, setGuestError, GUEST_FIELDS);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Nueva reservacion</h1>

      <div className="mt-4 flex gap-2 text-sm">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 ${
              step === i + 1
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchTables();
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="date"
              className="text-sm font-medium text-gray-700"
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
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none
                transition-colors focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="start_time"
              className="text-sm font-medium text-gray-700"
            >
              Hora
            </label>
            <select
              id="start_time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none
                transition-colors focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecciona una hora</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="seats"
              className="text-sm font-medium text-gray-700"
            >
              Personas
            </label>
            <input
              id="seats"
              type="number"
              min="1"
              value={seatsRequested}
              onChange={(e) => setSeatsRequested(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none
                transition-colors focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-indigo-600 py-2 text-sm font-medium text-white
              transition-colors hover:bg-indigo-700
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Buscando..." : "Buscar mesas disponibles"}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="mt-6">
          <p className="text-sm text-gray-600">
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
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedTable?.id === table.id
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900">{table.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {table.min_capacity}-{table.max_capacity} personas ·{" "}
                  {table.location}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedTable(null);
                setError("");
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
                font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!selectedTable}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                transition-colors hover:bg-indigo-700
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedTable && (
        <div className="mt-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="font-medium text-gray-900">Resumen</h2>
            <dl className="mt-2 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>Fecha</dt>
                <dd>{date}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Hora</dt>
                <dd>{startTime}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Personas</dt>
                <dd>{seatsRequested}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Mesa</dt>
                <dd>{selectedTable.name}</dd>
              </div>
            </dl>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={createRegisteredHold}
              disabled={isHoldSubmitting}
              className="mt-6 w-full rounded-md bg-indigo-600 py-2 text-sm font-medium
                text-white transition-colors hover:bg-indigo-700
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isHoldSubmitting ? "Reservando..." : "Reservar"}
            </button>
          ) : (
            <form
              onSubmit={handleGuestSubmit(createGuestHold)}
              className="mt-6 flex flex-col gap-4"
            >
              <p className="text-sm text-gray-600">
                Ingresa tus datos para continuar con la reservacion.
              </p>

              {guestErrors.root?.message && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
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
            className="mt-3 w-full rounded-md border border-gray-300 bg-white py-2 text-sm
              font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
