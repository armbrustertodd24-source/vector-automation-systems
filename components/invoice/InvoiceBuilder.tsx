"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CURRENCIES,
  FREE_MONTHLY_LIMIT,
  INVOICE_PRO_PRICE_LABEL,
  LS_DRAFT,
  LS_PROFILE,
  computeTotals,
  emptyInvoice,
  formatMoney,
  readUsage,
  recordDownload,
  suggestInvoiceNumber,
  todayISO,
  type BusinessProfile,
  type InvoiceDoc,
  type LineItem,
} from "@/lib/invoice"
import UpgradeButton from "@/components/invoice/UpgradeButton"

const inputCls =
  "w-full rounded-lg border border-inv-rim bg-inv-surface px-3 py-2 text-sm text-inv-ink placeholder:text-inv-muted/60 focus:border-inv-accent focus:outline-none focus:ring-2 focus:ring-inv-accent-soft"
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-inv-muted"

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

const MAX_LOGO_BYTES = 400_000

/**
 * Initial state readers. This component is only ever rendered client-side
 * (see BuilderShell's ssr:false), so localStorage is safe to touch in the
 * useState initializers — no hydration pass, no effects needed.
 */
function loadInitialDoc(): InvoiceDoc {
  try {
    const draft = window.localStorage.getItem(LS_DRAFT)
    if (draft) return { ...emptyInvoice(), ...(JSON.parse(draft) as InvoiceDoc) }
    const profile = window.localStorage.getItem(LS_PROFILE)
    if (profile) {
      const base = emptyInvoice()
      return { ...base, business: { ...base.business, ...(JSON.parse(profile) as BusinessProfile) } }
    }
  } catch {
    // Corrupt storage — start fresh.
  }
  return emptyInvoice()
}

function loadInitialBanner(): "success" | "cancelled" | null {
  const status = new URLSearchParams(window.location.search).get("status")
  return status === "success" || status === "cancelled" ? status : null
}

export default function InvoiceBuilder({ pro }: { pro: boolean }) {
  const [doc, setDoc] = useState<InvoiceDoc>(loadInitialDoc)
  const [used, setUsed] = useState(() => readUsage().count)
  const [generating, setGenerating] = useState(false)
  const [limitHit, setLimitHit] = useState(false)
  const [banner] = useState(loadInitialBanner)
  const logoInput = useRef<HTMLInputElement>(null)

  // Persist the working draft + business profile (external-system sync).
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_DRAFT, JSON.stringify(doc))
      window.localStorage.setItem(LS_PROFILE, JSON.stringify(doc.business))
    } catch {
      // Storage unavailable (private mode etc.) — the form still works.
    }
  }, [doc])

  const update = useCallback((patch: Partial<InvoiceDoc>) => {
    setDoc((d) => ({ ...d, ...patch }))
  }, [])
  const updateBusiness = (patch: Partial<InvoiceDoc["business"]>) =>
    setDoc((d) => ({ ...d, business: { ...d.business, ...patch } }))
  const updateClient = (patch: Partial<InvoiceDoc["client"]>) =>
    setDoc((d) => ({ ...d, client: { ...d.client, ...patch } }))
  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setDoc((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }))
  const addItem = () =>
    setDoc((d) => ({
      ...d,
      items: [...d.items, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }],
    }))
  const removeItem = (id: string) =>
    setDoc((d) => ({ ...d, items: d.items.length > 1 ? d.items.filter((it) => it.id !== id) : d.items }))

  const newInvoice = () =>
    setDoc((d) => ({
      ...emptyInvoice(),
      business: d.business,
      currency: d.currency,
      taxRate: d.taxRate,
      number: suggestInvoiceNumber(),
      issueDate: todayISO(),
    }))

  function onLogoPick(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) {
      alert("Please use a logo under 400 KB (PNG or JPEG).")
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateBusiness({ logoDataUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  async function onDownload() {
    if (!pro && used >= FREE_MONTHLY_LIMIT) {
      setLimitHit(true)
      return
    }
    setGenerating(true)
    try {
      // Loaded on demand so the form renders fast on first visit.
      const { renderInvoicePdf, downloadPdf } = await import("@/lib/invoice/pdf")
      const bytes = await renderInvoicePdf(doc, { pro })
      downloadPdf(bytes, `${doc.number || "invoice"}.pdf`)
      if (!pro) setUsed(recordDownload().count)
    } catch (err) {
      console.error("pdf render failed", err)
      alert("Sorry — the PDF could not be generated. Please check your inputs and try again.")
    } finally {
      setGenerating(false)
    }
  }

  const totals = computeTotals(doc)
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used)

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      {banner && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            banner === "success"
              ? "border-inv-rim-accent bg-inv-accent-soft text-inv-accent-dark"
              : "border-inv-rim bg-inv-surface-2 text-inv-muted"
          }`}
        >
          {banner === "success"
            ? "You're on Vector Invoice Pro — unlimited invoices, your logo, and no footer credit. Thank you!"
            : "Checkout was cancelled — no charge was made."}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Form column ── */}
        <div className="space-y-8">
          {/* Your business */}
          <section className="rounded-2xl border border-inv-rim bg-inv-surface p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-bold text-inv-ink">Your business</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name">
                <input
                  className={inputCls}
                  value={doc.business.name}
                  onChange={(e) => updateBusiness({ name: e.target.value })}
                  placeholder="Acme Plumbing LLC"
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  value={doc.business.email}
                  onChange={(e) => updateBusiness({ email: e.target.value })}
                  placeholder="you@business.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={doc.business.phone}
                  onChange={(e) => updateBusiness({ phone: e.target.value })}
                  placeholder="(555) 012-3456"
                />
              </Field>
              <Field label="Address">
                <textarea
                  className={`${inputCls} min-h-[38px]`}
                  rows={2}
                  value={doc.business.address}
                  onChange={(e) => updateBusiness({ address: e.target.value })}
                  placeholder={"123 Main St\nCanton, OH 44721"}
                />
              </Field>
            </div>

            {/* Branding — Pro */}
            <div className="mt-5 rounded-xl border border-dashed border-inv-rim bg-inv-surface-2/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-inv-ink">
                  Branding {!pro && <span className="ml-1 rounded bg-inv-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-inv-accent">PRO</span>}
                </p>
                {!pro && (
                  <UpgradeButton className="text-xs font-semibold text-inv-accent underline underline-offset-2 hover:text-inv-accent-dark">
                    Unlock for {INVOICE_PRO_PRICE_LABEL}
                  </UpgradeButton>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className={labelCls}>Logo (PNG/JPEG)</span>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    disabled={!pro}
                    onChange={(e) => onLogoPick(e.target.files?.[0])}
                    className="block text-xs text-inv-muted file:mr-3 file:rounded-lg file:border-0 file:bg-inv-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:opacity-40"
                  />
                </div>
                <div>
                  <span className={labelCls}>Accent color</span>
                  <input
                    type="color"
                    disabled={!pro}
                    value={doc.business.accentColor ?? "#0f766e"}
                    onChange={(e) => updateBusiness({ accentColor: e.target.value })}
                    className="h-8 w-14 cursor-pointer rounded border border-inv-rim bg-inv-surface disabled:opacity-40"
                  />
                </div>
                {pro && doc.business.logoDataUrl && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data-URL preview, not an optimizable asset */}
                    <img src={doc.business.logoDataUrl} alt="Logo preview" className="h-10 max-w-[120px] object-contain" />
                    <button
                      onClick={() => {
                        updateBusiness({ logoDataUrl: undefined })
                        if (logoInput.current) logoInput.current.value = ""
                      }}
                      className="text-xs text-inv-muted underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bill to + meta */}
          <section className="rounded-2xl border border-inv-rim bg-inv-surface p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-bold text-inv-ink">Invoice details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name">
                <input
                  className={inputCls}
                  value={doc.client.name}
                  onChange={(e) => updateClient({ name: e.target.value })}
                  placeholder="Client or company"
                />
              </Field>
              <Field label="Client email">
                <input
                  className={inputCls}
                  type="email"
                  value={doc.client.email}
                  onChange={(e) => updateClient({ email: e.target.value })}
                  placeholder="client@email.com"
                />
              </Field>
              <Field label="Client address" className="sm:col-span-2">
                <textarea
                  className={`${inputCls} min-h-[38px]`}
                  rows={2}
                  value={doc.client.address}
                  onChange={(e) => updateClient({ address: e.target.value })}
                />
              </Field>
              <Field label="Invoice #">
                <input className={inputCls} value={doc.number} onChange={(e) => update({ number: e.target.value })} />
              </Field>
              <Field label="Currency">
                <select
                  className={inputCls}
                  value={doc.currency}
                  onChange={(e) => update({ currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Issue date">
                <input
                  className={inputCls}
                  type="date"
                  value={doc.issueDate}
                  onChange={(e) => update({ issueDate: e.target.value })}
                />
              </Field>
              <Field label="Due date (blank = on receipt)">
                <input
                  className={inputCls}
                  type="date"
                  value={doc.dueDate}
                  onChange={(e) => update({ dueDate: e.target.value })}
                />
              </Field>
            </div>
          </section>

          {/* Line items */}
          <section className="rounded-2xl border border-inv-rim bg-inv-surface p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-bold text-inv-ink">Line items</h2>
            <div className="space-y-3">
              {doc.items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_64px_96px_28px] items-start gap-2 sm:grid-cols-[1fr_80px_120px_32px]">
                  <input
                    className={inputCls}
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    placeholder="Service or product description"
                  />
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    step="any"
                    value={it.quantity}
                    onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                    aria-label="Quantity"
                  />
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                    aria-label="Unit price"
                  />
                  <button
                    onClick={() => removeItem(it.id)}
                    className="mt-2 text-inv-muted transition hover:text-red-600"
                    aria-label="Remove line item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-4 rounded-lg border border-inv-rim px-3 py-1.5 text-sm font-semibold text-inv-accent transition hover:border-inv-rim-accent hover:bg-inv-accent-soft"
            >
              + Add item
            </button>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Field label="Tax rate (%)">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step="0.01"
                  value={doc.taxRate}
                  onChange={(e) => update({ taxRate: Number(e.target.value) })}
                />
              </Field>
              <Field label={`Discount (${doc.currency})`}>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step="0.01"
                  value={doc.discount}
                  onChange={(e) => update({ discount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Payment link (optional)">
                <input
                  className={inputCls}
                  type="url"
                  value={doc.paymentLink}
                  onChange={(e) => update({ paymentLink: e.target.value })}
                  placeholder="https://buy.stripe.com/…"
                />
              </Field>
            </div>

            <Field label="Notes / payment terms" className="mt-4 block">
              <textarea
                className={`${inputCls} min-h-[60px]`}
                rows={3}
                value={doc.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Payment due within 14 days. Thank you for your business!"
              />
            </Field>
          </section>
        </div>

        {/* ── Summary column ── */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-inv-rim bg-inv-surface p-5 shadow-sm">
            <h3 className="mb-3 font-display text-base font-bold text-inv-ink">Summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-inv-muted">
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotal, doc.currency)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-inv-muted">
                  <dt>Discount</dt>
                  <dd>−{formatMoney(totals.discount, doc.currency)}</dd>
                </div>
              )}
              {doc.taxRate > 0 && (
                <div className="flex justify-between text-inv-muted">
                  <dt>Tax ({doc.taxRate}%)</dt>
                  <dd>{formatMoney(totals.tax, doc.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-inv-rim pt-2 text-base font-bold text-inv-ink">
                <dt>Total due</dt>
                <dd className="text-inv-accent">{formatMoney(totals.total, doc.currency)}</dd>
              </div>
            </dl>

            <button
              onClick={onDownload}
              disabled={generating}
              className="mt-5 w-full rounded-xl bg-inv-accent px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-inv-accent-dark disabled:opacity-60"
            >
              {generating ? "Generating…" : "Download PDF"}
            </button>

            {!pro && (
              <p className="mt-3 text-center text-xs text-inv-muted">
                {remaining > 0
                  ? `${remaining} of ${FREE_MONTHLY_LIMIT} free invoices left this month`
                  : "Free limit reached for this month"}
              </p>
            )}

            <button
              onClick={newInvoice}
              className="mt-3 w-full rounded-xl border border-inv-rim px-4 py-2 text-xs font-semibold text-inv-muted transition hover:bg-inv-surface-2"
            >
              Start a new invoice
            </button>
          </div>

          {!pro && (
            <div className="rounded-2xl border border-inv-rim-accent bg-inv-accent-soft p-5">
              <h3 className="font-display text-base font-bold text-inv-ink">Vector Invoice Pro</h3>
              <ul className="mt-2 space-y-1 text-sm text-inv-muted">
                <li>• Unlimited invoices</li>
                <li>• Your logo + brand color on every PDF</li>
                <li>• No footer credit line</li>
              </ul>
              <UpgradeButton className="mt-4 w-full rounded-xl bg-inv-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-inv-accent-dark">
                Upgrade — {INVOICE_PRO_PRICE_LABEL}
              </UpgradeButton>
              <p className="mt-2 text-center text-[11px] text-inv-muted">Cancel anytime. Secure checkout by Stripe.</p>
            </div>
          )}

          <p className="px-1 text-center text-[11px] leading-relaxed text-inv-muted">
            Private by design: invoices are created on your device and never uploaded to our servers.
          </p>
        </aside>
      </div>

      {/* Free-limit modal */}
      {limitHit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setLimitHit(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-inv-rim bg-inv-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-inv-ink">You&apos;ve used your {FREE_MONTHLY_LIMIT} free invoices</h3>
            <p className="mt-2 text-sm text-inv-muted">
              The free plan includes {FREE_MONTHLY_LIMIT} invoice downloads per month. Go Pro for unlimited
              invoices, your logo on every PDF, and no footer credit.
            </p>
            <UpgradeButton className="mt-4 w-full rounded-xl bg-inv-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-inv-accent-dark">
              Upgrade — {INVOICE_PRO_PRICE_LABEL}
            </UpgradeButton>
            <button
              onClick={() => setLimitHit(false)}
              className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-semibold text-inv-muted hover:bg-inv-surface-2"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
