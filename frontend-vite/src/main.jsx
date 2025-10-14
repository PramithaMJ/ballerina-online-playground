import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress Cloudflare Turnstile console warnings in production
if (import.meta.env.PROD) {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Filter out known Cloudflare warnings that are harmless
  const cloudflarePatterns = [
    /script-src.*not explicitly set/i,
    /preloaded using link preload but not used/i,
    /challenges\.cloudflare\.com/i,
    /Private Access Token/i,
    /ERR_BLOCKED_BY_CLIENT/i,
    /Failed to load resource.*challenges\.cloudflare/i,
  ];

  const shouldSuppress = (message) => {
    return cloudflarePatterns.some(pattern => pattern.test(message));
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };

  console.error = (...args) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
