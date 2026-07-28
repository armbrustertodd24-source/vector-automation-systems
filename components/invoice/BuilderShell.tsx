"use client"

import dynamic from "next/dynamic"

/**
 * The builder is local-first: its initial state comes straight from
 * localStorage, so it must never server-render (there is nothing useful to
 * SSR and skipping it avoids hydration mismatches entirely).
 */
const InvoiceBuilder = dynamic(() => import("./InvoiceBuilder"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-inv-muted">
      Loading your invoice…
    </div>
  ),
})

export default function BuilderShell({ pro }: { pro: boolean }) {
  return <InvoiceBuilder pro={pro} />
}
