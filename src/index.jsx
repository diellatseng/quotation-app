// src/index.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
// TEMPORARY migration bridge: the old plain-CSS design system (tokens + legacy
// classes like .card/.btn-*/.field-input/.dashboard-*) still backs the screens
// not yet converted to Tailwind utilities. Loaded after globals.css so legacy
// rules apply during the transition. Delete this import — and d_globals.css —
// once every component is migrated.
import './styles/d_globals.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
