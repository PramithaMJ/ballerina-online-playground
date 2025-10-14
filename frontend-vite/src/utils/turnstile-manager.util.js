/**
 * Turnstile Token Manager
 * Handles automatic token refresh and background verification
 * Ensures tokens are always fresh and available
 */

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const TOKEN_VALIDITY_DURATION = 3 * 60 * 1000; // 3 minutes (refresh well before 5min expiry)
const TOKEN_WARNING_THRESHOLD = 2 * 60 * 1000; // 2 minutes - proactive refresh threshold
const DEBUG_MODE = import.meta.env.DEV; // Only show debug logs in development

class TurnstileManager {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.isRefreshing = false;
    this.pendingCallbacks = [];
    this.isInitialized = false;
  }

  /**
   * Log only in debug mode
   */
  debug(...args) {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  }

  /**
   * Initialize the invisible Turnstile widget
   */
  initialize() {
    if (this.isInitialized) {
      this.debug('🔧 Turnstile manager already initialized');
      return; // Already initialized
    }

    this.debug('🔧 Initializing Turnstile manager...');

    // Create invisible container
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'turnstile-refresh-widget';
    this.containerElement.style.cssText = 'position: fixed; bottom: -200px; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none;';
    document.body.appendChild(this.containerElement);

    // Wait for Turnstile script to load
    const checkTurnstile = setInterval(() => {
      if (window.turnstile) {
        clearInterval(checkTurnstile);
        this.renderWidget();
        this.isInitialized = true;
      }
    }, 100);
  }

  /**
   * Render the Turnstile widget
   */
  renderWidget() {
    if (!window.turnstile || !this.containerElement) {
      console.error('❌ Cannot render Turnstile widget');
      return;
    }

    try {
      this.widgetId = window.turnstile.render(this.containerElement, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'compact', // Use 'compact' instead of 'invisible' (which is not supported)
        callback: (token) => {
          this.debug('🔄 Background token refresh successful');
          this.storeToken(token);
          this.isRefreshing = false;
          
          // Execute pending callbacks
          this.pendingCallbacks.forEach(cb => cb(token));
          this.pendingCallbacks = [];
        },
        'error-callback': (errorCode) => {
          console.error('❌ Token refresh failed:', errorCode);
          this.isRefreshing = false;
          this.pendingCallbacks.forEach(cb => cb(null));
          this.pendingCallbacks = [];
        },
        'expired-callback': () => {
          this.debug('⏱️ Token expired - auto-refreshing...');
          this.refreshToken();
        },
        'timeout-callback': () => {
          console.warn('⏱️ Token refresh timeout');
          this.isRefreshing = false;
          this.pendingCallbacks.forEach(cb => cb(null));
          this.pendingCallbacks = [];
        },
        theme: 'light',
      });
      this.debug('✅ Background widget rendered with ID:', this.widgetId);
    } catch (err) {
      console.error('❌ Error rendering background Turnstile widget:', err);
    }
  }

  /**
   * Store token in session storage
   */
  storeToken(token) {
    sessionStorage.setItem('turnstile_token', token);
    sessionStorage.setItem('turnstile_timestamp', Date.now().toString());
    sessionStorage.setItem('turnstile_verified', 'true');
    sessionStorage.setItem('turnstile_usage_count', '0'); // Reset usage count for new token
  }

  /**
   * Get current token (refresh if needed)
   */
  async getToken() {
    const token = sessionStorage.getItem('turnstile_token');
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    
    // Check if token exists and is valid
    if (token && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const ageMinutes = (age / 1000 / 60).toFixed(1);
      
      // Token is too old (>3 minutes) - refresh immediately
      if (age >= TOKEN_VALIDITY_DURATION) {
        this.debug(`⏱️ Token is ${ageMinutes} minutes old - refreshing...`);
        return this.refreshToken();
      }
      
      // Token is getting old (>2 minutes) - warn but still use it
      if (age >= TOKEN_WARNING_THRESHOLD) {
        this.debug(`⚠️ Token is ${ageMinutes} minutes old - consider refreshing soon`);
      }
      
      return token; // Token is still fresh enough
    }

    // Token is missing - refresh it
    this.debug('🔄 No token found - requesting new one...');
    return this.refreshToken();
  }

  /**
   * Refresh the token
   */
  refreshToken() {
    return new Promise((resolve, reject) => {
      if (this.isRefreshing) {
        // Already refreshing - queue this callback
        this.pendingCallbacks.push(resolve);
        return;
      }

      this.isRefreshing = true;
      this.pendingCallbacks.push(resolve);

      if (!this.widgetId || !window.turnstile) {
        console.error('❌ Turnstile widget not initialized');
        this.isRefreshing = false;
        this.pendingCallbacks.forEach(cb => cb(null));
        this.pendingCallbacks = [];
        reject(new Error('Turnstile not initialized'));
        return;
      }

      try {
        this.debug('🔄 Requesting new token...');
        window.turnstile.reset(this.widgetId);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.isRefreshing) {
            console.warn('❌ Token refresh timeout');
            this.isRefreshing = false;
            this.pendingCallbacks.forEach(cb => cb(null));
            this.pendingCallbacks = [];
            reject(new Error('Token refresh timeout'));
          }
        }, 10000);
      } catch (err) {
        console.error('Error refreshing token:', err);
        this.isRefreshing = false;
        this.pendingCallbacks.forEach(cb => cb(null));
        this.pendingCallbacks = [];
        reject(err);
      }
    });
  }

  /**
   * Check if token is valid
   */
  isTokenValid() {
    const token = sessionStorage.getItem('turnstile_token');
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    
    if (!token || !timestamp) {
      return false;
    }

    const age = Date.now() - parseInt(timestamp);
    return age < TOKEN_VALIDITY_DURATION;
  }

  /**
   * Clear token
   */
  clearToken() {
    sessionStorage.removeItem('turnstile_token');
    sessionStorage.removeItem('turnstile_timestamp');
    sessionStorage.removeItem('turnstile_verified');
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch (err) {
        console.error('Error removing Turnstile widget:', err);
      }
    }
    
    if (this.containerElement && document.body.contains(this.containerElement)) {
      document.body.removeChild(this.containerElement);
    }
    
    this.widgetId = null;
    this.containerElement = null;
    this.isInitialized = false;
  }
  
  /**
   * Get token age in minutes
   */
  getTokenAge() {
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    if (!timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    return (age / 1000 / 60).toFixed(1); // Return age in minutes
  }

  /**
   * Get token usage count
   */
  getTokenUsageCount() {
    const count = sessionStorage.getItem('turnstile_usage_count');
    return count ? parseInt(count) : 0;
  }

  /**
   * Increment token usage count
   */
  incrementUsageCount() {
    const count = this.getTokenUsageCount();
    sessionStorage.setItem('turnstile_usage_count', (count + 1).toString());
  }

  /**
   * Reset token usage count
   */
  resetUsageCount() {
    sessionStorage.setItem('turnstile_usage_count', '0');
  }
}

// Singleton instance
export const turnstileManager = new TurnstileManager();

export default turnstileManager;
