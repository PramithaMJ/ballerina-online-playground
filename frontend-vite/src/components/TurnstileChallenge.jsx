import { useEffect, useRef, useState, useCallback } from 'react';
import './TurnstileChallenge.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const DEBUG_MODE = import.meta.env.DEV;
const VERIFICATION_VALIDITY_MS = 4 * 60 * 1000; // 4 minutes (5 min tokens - 1 min safety margin)
const SCRIPT_LOAD_TIMEOUT = 10000; // 10 seconds timeout for script loading

export const TurnstileChallenge = ({ onVerified }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);
  const scriptLoadTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current);
      }
    };
  }, []);

  // Check if verification is still valid
  const isVerificationValid = useCallback(() => {
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    if (!timestamp) return false;
    return (Date.now() - parseInt(timestamp)) < VERIFICATION_VALIDITY_MS;
  }, []);

  // Clear verification data
  const clearVerification = useCallback(() => {
    sessionStorage.removeItem('turnstile_verified');
    sessionStorage.removeItem('turnstile_timestamp');
    if (DEBUG_MODE) console.log('🧹 Verification data cleared');
  }, []);

  // Handle successful verification
  const handleSuccess = useCallback((token) => {
    if (!mountedRef.current) return;

    if (DEBUG_MODE) {
      console.log('✅ Turnstile verification successful', {
        tokenLength: token.length,
        timestamp: new Date().toISOString()
      });
    }

    // Store verification status
    sessionStorage.setItem('turnstile_verified', 'true');
    sessionStorage.setItem('turnstile_timestamp', Date.now().toString());

    setIsVerified(true);
    setError(null);
    onVerified(token);
  }, [onVerified]);

  // Handle verification error
  const handleError = useCallback((errorCode) => {
    if (!mountedRef.current) return;

    console.error('❌ Turnstile verification error:', errorCode);
    
    const errorMessages = {
      'network-error': 'Network connection failed. Please check your internet connection and try again.',
      'invalid-domain': 'This domain is not authorized. Please contact the administrator.',
      'timeout': 'Verification timed out. Please try again.',
      'internal-error': 'An internal error occurred. Please try again later.',
      'challenge-error': 'Challenge failed to load. Please refresh the page.',
    };

    const errorMessage = errorMessages[errorCode] || `Verification failed (${errorCode}). Please try again.`;
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  // Handle token expiration
  const handleExpired = useCallback(() => {
    if (!mountedRef.current) return;

    if (DEBUG_MODE) console.log('⏰ Turnstile token expired');
    clearVerification();
    setIsVerified(false);
    setError('Your verification has expired. Please verify again.');
  }, [clearVerification]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (!mountedRef.current) return;

    console.warn('⏱️ Turnstile challenge timeout');
    setError('Verification took too long. Please try again.');
    setIsLoading(false);
  }, []);

  // Render the Turnstile widget
  const renderWidget = useCallback(() => {
    if (!window.turnstile || !turnstileRef.current || widgetIdRef.current) {
      return;
    }

    try {
      if (DEBUG_MODE) console.log('🎨 Rendering Turnstile widget...');

      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'light',
        size: 'normal',
        callback: handleSuccess,
        'error-callback': handleError,
        'expired-callback': handleExpired,
        'timeout-callback': handleTimeout,
        'before-interactive-callback': () => {
          if (DEBUG_MODE) console.log('🔄 Turnstile widget becoming interactive...');
        },
        'after-interactive-callback': () => {
          if (DEBUG_MODE) console.log('✓ Turnstile widget is interactive');
          setIsLoading(false);
        },
        'unsupported-callback': () => {
          console.error('❌ Turnstile is not supported in this browser');
          setError('Your browser does not support the verification system. Please use a modern browser.');
          setIsLoading(false);
        },
        retry: 'auto',
        'retry-interval': 8000,
        'refresh-expired': 'auto',
        language: 'auto',
        execution: 'render', // Execute immediately on render
        appearance: 'always', // Always show the widget
      });

      if (DEBUG_MODE) {
        console.log('✓ Turnstile widget rendered', {
          widgetId: widgetIdRef.current,
          siteKey: TURNSTILE_SITE_KEY
        });
      }
    } catch (err) {
      console.error('❌ Error rendering Turnstile widget:', err);
      setError('Failed to initialize verification. Please refresh the page.');
      setIsLoading(false);
    }
  }, [handleSuccess, handleError, handleExpired, handleTimeout]);

  // Load Turnstile script
  useEffect(() => {
    // Check for existing valid verification
    const verified = sessionStorage.getItem('turnstile_verified');
    
    if (verified === 'true' && isVerificationValid()) {
      if (DEBUG_MODE) console.log('✅ Valid verification found in session');
      setIsVerified(true);
      setIsLoading(false);
      onVerified('session-valid');
      return;
    } else if (verified === 'true') {
      if (DEBUG_MODE) console.log('⏰ Verification expired, clearing session');
      clearVerification();
    }

    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      if (DEBUG_MODE) console.log('� Turnstile API already loaded');
      renderWidget();
      setIsLoading(false);
      return;
    }

    // Load Turnstile script with explicit rendering
    if (DEBUG_MODE) console.log('📥 Loading Turnstile API script...');
    
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    // Set timeout for script loading
    scriptLoadTimeoutRef.current = setTimeout(() => {
      if (!window.turnstile && mountedRef.current) {
        console.error('❌ Turnstile script loading timeout');
        setError('Verification service is taking too long to load. Please check your connection and refresh.');
        setIsLoading(false);
      }
    }, SCRIPT_LOAD_TIMEOUT);

    script.onload = () => {
      if (!mountedRef.current) return;
      
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current);
      }

      if (DEBUG_MODE) console.log('✅ Turnstile API loaded successfully');

      // Small delay to ensure Turnstile is fully initialized
      setTimeout(() => {
        if (mountedRef.current) {
          renderWidget();
        }
      }, 200);
    };

    script.onerror = (e) => {
      if (!mountedRef.current) return;
      
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current);
      }

      console.error('❌ Failed to load Turnstile script:', e);
      setError('Failed to load verification service. Please check your internet connection and refresh.');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current);
      }

      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          if (DEBUG_MODE) console.log('🧹 Turnstile widget removed');
        } catch (err) {
          // Ignore cleanup errors
        }
      }

      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [onVerified, isVerificationValid, clearVerification, renderWidget]);

  // Handle manual retry
  const handleRetry = useCallback(() => {
    if (DEBUG_MODE) console.log('🔄 Manual retry requested');
    setError(null);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);

    // Reset and re-render widget
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (err) {
        // If reset fails, remove and re-render
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
          setTimeout(renderWidget, 100);
        } catch (removeErr) {
          console.error('❌ Failed to reset widget:', removeErr);
          window.location.reload();
        }
      }
    } else {
      // Widget not initialized, try rendering
      setTimeout(renderWidget, 100);
    }

    setTimeout(() => setIsLoading(false), 1000);
  }, [renderWidget]);

  // Don't show verification screen if already verified
  if (isVerified) {
    return null;
  }

  return (
    <div className="turnstile-overlay" role="dialog" aria-labelledby="verification-title" aria-live="polite">
      <div className="turnstile-container">
        <div className="turnstile-content">
          {/* Logo */}
          <div className="turnstile-logo" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF5000" opacity="0.8"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#FF7A00"/>
            </svg>
          </div>
          
          {/* Title */}
          <h1 id="verification-title" className="turnstile-title">
            🔒 Human Verification Required
          </h1>
          
          {/* Description */}
          <p className="turnstile-description">
            Please verify you're human to access the Ballerina Online Playground
          </p>
          
          {/* Loading State */}
          {isLoading && !error && (
            <div className="turnstile-loading" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading verification challenge...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="turnstile-error" role="alert">
              <div className="error-icon" aria-hidden="true">⚠️</div>
              <p className="error-message">{error}</p>
              <button 
                onClick={handleRetry}
                className="retry-button"
                aria-label="Retry verification"
              >
                🔄 Retry Verification
              </button>
              {retryCount > 2 && (
                <button 
                  onClick={() => window.location.reload()}
                  className="refresh-button"
                  aria-label="Refresh page"
                >
                  🔃 Refresh Page
                </button>
              )}
            </div>
          )}
          
          {/* Widget Container */}
          {!error && (
            <div 
              ref={turnstileRef} 
              className="turnstile-widget"
              role="region"
              aria-label="Cloudflare Turnstile verification widget"
            />
          )}
          
          {/* Information Footer */}
          <div className="turnstile-info">
            <p className="info-text">
              ✓ This verification helps protect the playground from automated abuse
            </p>
            <p className="privacy-text">
              Protected by <strong>Cloudflare Turnstile</strong> · Privacy-first · No tracking
            </p>
            {DEBUG_MODE && (
              <p className="debug-info">
                Site Key: {TURNSTILE_SITE_KEY.substring(0, 20)}...
                {TURNSTILE_SITE_KEY === '1x00000000000000000000AA' && ' (Test Mode)'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnstileChallenge;
