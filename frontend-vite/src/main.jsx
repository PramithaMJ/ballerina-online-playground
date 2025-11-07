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
      // Detect theme
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const htmlTheme = document.documentElement.getAttribute('data-theme');
      const savedTheme = localStorage.getItem('theme');
      const theme = savedTheme || htmlTheme || (isDark ? 'dark' : 'light');
      
      const swanImage = theme === 'dark' 
        ? '/something-went-wrong-dark.png' 
        : '/something-went-wrong.png';
      
      const bgColor = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
      const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a';
      const errorColor = theme === 'dark' ? '#f87171' : '#dc2626';
      const subtextColor = theme === 'dark' ? '#94a3b8' : '#64748b';
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: bgColor,
          color: textColor,
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {/* Swan Illustration */}
            <img 
              src={swanImage}
              alt="Ballerina Swan Error"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                marginBottom: '2rem',
                animation: 'swanShake 0.6s ease-in-out'
              }}
            />
            
            {/* Error Title */}
            <h1 style={{ 
              fontSize: '2rem',
              fontWeight: '700',
              color: errorColor,
              margin: '0 0 1rem 0',
              letterSpacing: '-0.025em'
            }}>
              Something Went Wrong
            </h1>
            
            {/* Error Message */}
            <p style={{ 
              fontSize: '1.125rem',
              color: subtextColor,
              margin: '0 0 2rem 0',
              lineHeight: '1.6'
            }}>
              Our swan got tangled in the code. Please try again!
            </p>
            
            {/* Technical Error Details (optional) */}
            {this.state.error?.message && (
              <div style={{
                background: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                fontSize: '0.875rem',
                color: subtextColor,
                fontFamily: 'monospace',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '100px'
              }}>
                {this.state.error.message}
              </div>
            )}
            
            {/* Reload Button */}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #52c3c2 0%, #45b0af 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(82, 195, 194, 0.3)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(82, 195, 194, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(82, 195, 194, 0.3)';
              }}
            >
              Reload Page
            </button>
          </div>
          
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes swanShake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
              20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            @media (max-width: 480px) {
              img {
                max-width: 280px !important;
              }
              h1 {
                font-size: 1.5rem !important;
              }
              p {
                font-size: 1rem !important;
              }
            }
          `}</style>
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
