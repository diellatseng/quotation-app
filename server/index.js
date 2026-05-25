const express  = require('express')
const puppeteer = require('puppeteer')

const app = express()
const PORT = process.env.PORT || 3001

// 允許的來源列表
// 本地開發: http://localhost:3000
// GitHub Pages: https://diellatseng.github.io
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://diellatseng.github.io'
]

app.use(express.json({ limit: '10mb' }))

// CORS middleware — 嚴格只允許指定的來源
app.use((req, res, next) => {
  const origin = req.headers.origin

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})

app.post('/api/export-pdf', async (req, res) => {
  const { html, filename = 'export.pdf' } = req.body
  if (!html) return res.status(400).json({ error: 'html is required' })

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    // Set A4 viewport (794px wide at 96 dpi for A4 width)
    await page.setViewport({ width: 794, height: 1123 })

    // 用 setContent 而不是 navigate，直接傳 HTML 字串
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Wait for all fonts to load and let layout settle
    await page.evaluateHandle('document.fonts.ready')
    
    // Force reflow to ensure all content is laid out
    await page.evaluate(() => {
      void document.body.offsetHeight // Trigger reflow
    })

    // Use print-to-PDF to respect CSS page breaks
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(pdf)
  } catch (err) {
    console.error('PDF generation error:', err)
    res.status(500).json({ error: 'PDF generation failed' })
  } finally {
    await browser?.close()
  }
})

app.get('/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`PDF server running on port ${PORT}`))