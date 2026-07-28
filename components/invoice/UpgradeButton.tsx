"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Starts Stripe Checkout for Vector Invoice Pro. Mirrors the learn site's
 * SubscribeButton: a 401 from the checkout API routes through Auth.js
 * sign-in first, returning to the invoice builder afterwards.
 */
export default function UpgradeButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "invoice_monthly", returnPath: "/invoice/new" }),
      })

      if (res.status === 401) {
        window.location.href =
          "/api/auth/signin?callbackUrl=" + encodeURIComponent("/invoice/new")
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
        alert("Sorry — checkout is not available right now. Please try again.")
      }
    } catch {
      setLoading(false)
      alert("Sorry — checkout is not available right now. Please try again.")
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(className, loading && "opacity-70 cursor-not-allowed")}
    >
      {loading ? "Redirecting…" : children}
    </button>
  )
}
