import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { INVOICE_BRAND, INVOICE_TAGLINE } from "@/lib/invoice"

export const metadata: Metadata = {
  metadataBase: new URL("https://vectorautomationsystems.com"),
  title: {
    default: `${INVOICE_BRAND} — Free invoice maker for small businesses`,
    template: `%s | ${INVOICE_BRAND}`,
  },
  description: `${INVOICE_TAGLINE} Create a professional PDF invoice free — no ads, no watermark on your line items, and your data never leaves your device.`,
  manifest: "/invoice.webmanifest",
  icons: {
    icon: "/invoice-icon-192.png",
    apple: "/invoice-icon-180.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f766e",
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-inv-bg font-sans text-inv-ink">
      <header className="border-b border-inv-rim bg-inv-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/invoice" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-inv-accent text-sm font-black text-white">V</span>
            {INVOICE_BRAND}
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/invoice#pricing" className="text-inv-muted transition hover:text-inv-ink">
              Pricing
            </Link>
            <Link
              href="/invoice/new"
              className="rounded-lg bg-inv-accent px-3 py-1.5 text-white transition hover:bg-inv-accent-dark"
            >
              New invoice
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-inv-rim py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-xs text-inv-muted">
          <p>
            {INVOICE_BRAND} is built by{" "}
            <Link href="/" className="font-semibold text-inv-accent hover:underline">
              Vector Automation Systems
            </Link>
          </p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
