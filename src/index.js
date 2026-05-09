// src/index.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'

// Load Noto Sans TC from Google Fonts
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap'
document.head.appendChild(link)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
