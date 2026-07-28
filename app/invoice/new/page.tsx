import type { Metadata } from "next"
import { hasInvoiceProAccess } from "@/lib/access"
import BuilderShell from "@/components/invoice/BuilderShell"

export const metadata: Metadata = {
  title: "New invoice",
}

// Entitlement comes from the session cookie — always render per-request.
export const dynamic = "force-dynamic"

export default async function NewInvoicePage() {
  const pro = await hasInvoiceProAccess()
  return <BuilderShell pro={pro} />
}
