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
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Pago</h1>
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
          <p>Tu reservacion ha expirado. Por favor, crea una nueva.</p>
          <Link
            to="/reservations/new"
            className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-700"
          >
            Crear nueva reservacion
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Pago exitoso</h1>
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <p>Tu reservacion ha sido confirmada.</p>
          {isAuthenticated ? (
            <Link
              to="/my-reservations"
              className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-700"
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Pago</h1>

      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="font-medium text-gray-900">Resumen de reservacion</h2>
        <dl className="mt-2 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <dt>Fecha</dt>
            <dd>{reservation.date}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Hora</dt>
            <dd>{reservation.start_time}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Personas</dt>
            <dd>{reservation.seats_requested}</dd>
          </div>
          {reservation.table && (
            <div className="flex justify-between">
              <dt>Mesa</dt>
              <dd>{reservation.table.name}</dd>
            </div>
          )}
          {reservation.payment && (
            <div className="flex justify-between font-medium text-gray-900">
              <dt>Deposito</dt>
              <dd>{formatCurrency(reservation.payment.amount)}</dd>
            </div>
          )}
        </dl>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <PaymentElement />
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="rounded-md bg-indigo-600 py-2 text-sm font-medium text-white
            transition-colors hover:bg-indigo-700
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
