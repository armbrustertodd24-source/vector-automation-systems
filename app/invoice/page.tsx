import Link from "next/link"
import type { Metadata } from "next"
import { FREE_MONTHLY_LIMIT, INVOICE_PRO_PRICE_LABEL } from "@/lib/invoice"

export const metadata: Metadata = {
  title: "Free invoice maker — professional PDF invoices in 60 seconds",
}

const FREE_FEATURES = [
  `${FREE_MONTHLY_LIMIT} invoices per month`,
  "Professional PDF download",
  "Tax, discounts & payment links",
  "Works on phone, tablet & desktop",
  "No account. No ads. Ever.",
]

const PRO_FEATURES = [
  "Unlimited invoices",
  "Your logo on every PDF",
  "Custom brand color",
  "No footer credit line",
  "Everything in Free",
]

export default function InvoiceLanding() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:pt-24">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Professional invoices in <span className="text-inv-accent">60 seconds</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-inv-muted">
          Fill in your details, download a clean PDF, get paid. No account required, no ads,
          and your invoice data never leaves your device.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/invoice/new"
            className="rounded-xl bg-inv-accent px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-inv-accent-dark"
          >
            Create a free invoice
          </Link>
          <Link
            href="#pricing"
            className="rounded-xl border border-inv-rim px-7 py-3.5 text-base font-semibold text-inv-muted transition hover:bg-inv-surface"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-inv-muted">Free forever for {FREE_MONTHLY_LIMIT} invoices a month. No card required.</p>
      </section>

      {/* Why */}
      <section className="border-y border-inv-rim bg-inv-surface py-14">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-3">
          {[
            {
              title: "Private by design",
              body: "Invoices are generated entirely on your device. We never see, store, or sell your client data — there's nothing to breach.",
            },
            {
              title: "No subscription tricks",
              body: "The free plan is genuinely useful, and Pro is one honest price. No features yanked behind a paywall later.",
            },
            {
              title: "Get paid faster",
              body: "Drop in your Stripe or PayPal payment link and every PDF includes a clickable “Pay online” button for your client.",
            },
          ].map((f) => (
            <div key={f.title}>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-inv-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold">Simple pricing</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-inv-rim bg-inv-surface p-6">
            <h3 className="font-display text-xl font-bold">Free</h3>
            <p className="mt-1 text-3xl font-extrabold">
              $0<span className="text-sm font-medium text-inv-muted"> forever</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-inv-muted">
              {FREE_FEATURES.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link
              href="/invoice/new"
              className="mt-6 block rounded-xl border border-inv-rim py-2.5 text-center text-sm font-bold text-inv-ink transition hover:bg-inv-surface-2"
            >
              Start free
            </Link>
          </div>
          <div className="relative rounded-2xl border-2 border-inv-accent bg-inv-surface p-6 shadow-md">
            <span className="absolute -top-3 left-6 rounded-full bg-inv-accent px-3 py-0.5 text-xs font-bold text-white">
              MOST POPULAR
            </span>
            <h3 className="font-display text-xl font-bold">Pro</h3>
            <p className="mt-1 text-3xl font-extrabold">
              {INVOICE_PRO_PRICE_LABEL.replace("/mo", "")}
              <span className="text-sm font-medium text-inv-muted">/month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-inv-muted">
              {PRO_FEATURES.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link
              href="/invoice/new"
              className="mt-6 block rounded-xl bg-inv-accent py-2.5 text-center text-sm font-bold text-white transition hover:bg-inv-accent-dark"
            >
              Try it, then upgrade in-app
            </Link>
            <p className="mt-2 text-center text-[11px] text-inv-muted">Cancel anytime. Checkout by Stripe.</p>
          </div>
        </div>
      </section>
    </>
  )
}
