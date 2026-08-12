import Stripe from "stripe";

/** Stripe is optional: without a key, /sponsor shows a "not open yet" state. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
