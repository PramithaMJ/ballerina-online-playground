import { useEffect, useRef, useState } from 'react';
import './TurnstileChallenge.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const DEBUG_MODE = import.meta.env.DEV; // Only show debug logs in development

export const TurnstileChallenge = ({ onVerified }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Log configuration on mount (only in dev mode)
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log(' Turnstile Configuration:', {
        siteKey: TURNSTILE_SITE_KEY,
        isTestKey: TURNSTILE_SITE_KEY === '1x00000000000000000000AA',
        mode: import.meta.env.MODE,
      });
    }
  }, []);

  useEffect(() => {
    // Check if already verified in session
    const verified = sessionStorage.getItem('turnstile_verified');
    const token = sessionStorage.getItem('turnstile_token');
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    
    if (DEBUG_MODE) {
      console.log('🔍 Checking session storage:', { verified, hasToken: !!token, timestamp });
    }
    
    // Token expires after 4 minutes (use 4 instead of 5 for safety margin)
    const isTokenValid = timestamp && (Date.now() - parseInt(timestamp)) < 4 * 60 * 1000;
    
    if (verified === 'true' && token && isTokenValid) {
      if (DEBUG_MODE) console.log('✅ Valid token found in session');
      setIsVerified(true);
      onVerified(token);
      return;
    } else if (verified === 'true' && !isTokenValid) {
      if (DEBUG_MODE) console.log('⏰ Token expired, clearing session');
      // Clear expired token
      sessionStorage.removeItem('turnstile_verified');
      sessionStorage.removeItem('turnstile_token');
      sessionStorage.removeItem('turnstile_timestamp');
    }

    // Check if script already loaded
    if (window.turnstile) {
      if (DEBUG_MODE) console.log('📝 Turnstile script already loaded');
      setIsLoading(false);
      
      // Render widget immediately
      if (turnstileRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token) => {
              if (DEBUG_MODE) console.log(' Turnstile verification successful');
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
                if (DEBUG_MODE) console.log('⏰ Turnstile token expired');
                sessionStorage.removeItem('turnstile_verified');
                sessionStorage.removeItem('turnstile_token');
                sessionStorage.removeItem('turnstile_timestamp');
                setIsVerified(false);
                
                // Show message to user
                setError('Your verification has expired. Please refresh the page to verify again.');
              },
            'timeout-callback': () => {
              console.warn(' Turnstile timeout');
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
      return;
    }

    // Load Turnstile script
    if (DEBUG_MODE) console.log('📥 Loading Turnstile script...');
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (DEBUG_MODE) console.log(' Turnstile script loaded');
      setIsLoading(false);
      
      // Add small delay to ensure Turnstile is fully initialized
      setTimeout(() => {
        // Render Turnstile widget
        if (window.turnstile && turnstileRef.current && !widgetIdRef.current) {
          try {
            if (DEBUG_MODE) console.log('🎨 Rendering Turnstile widget...');
            widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: (token) => {
                if (DEBUG_MODE) console.log(' Turnstile widget rendered with ID:', widgetIdRef.current);
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
                if (DEBUG_MODE) console.log('⏰ Turnstile token expired');
                sessionStorage.removeItem('turnstile_verified');
                sessionStorage.removeItem('turnstile_token');
                sessionStorage.removeItem('turnstile_timestamp');
                setIsVerified(false);
                
                // Show message to user
                setError('Your verification has expired. Please refresh the page to verify again.');
              },
              'timeout-callback': () => {
                console.warn(' Turnstile timeout');
                setError('Verification timeout. Please try again.');
              },
              theme: 'light',
              size: 'normal',
            });
          } catch (err) {
            console.error(' Error rendering Turnstile:', err);
            setError('Failed to load verification. Please refresh the page.');
          }
        } else if (DEBUG_MODE) {
          console.error(' Cannot render Turnstile:', {
            turnstileExists: !!window.turnstile,
            refExists: !!turnstileRef.current,
            widgetAlreadyRendered: !!widgetIdRef.current
          });
        }
      }, 100);
    };

    script.onerror = () => {
      console.error(' Failed to load Turnstile script');
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
