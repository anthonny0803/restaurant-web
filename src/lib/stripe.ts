import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string;

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
