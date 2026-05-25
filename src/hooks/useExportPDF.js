import { useState } from 'react'

const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'http://localhost:3001'

/**
 * useExportPDF — Shared PDF export logic for quotation pages
 * Sends the current preview HTML to a Puppeteer backend server,
 * which renders it in headless Chrome and returns a PDF byte stream.
 * This guarantees the exported PDF is pixel-identical to the browser preview,
 * including rich text styles, list formatting, fonts, and pagination.
 *
 * @param {Object} options
 * @param {string} options.filename  - PDF filename (without .pdf extension)
 * @param {Function} [options.onSuccess] - Optional callback after successful export
 * @returns {Object} { exporting, exportPDF }
 *
 * Usage:
 *   const { exporting, exportPDF } = useExportPDF({
 *     filename: '報價單-' + qt.quote_number,
 *     onSuccess: async () => { await setStatus('已報價') }
 *   })
 *   <button onClick={() => exportPDF(previewRef)}>Export</button>
 *
 * Environment variable required:
 *   REACT_APP_PDF_SERVER_URL=https://your-railway-app.railway.app
 */
export function useExportPDF({ filename = '報價單', onSuccess } = {}) {
  const [exporting, setExporting] = useState(false)

  const exportPDF = async (previewRef) => {
    setExporting(true)
    try {
      const pageEls = previewRef.current?.querySelectorAll('[data-page]')
      if (!pageEls?.length) return

      // Collect the outer HTML of every A4 page rendered by A4Preview.
      // Puppeteer will receive this as a complete, self-contained document —
      // all styles are already inlined by React so no external CSS is needed.
      const pagesHtml = Array.from(pageEls).map(el => el.outerHTML).join('\n')

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { 
      width: 100%;
      height: 100%;
    }
    body { 
      background: white; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
      font-family: "Noto Sans TC", "Microsoft JhengHei", "Microsoft YaHei", sans-serif;
    }
    /* List styles to ensure proper formatting in PDF */
    ul, ol { 
      margin: 0.2em 0;
      padding-left: 1.4em;
    }
    ul { list-style-type: disc; }
    ol { list-style-type: decimal; }
    ul ul { list-style-type: circle; }
    ul ul ul { list-style-type: square; }
    ol ol { list-style-type: lower-alpha; }
    li { margin: 0.1em 0; }
    
    /* Hide the dashed page-break dividers that A4Preview renders between pages */
    [data-page] + div { display: none; }
    /* Force page break after each A4 page */
    [data-page] { 
      display: block;
      break-after: page;
      page-break-after: always;
      -webkit-region-break-after: always;
      break-inside: avoid;
      -webkit-column-break-inside: avoid;
    }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`

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