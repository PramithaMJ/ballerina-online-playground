import { useEffect, useRef, useState } from 'react';
import './TurnstileChallenge.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export const TurnstileChallenge = ({ onVerified }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    // Check if already verified in session
    const verified = sessionStorage.getItem('turnstile_verified');
    const token = sessionStorage.getItem('turnstile_token');
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    
    // Token expires after 5 minutes
    const isTokenValid = timestamp && (Date.now() - parseInt(timestamp)) < 5 * 60 * 1000;
    
    if (verified === 'true' && token && isTokenValid) {
      setIsVerified(true);
      onVerified(token);
      return;
    } else if (verified === 'true' && !isTokenValid) {
      // Clear expired token
      sessionStorage.removeItem('turnstile_verified');
      sessionStorage.removeItem('turnstile_token');
      sessionStorage.removeItem('turnstile_timestamp');
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoading(false);
      
      // Render Turnstile widget
      if (window.turnstile && turnstileRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token) => {
              console.log(' Turnstile verification successful');
              setIsVerified(true);
              sessionStorage.setItem('turnstile_verified', 'true');
              sessionStorage.setItem('turnstile_token', token);
              sessionStorage.setItem('turnstile_timestamp', Date.now().toString());
              onVerified(token);
            },
            'error-callback': (errorCode) => {
              console.error(' Turnstile verification failed:', errorCode);
              setError('Verification failed. Please refresh and try again.');
            },
            'expired-callback': () => {
              console.log('⏱️ Turnstile token expired');
              sessionStorage.removeItem('turnstile_verified');
              sessionStorage.removeItem('turnstile_token');
              sessionStorage.removeItem('turnstile_timestamp');
              setIsVerified(false);
              
              // Reset the widget
              if (widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
              }
            },
            'timeout-callback': () => {
              console.log('⏱️ Turnstile timeout');
              setError('Verification timeout. Please try again.');
            },
            theme: 'light',
            size: 'normal',
          });
        } catch (err) {
          console.error('Error rendering Turnstile:', err);
          setError('Failed to load verification. Please refresh the page.');
        }
      }
    };

    script.onerror = () => {
      setIsLoading(false);
      setError('Failed to load verification service. Please check your internet connection.');
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [onVerified]);

  if (isVerified) {
    return null;
  }

  return (
    <div className="turnstile-overlay">
      <div className="turnstile-container">
        <div className="turnstile-content">
          <div className="turnstile-logo">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF5000" opacity="0.8"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#FF7A00"/>
            </svg>
          </div>
          
          <h1> Human Verification Required</h1>
          <p>Please verify you're human to access the Ballerina Online Playground</p>
          
          {isLoading ? (
            <div className="turnstile-loading">
              <div className="spinner"></div>
              <p>Loading verification...</p>
            </div>
          ) : error ? (
            <div className="turnstile-error">
              <p className="error-message">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-button"
              >
                 Refresh Page
              </button>
            </div>
          ) : (
            <div ref={turnstileRef} className="turnstile-widget"></div>
          )}
          
          <div className="turnstile-info">
            <p className="info-text">
              This verification helps protect the playground from automated abuse
            </p>
            <p className="privacy-text">
              Protected by <strong>Cloudflare Turnstile</strong> · Privacy-friendly · No tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
