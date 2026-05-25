import { useState } from 'react'

/**
 * useExportPDF — Shared PDF export logic for quotation pages
 * Handles html2canvas + jsPDF generation with loading state
 *
 * @param {Object} options
 * @param {string} options.filename - PDF filename (without .pdf extension)
 * @param {Function} [options.onSuccess] - Optional callback after successful export
 * @returns {Object} { exporting, exportPDF }
 *
 * Usage:
 *   const { exporting, exportPDF } = useExportPDF({
 *     filename: '報價單-' + qt.quote_number,
 *     onSuccess: async () => { await setStatus('已報價') }
 *   })
 *   <button onClick={() => exportPDF(previewRef)}>Export</button>
 */
export function useExportPDF({ filename = '報價單', onSuccess } = {}) {
  const [exporting, setExporting] = useState(false)

  const exportPDF = async (previewRef) => {
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      const pageEls = previewRef.current.querySelectorAll('[data-page]')
      if (!pageEls.length) return

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()

      for (let i = 0; i < pageEls.length; i++) {
        if (i > 0) pdf.addPage()
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        })
        const imgH = (canvas.height * pdfW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, Math.min(imgH, pdfH))
      }

      pdf.save(`${filename}.pdf`)

      // Execute callback (if provided)
      if (onSuccess) {
        await onSuccess()
      }
    } finally {
      setExporting(false)
    }
  }

  return { exporting, exportPDF }
}
