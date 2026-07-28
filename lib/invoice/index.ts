/**
 * Vector Invoice — core types, math, and local persistence keys.
 *
 * Local-first: invoices, the business profile, and saved clients live in the
 * browser (localStorage), never on our servers. The server is only involved
 * for auth + Stripe entitlement checks. This is a deliberate selling point —
 * "your invoices never leave your device" — and it keeps us out of scope for
 * storing customer financial data.
 */

export const INVOICE_BRAND = "Vector Invoice"
export const INVOICE_TAGLINE = "Professional invoices in 60 seconds. No account required."

/** Invoices a visitor can download per calendar month on the free tier. */
export const FREE_MONTHLY_LIMIT = 3

export const INVOICE_PRO_PRICE_LABEL = "$9/mo"

export interface BusinessProfile {
  name: string
  email: string
  phone: string
  address: string
  /** Pro: data-URL of an uploaded PNG/JPEG logo, rendered on the PDF. */
  logoDataUrl?: string
  /** Pro: accent color used for PDF headings/rules. Hex like "#1d4ed8". */
  accentColor?: string
}

export interface ClientInfo {
  name: string
  email: string
  address: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceDoc {
  number: string
  issueDate: string // ISO yyyy-mm-dd
  dueDate: string // ISO yyyy-mm-dd, empty = due on receipt
  currency: string // ISO 4217, e.g. "USD"
  business: BusinessProfile
  client: ClientInfo
  items: LineItem[]
  /** Percentage, e.g. 7.25 */
  taxRate: number
  /** Flat discount amount in invoice currency. */
  discount: number
  notes: string
  /** Optional "Pay online" URL (user's Stripe/PayPal/etc. payment link). */
  paymentLink: string
}

export interface InvoiceTotals {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export function computeTotals(doc: Pick<InvoiceDoc, "items" | "taxRate" | "discount">): InvoiceTotals {
  const subtotal = doc.items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  )
  const discount = Math.min(Math.max(Number(doc.discount) || 0, 0), subtotal)
  const taxable = subtotal - discount
  const tax = taxable * ((Number(doc.taxRate) || 0) / 100)
  return { subtotal, discount, tax, total: taxable + tax }
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
  } catch {
    // Unknown currency code typed mid-edit — fall back rather than crash.
    return `${currency} ${amount.toFixed(2)}`
  }
}

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "MXN"] as const

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** e.g. "INV-2026-0714" — date-seeded so numbers look professional out of the box. */
export function suggestInvoiceNumber(): string {
  const d = new Date()
  const seq = String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0")
  return `INV-${d.getFullYear()}-${seq}`
}

export function emptyInvoice(): InvoiceDoc {
  return {
    number: suggestInvoiceNumber(),
    issueDate: todayISO(),
    dueDate: "",
    currency: "USD",
    business: { name: "", email: "", phone: "", address: "" },
    client: { name: "", email: "", address: "" },
    items: [{ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    discount: 0,
    notes: "",
    paymentLink: "",
  }
}

/* ── localStorage keys (client-only; guarded by callers) ── */

export const LS_PROFILE = "vi.profile"
export const LS_DRAFT = "vi.draft"
export const LS_CLIENTS = "vi.clients"
export const LS_USAGE = "vi.usage" // { month: "2026-07", count: number }

export interface UsageRecord {
  month: string
  count: number
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export function readUsage(): UsageRecord {
  if (typeof window === "undefined") return { month: currentMonthKey(), count: 0 }
  try {
    const raw = window.localStorage.getItem(LS_USAGE)
    if (raw) {
      const parsed = JSON.parse(raw) as UsageRecord
      if (parsed.month === currentMonthKey()) return parsed
    }
  } catch {
    // Corrupt storage — treat as fresh month.
  }
  return { month: currentMonthKey(), count: 0 }
}

export function recordDownload(): UsageRecord {
  const next = { month: currentMonthKey(), count: readUsage().count + 1 }
  try {
    window.localStorage.setItem(LS_USAGE, JSON.stringify(next))
  } catch {
    // Storage full/blocked — never break the download over the counter.
  }
  return next
}
