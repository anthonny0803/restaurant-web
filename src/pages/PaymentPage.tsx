import { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe";
import { useAuth } from "../context/AuthContext";
import type { Reservation } from "../types/api";

interface PaymentRouteState {
  clientSecret: string;
  reservation: Reservation;
}

interface CheckoutFormProps {
  reservation: Reservation;
}

function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function formatCurrency(amount: string): string {
  return `$${Number(amount).toFixed(2)}`;
}

function CheckoutForm({ reservation }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  if (isExpired(reservation.expires_at)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-4xl font-medium text-white">Pago</h1>
        <div className="mt-6 rounded-sm bg-red-900/30 p-4 text-sm text-red-400">
          <p>Tu reservacion ha expirado. Por favor, crea una nueva.</p>
          <Link
            to="/reservations/new"
            className="mt-2 inline-block font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
          >
            Crear nueva reservacion
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-4xl font-medium text-white">Pago exitoso</h1>
        <div className="mt-6 rounded-sm bg-emerald-900/30 p-4 text-sm text-emerald-400">
          <p>Tu reservacion ha sido confirmada.</p>
          {isAuthenticated ? (
            <Link
              to="/my-reservations"
              className="mt-2 inline-block font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
            >
              Ver mis reservaciones
            </Link>
          ) : (
            <p className="mt-2">
              Recibiras un correo con los detalles de tu reservacion.
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError("");

    const returnPath = isAuthenticated ? "/my-reservations" : "/";
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${returnPath}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Error al procesar el pago");
      setIsProcessing(false);
      return;
    }

    if (isAuthenticated) {
      navigate("/my-reservations");
      return;
    }

    setIsComplete(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 animate-fade-in-up">
      <h1 className="font-serif text-4xl font-medium text-white">Pago</h1>

      <div className="mt-8 rounded-sm border border-zinc-800 bg-zinc-800 p-6 shadow-lg">
        <h2 className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
          Resumen de reservacion
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Fecha</dt>
            <dd className="font-medium text-white">{reservation.date}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Hora</dt>
            <dd className="font-medium text-white">{reservation.start_time}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Personas</dt>
            <dd className="font-medium text-white">{reservation.seats_requested}</dd>
          </div>
          {reservation.table && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Mesa</dt>
              <dd className="font-medium text-white">{reservation.table.name}</dd>
            </div>
          )}
          {reservation.payment && (
            <div className="flex justify-between border-t border-zinc-700 pt-3">
              <dt className="font-medium text-white">Deposito</dt>
              <dd className="font-medium text-amber-500">
                {formatCurrency(reservation.payment.amount)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {error && (
        <p className="mt-6 rounded-sm bg-red-900/30 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <PaymentElement />
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="rounded-sm bg-amber-500 py-2.5 text-sm font-medium tracking-wide text-zinc-900
            transition-colors duration-200 hover:bg-amber-400
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? "Procesando..." : "Pagar deposito"}
        </button>
      </form>
    </div>
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const state = location.state as PaymentRouteState | null;

  if (!state?.clientSecret || !state?.reservation) {
    return <Navigate to="/reservations/new" replace />;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: state.clientSecret }}>
      <CheckoutForm reservation={state.reservation} />
    </Elements>
  );
}
