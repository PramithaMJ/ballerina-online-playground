import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error boundary component for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#1a1a1a',
          color: '#fff',
          padding: '20px'
        }}>
          <h1 style={{ marginBottom: '10px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '20px', color: '#aaa' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#52c3c2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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

// Log environment info for debugging
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_API_URL || 'Not configured');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
