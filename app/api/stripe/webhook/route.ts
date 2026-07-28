/**
 * POST /api/stripe/webhook — receive verified Stripe events.
 *
 * Security:
 *  - The raw request body + the `stripe-signature` header are verified with
 *    STRIPE_WEBHOOK_SECRET. Unsigned/forged requests are rejected, so this
 *    endpoint cannot be used to fake a paid subscription.
 *  - We persist ONLY Stripe ids and status — never card data.
 *
 * Configure the endpoint URL ( /api/stripe/webhook ) in the Stripe dashboard
 * and copy its signing secret into STRIPE_WEBHOOK_SECRET.
 */
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import {
  getSubscriptionByCustomerId,
  applySubscriptionState,
} from "@/lib/db/queries"

export const runtime = "nodejs"

// Read a period-end timestamp defensively across Stripe API versions.
function readPeriodEnd(sub: Stripe.Subscription): Date | null {
  const top = (sub as unknown as { current_period_end?: number }).current_period_end
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined
  const secs = top ?? item?.current_period_end
  return typeof secs === "number" ? new Date(secs * 1000) : null
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  const payload = await request.text() // raw body required for verification

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (err) {
    console.error("webhook signature verification failed", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session
        const userId = cs.metadata?.userId
        const plan = cs.metadata?.plan ?? "pro"
        if (!userId) break

        if (cs.mode === "subscription" && cs.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            cs.subscription as string
          )
          await applySubscriptionState(userId, {
            plan,
            status: sub.status,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: readPeriodEnd(sub),
          })
        } else {
          // One-time payment (Founding) — lifetime access, no renewal.
          await applySubscriptionState(userId, {
            plan: "founding",
            status: "lifetime",
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const row = await getSubscriptionByCustomerId(sub.customer as string)
        if (!row) break
        await applySubscriptionState(row.userId, {
          // New checkouts stamp the product plan into subscription metadata;
          // older learn subscriptions predate that and default to "pro".
          plan: sub.metadata?.plan ?? "pro",
          status: sub.status,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: readPeriodEnd(sub),
        })
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const row = await getSubscriptionByCustomerId(sub.customer as string)
        if (!row) break
        await applySubscriptionState(row.userId, {
          plan: "free",
          status: "canceled",
          stripeSubscriptionId: null,
          currentPeriodEnd: readPeriodEnd(sub),
        })
        break
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (err) {
    console.error("webhook handler error", err)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
