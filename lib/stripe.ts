/**
 * Stripe helpers.
 *
 * Security model: card data NEVER touches this server. Customers enter card
 * details on Stripe-hosted Checkout, so we only ever handle Stripe ids and
 * statuses. This keeps the project in PCI-DSS SAQ-A (the lightest tier).
 *
 * The client is created lazily so `next build` works without secrets set.
 */
import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    _stripe = new Stripe(key, { typescript: true })
  }
  return _stripe
}

export type PlanKey = "pro_monthly" | "pro_annual" | "founding" | "invoice_monthly"

interface PlanConfig {
  /** Stripe Price id, read from env (never hard-coded). */
  priceEnv: string
  /** Recurring subscription vs one-time payment. */
  mode: "subscription" | "payment"
  /** Value stored in subscriptions.plan once purchased. */
  plan: "pro" | "founding" | "invoice_pro"
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  pro_monthly: { priceEnv: "STRIPE_PRICE_PRO_MONTHLY", mode: "subscription", plan: "pro" },
  pro_annual: { priceEnv: "STRIPE_PRICE_PRO_ANNUAL", mode: "subscription", plan: "pro" },
  founding: { priceEnv: "STRIPE_PRICE_FOUNDING", mode: "payment", plan: "founding" },
  // Vector Invoice Pro — separate product from the Promptu learn plans.
  invoice_monthly: { priceEnv: "STRIPE_PRICE_INVOICE_MONTHLY", mode: "subscription", plan: "invoice_pro" },
}

export function getPriceId(planKey: PlanKey): string {
  const cfg = PLANS[planKey]
  const priceId = process.env[cfg.priceEnv]
  if (!priceId) throw new Error(`${cfg.priceEnv} is not set`)
  return priceId
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
