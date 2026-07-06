/**
 * GitHub Pages SPA deep-link restore (sessionStorage → history.replaceState).
 *
 * Runtime: index.html inline script runs this logic before the app bundle loads.
 * This module mirrors that script for unit tests only — not imported by index.jsx.
 *
 * If you change `base` in vite.config.js, also update the hardcoded path in:
 *   - index.html  (inline script `base`)
 *   - public/404.html  (`BASE`)
 */
export function restoreSpaRedirectFromStorage() {
  try {
    const stored = sessionStorage.getItem('spaRedirect')
    if (!stored) return

    sessionStorage.removeItem('spaRedirect')

    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '') || ''
    const path = stored.startsWith('/') ? stored : `/${stored}`
    const nextUrl = `${base}${path}`

    if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
      window.history.replaceState(null, '', nextUrl)
    }
  } catch {
    // sessionStorage unavailable — fall through to default routes
  }
}
