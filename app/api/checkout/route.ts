/**
 * POST /api/checkout — start a Stripe Checkout session.
 *
 * Auth-gated: only a signed-in user can begin checkout, and the session is
 * always tied to that user (client_reference_id + metadata.userId) so the
 * webhook can attribute the purchase. Card entry happens on Stripe's hosted
 * page — no card data is handled here.
 *
 * Body: { "plan": "pro_monthly" | "pro_annual" | "founding" | "invoice_monthly",
 *         "returnPath"?: one of RETURN_PATHS }
 * Returns: { url } to redirect the browser to.
 */
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getStripe, getPriceId, appUrl, PLANS, type PlanKey } from "@/lib/stripe"
import {
  ensureSubscriptionRow,
  setStripeCustomerId,
} from "@/lib/db/queries"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let planKey: PlanKey
  let returnPath = "/learn/pricing"
  try {
    const body = await request.json()
    planKey = body.plan
    // Allowlisted so the redirect target can't be pointed off-site.
    const RETURN_PATHS = new Set(["/learn/pricing", "/invoice", "/invoice/new"])
    if (typeof body.returnPath === "string" && RETURN_PATHS.has(body.returnPath)) {
      returnPath = body.returnPath
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!planKey || !(planKey in PLANS)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 })
  }

  const cfg = PLANS[planKey]
  const stripe = getStripe()

  try {
    // Reuse (or create) this user's Stripe customer so all purchases roll up
    // under one customer record.
    const subRow = await ensureSubscriptionRow(session.user.id)
    let customerId = subRow.stripeCustomerId ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        metadata: { userId: session.user.id },
      })
      customerId = customer.id
      await setStripeCustomerId(session.user.id, customerId)
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: cfg.mode,
      customer: customerId,
      line_items: [{ price: getPriceId(planKey), quantity: 1 }],
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id, planKey, plan: cfg.plan },
      // Stamp the plan onto the subscription itself so renewal webhooks
      // (customer.subscription.updated) know which product this is.
      ...(cfg.mode === "subscription"
        ? { subscription_data: { metadata: { userId: session.user.id, plan: cfg.plan } } }
        : {}),
      success_url: `${appUrl()}${returnPath}?status=success`,
      cancel_url: `${appUrl()}${returnPath}?status=cancelled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error("checkout error", err)
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
  }
}
