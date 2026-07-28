# Vector Invoice — launch checklist

The app is live at `/invoice` (landing + pricing) and `/invoice/new` (builder)
as soon as this branch deploys. The free tier works with **zero configuration**
— PDFs are generated entirely in the browser. Only the Pro upgrade needs setup.

## Required for Pro purchases (one-time, ~10 minutes)

1. **Stripe** → Products → Add product: "Vector Invoice Pro", recurring, $9/month.
2. Copy the price id into the deployment env: `STRIPE_PRICE_INVOICE_MONTHLY=price_...`
   (all other Stripe/auth env vars are already set for the learn product).
3. Redeploy. That's it — checkout, webhooks, and entitlements reuse the
   existing `/api/checkout` and `/api/stripe/webhook` plumbing.

## What each tier gets

| | Free | Pro ($9/mo) |
|---|---|---|
| Invoices per month | 3 | Unlimited |
| PDF download, tax/discount, payment link | ✓ | ✓ |
| Logo + custom accent color on PDF | — | ✓ |
| "Created with Vector Invoice" footer line | shown | removed |

Free-tier limits are enforced client-side (localStorage). That's intentional:
PDF generation costs us nothing server-side, the counter is a nudge toward Pro,
not a security boundary, and it means the free tool works with no account.

## Privacy posture (marketing claim — keep it true)

Invoice contents (client names, amounts, logos) are **never sent to the
server**. They live in the visitor's localStorage and the PDF is rendered
in-browser with pdf-lib. If we ever add server-side features (email sending,
cloud sync), the landing-page copy and this claim must be revisited.

## Known limitation

The `subscription` table is one row per user, so one account can't hold BOTH a
Promptu learn plan and Invoice Pro simultaneously. Near-zero overlap expected at
launch; add a `product` column if it materializes.

## PWA / app-store pipeline (next steps)

- Installable today: Chrome/Android "Add to Home Screen" uses
  `public/invoice.webmanifest` (standalone window, teal icon). iOS Safari
  Add-to-Home-Screen works via the apple touch icon.
- Play Store: register the developer account as an **organization** (LLC +
  D-U-N-S) to skip the 12-tester/14-day closed-testing rule, then wrap with
  Capacitor (or Bubblewrap/TWA, since this is already a functioning web app).
- App Store: enroll in the Apple Developer Program now; first-app review runs
  3–7 days.
