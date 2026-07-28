/**
 * Client-side PDF renderer for Vector Invoice.
 *
 * Runs entirely in the browser with pdf-lib — invoice contents never touch
 * the server. Letter-size layout: header (logo/business), meta, bill-to,
 * items table with wrapping + page breaks, totals, notes, payment link.
 */
import {
  PDFDocument,
  PDFFont,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib"
import { computeTotals, formatMoney, type InvoiceDoc } from "./index"

const PAGE_W = 612 // US Letter, points
const PAGE_H = 792
const MARGIN = 50
const CONTENT_W = PAGE_W - MARGIN * 2

const DEFAULT_ACCENT = "#0f766e"

const GRAY = rgb(0.42, 0.45, 0.5)
const INK = rgb(0.12, 0.14, 0.16)
const RULE = rgb(0.88, 0.89, 0.91)

function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hexToRgb(DEFAULT_ACCENT)
  const n = parseInt(m[1], 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  for (const raw of text.split(/\r?\n/)) {
    const words = raw.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push("")
      continue
    }
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate
      } else {
        if (line) lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines
}

function fmtDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export interface RenderOptions {
  /** Pro renders logo + accent color and omits the footer credit. */
  pro: boolean
}

export async function renderInvoicePdf(doc: InvoiceDoc, opts: RenderOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const accent = opts.pro && doc.business.accentColor ? hexToRgb(doc.business.accentColor) : hexToRgb(DEFAULT_ACCENT)

  pdf.setTitle(`Invoice ${doc.number}`)
  pdf.setAuthor(doc.business.name || "Vector Invoice")

  let page = pdf.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN
  }
  /** Ensure room for `needed` points, else start a new page. */
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 30) newPage()
  }
  const text = (
    s: string,
    x: number,
    opts2: { size?: number; font?: PDFFont; color?: RGB } = {}
  ) => {
    page.drawText(s, {
      x,
      y,
      size: opts2.size ?? 10,
      font: opts2.font ?? font,
      color: opts2.color ?? INK,
    })
  }
  const rightText = (
    s: string,
    rightEdge: number,
    opts2: { size?: number; font?: PDFFont; color?: RGB } = {}
  ) => {
    const f = opts2.font ?? font
    const size = opts2.size ?? 10
    page.drawText(s, { x: rightEdge - f.widthOfTextAtSize(s, size), y, size, font: f, color: opts2.color ?? INK })
  }

  /* ── Header ── */
  let logoBottom = y
  if (opts.pro && doc.business.logoDataUrl) {
    try {
      const dataUrl = doc.business.logoDataUrl
      const bytes = Uint8Array.from(atob(dataUrl.split(",")[1] ?? ""), (c) => c.charCodeAt(0))
      const img = dataUrl.startsWith("data:image/png")
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes)
      const maxW = 140
      const maxH = 48
      const scale = Math.min(maxW / img.width, maxH / img.height, 1)
      const w = img.width * scale
      const h = img.height * scale
      page.drawImage(img, { x: MARGIN, y: y - h, width: w, height: h })
      logoBottom = y - h
    } catch {
      // Bad image data — skip the logo rather than fail the whole PDF.
    }
  }

  // Business block, right-aligned.
  const bizLines = [
    { s: doc.business.name, f: bold, size: 12, color: INK },
    ...doc.business.address.split(/\r?\n/).filter(Boolean).map((s) => ({ s, f: font, size: 9, color: GRAY })),
    ...[doc.business.email, doc.business.phone].filter(Boolean).map((s) => ({ s, f: font, size: 9, color: GRAY })),
  ].filter((l) => l.s)
  let by = y - 2
  for (const l of bizLines) {
    page.drawText(l.s, {
      x: PAGE_W - MARGIN - l.f.widthOfTextAtSize(l.s, l.size),
      y: by - l.size,
      size: l.size,
      font: l.f,
      color: l.color,
    })
    by -= l.size + 4
  }

  y = Math.min(logoBottom, by) - 28

  text("INVOICE", MARGIN, { size: 26, font: bold, color: accent })
  y -= 34
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1.5,
    color: accent,
  })
  y -= 24

  /* ── Meta + Bill To ── */
  const metaX = PAGE_W - MARGIN - 190
  const metaRows: Array<[string, string]> = [
    ["Invoice #", doc.number],
    ["Issue date", fmtDate(doc.issueDate)],
    ["Due date", doc.dueDate ? fmtDate(doc.dueDate) : "Due on receipt"],
  ]

  const billToTop = y
  text("BILL TO", MARGIN, { size: 8.5, font: bold, color: GRAY })
  y -= 15
  const clientLines = [
    { s: doc.client.name, f: bold, size: 11 },
    ...doc.client.address.split(/\r?\n/).filter(Boolean).map((s) => ({ s, f: font, size: 9.5 })),
    ...(doc.client.email ? [{ s: doc.client.email, f: font, size: 9.5 }] : []),
  ].filter((l) => l.s)
  for (const l of clientLines) {
    text(l.s, MARGIN, { size: l.size, font: l.f })
    y -= l.size + 4
  }
  const billToBottom = y

  // Meta column (drawn against saved top).
  let my = billToTop
  for (const [label, value] of metaRows) {
    page.drawText(label, { x: metaX, y: my, size: 9, font, color: GRAY })
    page.drawText(value, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(value, 9.5),
      y: my,
      size: 9.5,
      font: bold,
      color: INK,
    })
    my -= 16
  }

  y = Math.min(billToBottom, my) - 24

  /* ── Items table ── */
  const COL_QTY_W = 50
  const COL_UNIT_W = 80
  const COL_AMT_W = 90
  const COL_DESC_W = CONTENT_W - COL_QTY_W - COL_UNIT_W - COL_AMT_W
  const xDesc = MARGIN
  const xQtyR = MARGIN + COL_DESC_W + COL_QTY_W
  const xUnitR = xQtyR + COL_UNIT_W
  const xAmtR = xUnitR + COL_AMT_W

  const drawTableHead = () => {
    ensure(30)
    text("DESCRIPTION", xDesc, { size: 8.5, font: bold, color: GRAY })
    rightText("QTY", xQtyR, { size: 8.5, font: bold, color: GRAY })
    rightText("UNIT PRICE", xUnitR, { size: 8.5, font: bold, color: GRAY })
    rightText("AMOUNT", xAmtR, { size: 8.5, font: bold, color: GRAY })
    y -= 8
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.75, color: RULE })
    y -= 16
  }

  drawTableHead()
  const items = doc.items.filter((it) => it.description || it.unitPrice)
  for (const it of items) {
    const lines = wrap(font, it.description || "—", 10, COL_DESC_W - 10)
    const rowH = lines.length * 14 + 8
    if (y - rowH < MARGIN + 30) {
      newPage()
      drawTableHead()
    }
    const amount = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
    // First line carries the numeric columns.
    text(lines[0], xDesc, { size: 10 })
    rightText(String(it.quantity), xQtyR, { size: 10 })
    rightText(formatMoney(Number(it.unitPrice) || 0, doc.currency), xUnitR, { size: 10 })
    rightText(formatMoney(amount, doc.currency), xAmtR, { size: 10, font: bold })
    y -= 14
    for (const l of lines.slice(1)) {
      text(l, xDesc, { size: 10 })
      y -= 14
    }
    y -= 4
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: RULE })
    y -= 14
  }

  /* ── Totals ── */
  const totals = computeTotals(doc)
  const totalRows: Array<[string, string, boolean]> = [
    ["Subtotal", formatMoney(totals.subtotal, doc.currency), false],
    ...(totals.discount > 0
      ? ([["Discount", `−${formatMoney(totals.discount, doc.currency)}`, false]] as Array<[string, string, boolean]>)
      : []),
    ...(doc.taxRate > 0
      ? ([[`Tax (${doc.taxRate}%)`, formatMoney(totals.tax, doc.currency), false]] as Array<[string, string, boolean]>)
      : []),
    ["Total due", formatMoney(totals.total, doc.currency), true],
  ]
  ensure(totalRows.length * 18 + 20)
  const labelX = xUnitR - 60
  for (const [label, value, isTotal] of totalRows) {
    if (isTotal) {
      y -= 4
      page.drawLine({ start: { x: labelX - 10, y: y + 14 }, end: { x: xAmtR, y: y + 14 }, thickness: 1, color: accent })
    }
    page.drawText(label, {
      x: labelX,
      y,
      size: isTotal ? 11 : 9.5,
      font: isTotal ? bold : font,
      color: isTotal ? accent : GRAY,
    })
    rightText(value, xAmtR, { size: isTotal ? 12 : 10, font: isTotal ? bold : font, color: isTotal ? accent : INK })
    y -= isTotal ? 22 : 17
  }

  /* ── Payment link ── */
  if (doc.paymentLink) {
    ensure(40)
    y -= 8
    const label = "Pay online: "
    const size = 10
    text(label, MARGIN, { size, font: bold })
    const linkX = MARGIN + bold.widthOfTextAtSize(label, size)
    page.drawText(doc.paymentLink, { x: linkX, y, size, font, color: accent })
    const linkW = font.widthOfTextAtSize(doc.paymentLink, size)
    const annot = pdf.context.register(
      pdf.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [linkX, y - 2, linkX + linkW, y + size],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(doc.paymentLink) },
      })
    )
    const existing = page.node.lookup(PDFName.of("Annots"))
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(existing as any).push(annot)
    } else {
      page.node.set(PDFName.of("Annots"), pdf.context.obj([annot]))
    }
    y -= 24
  }

  /* ── Notes ── */
  if (doc.notes) {
    const lines = wrap(font, doc.notes, 9, CONTENT_W)
    ensure(lines.length * 13 + 30)
    y -= 6
    text("NOTES", MARGIN, { size: 8.5, font: bold, color: GRAY })
    y -= 14
    for (const l of lines) {
      text(l, MARGIN, { size: 9, color: GRAY })
      y -= 13
    }
  }

  /* ── Footer credit (free tier only) ── */
  if (!opts.pro) {
    const credit = "Created with Vector Invoice — free invoices at vectorautomationsystems.com/invoice"
    page.drawText(credit, {
      x: PAGE_W / 2 - font.widthOfTextAtSize(credit, 7.5) / 2,
      y: 28,
      size: 7.5,
      font,
      color: rgb(0.65, 0.67, 0.7),
    })
  }

  return pdf.save()
}

/** Trigger a browser download of the rendered PDF. */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
