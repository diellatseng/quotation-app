import { useState } from 'react'

const PDF_SERVER_URL = import.meta.env.VITE_PDF_SERVER_URL || 'http://localhost:3001'

/**
 * useExportPDF — Shared PDF export logic for quotation pages
 * Sends the current preview HTML to a Puppeteer backend server,
 * which renders it in headless Chrome and returns a PDF byte stream.
 *
 * Fetches A4Preview.css at runtime from the public URL so that class-based
 * styles are inlined into the HTML sent to Puppeteer. This is necessary
 * because outerHTML only captures element attributes (including inline style=)
 * but not external stylesheet rules.
 *
 * Usage:
 *   const { exporting, exportPDF } = useExportPDF()
 *   <button onClick={() => exportPDF(activeRef, {
 *     filename: '報價單-' + qt.quote_number,
 *     onSuccess: async () => { ... }
 *   })}>匯出 PDF</button>
 */
export function useExportPDF() {
  const [exporting, setExporting] = useState(false)

  const exportPDF = async (previewRef, { filename = '報價單', onSuccess } = {}) => {
    setExporting(true)
    try {
      // Clone the container so we can mutate it without affecting the live DOM.
      // Remove .a4-page-break dividers before serialising — they are preview-only
      // and their presence causes Puppeteer to render a blank page between pages
      // (the break-after on [data-page] fires, then Puppeteer sees more content).
      const container = previewRef.current?.cloneNode(true)
      if (!container) return
      container.querySelectorAll('.a4-page-break').forEach(el => el.remove())

      const pageEls = container.querySelectorAll('[data-page]')
      if (!pageEls?.length) return

      const pagesHtml = Array.from(pageEls).map(el => el.outerHTML).join('\n')

      // ── 2. Collect ALL stylesheet rules that apply to the preview ─────────
      // We walk every CSSStyleSheet the browser has loaded and pull out any
      // rule that mentions an a4- class (or other classes used in A4Preview).
      // This works regardless of whether the CSS came from a file import,
      // a <style> tag, or any other source — no ?raw import needed.
      let inlinedCss = ''
      try {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            const rules = Array.from(sheet.cssRules || [])
            for (const rule of rules) {
              const text = rule.cssText || ''
              // Include any rule that touches A4Preview classes or generic
              // layout primitives that the preview relies on
              if (
                text.includes('a4-') ||
                text.includes('desc-block') ||
                text.includes('diff-badge')
              ) {
                inlinedCss += text + '\n'
              }
            }
          } catch {
            // Cross-origin sheets (e.g. Google Fonts) throw SecurityError — skip
          }
        }
      } catch (e) {
        console.warn('[useExportPDF] Could not extract stylesheets:', e)
      }

      // ── 3. Build the self-contained HTML document for Puppeteer ──────────
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    /* ── Reset ── */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; }
    body {
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: "Noto Sans TC", "Microsoft JhengHei", "Microsoft YaHei", sans-serif;
    }
    /* ── Extracted A4Preview styles ── */
    ${inlinedCss}
    /* ── PDF pagination ── */
    /* .a4-page-break elements are removed from the DOM before serialisation,
       so this rule is a safety net only. */
    .a4-page-break { display: none !important; }
    [data-page] {
      display: block;
      break-after: page;
      page-break-after: always;
      break-inside: avoid;
    }
    /* No trailing break after the final page */
    [data-page]:last-of-type {
      break-after: avoid;
      page-break-after: avoid;
    }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`

      // ── 4. Send to Puppeteer server ───────────────────────────────────────
      const res = await fetch(`${PDF_SERVER_URL}/api/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename: `${filename}.pdf` }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${res.status}`)
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${filename}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      if (onSuccess) await onSuccess()
    } catch (err) {
      console.error('[useExportPDF]', err)
      alert(`PDF 匯出失敗：${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  return { exporting, exportPDF }
}
