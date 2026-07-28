import { auth } from "@/auth"
import { getSubscriptionByUserId } from "@/lib/db/queries"

const PAID_PLANS = new Set(["pro", "founding"])
const ACTIVE_STATUSES = new Set(["active", "trialing", "lifetime"])

/**
 * True if the signed-in user has an active paid plan (Pro or Founding).
 *
 * Returns false on any error (no session, auth/DB not configured, etc.) so the
 * site degrades safely to "locked" rather than crashing — and so the build,
 * which has no secrets, never throws here.
 */
export async function hasPaidAccess(): Promise<boolean> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return false
    const sub = await getSubscriptionByUserId(userId)
    return !!sub && PAID_PLANS.has(sub.plan) && ACTIVE_STATUSES.has(sub.status)
  } catch {
    return false
  }
}

/**
 * True if the signed-in user has an active Vector Invoice Pro subscription.
 * Deliberately separate from hasPaidAccess(): the learn plans and the invoice
 * plan are different products and never unlock each other.
 *
 * Note: the subscriptions table is one row per user, so a single user cannot
 * currently hold BOTH a learn plan and Invoice Pro. Acceptable at launch;
 * normalize with a `product` column if that overlap ever materializes.
 */
export async function hasInvoiceProAccess(): Promise<boolean> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return false
    const sub = await getSubscriptionByUserId(userId)
    return !!sub && sub.plan === "invoice_pro" && ACTIVE_STATUSES.has(sub.status)
  } catch {
    return false
  }
}
