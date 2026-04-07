import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export function getStripePublishableKey() {
  return publishableKey;
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
