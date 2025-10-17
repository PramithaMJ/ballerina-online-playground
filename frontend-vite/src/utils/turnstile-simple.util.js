/**
 * Simplified Turnstile Manager
 * Generates tokens on-demand instead of pre-generating pool
 * This avoids rate limiting and challenge failures
 */

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const TOKEN_VALIDITY_DURATION = 4 * 60 * 1000; // 4 minutes
const DEBUG_MODE = import.meta.env.DEV;

class SimpleTurnstileManager {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.isInitialized = false;
    this.currentToken = null;
    this.currentTokenTimestamp = null;
    this.pendingCallbacks = [];
  }

  debug(...args) {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  }

  async initialize() {
    if (this.isInitialized) {
      this.debug('✅ Turnstile manager already initialized');
      return;
    }

    this.debug('🔄 Initializing Turnstile manager...');

    // Create invisible container
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'turnstile-refresh-widget';
    this.containerElement.style.cssText = 'position: fixed; bottom: -200px; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none;';
    document.body.appendChild(this.containerElement);

    // Wait for Turnstile script
    await this.waitForTurnstile();
    
    this.isInitialized = true;
    this.debug('✅ Turnstile manager initialized');
  }

  async waitForTurnstile() {
    return new Promise((resolve) => {
      if (window.turnstile) {
        resolve();
        return;
      }

      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          resolve();
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkTurnstile);
        console.error('❌ Turnstile script failed to load');
        resolve(); // Resolve anyway to avoid hanging
      }, 30000);
    });
  }

  /**
   * Get a fresh token (generates on-demand)
   */
  async getToken() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if we have a valid cached token
    if (this.currentToken && this.isTokenValid()) {
      this.debug('🎯 Using cached token');
      return this.currentToken;
    }

    // Generate new token
    this.debug('🔄 Generating new token...');
    return this.generateToken();
  }

  /**
   * Generate a single token on-demand
   */
  generateToken() {
    return new Promise((resolve, reject) => {
      if (!window.turnstile) {
        reject(new Error('Turnstile not loaded'));
        return;
      }

      // Render widget temporarily
      try {
        this.widgetId = window.turnstile.render(this.containerElement, {
          sitekey: TURNSTILE_SITE_KEY,
          size: 'invisible',
          theme: 'light',
          callback: (token) => {
            this.currentToken = token;
            this.currentTokenTimestamp = Date.now();
            this.debug('✅ Token generated successfully');
            
            // Clean up widget
            if (this.widgetId && window.turnstile) {
              try {
                window.turnstile.remove(this.widgetId);
                this.widgetId = null;
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            
            resolve(token);
          },
          'error-callback': (errorCode) => {
            console.error('❌ Token generation error:', errorCode);
            
            // Clean up widget
            if (this.widgetId && window.turnstile) {
              try {
                window.turnstile.remove(this.widgetId);
                this.widgetId = null;
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            
            reject(new Error(`Token generation failed: ${errorCode}`));
          },
          'expired-callback': () => {
            this.debug('⏰ Token expired');
            this.currentToken = null;
            this.currentTokenTimestamp = null;
          },
          'timeout-callback': () => {
            console.warn('⏱️ Token generation timeout');
            
            // Clean up widget
            if (this.widgetId && window.turnstile) {
              try {
                window.turnstile.remove(this.widgetId);
                this.widgetId = null;
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            
            reject(new Error('Token generation timeout'));
          },
        });

        this.debug('🎨 Widget rendered with ID:', this.widgetId);

        // Set timeout
        setTimeout(() => {
          if (this.widgetId) {
            console.error('⏱️ Token generation timeout (30s)');
            
            // Clean up
            if (window.turnstile) {
              try {
                window.turnstile.remove(this.widgetId);
                this.widgetId = null;
              } catch (e) {
                // Ignore
              }
            }
            
            reject(new Error('Token generation timeout'));
          }
        }, 30000);

      } catch (err) {
        console.error('❌ Error rendering widget:', err);
        reject(err);
      }
    });
  }

  /**
   * Check if current token is still valid
   */
  isTokenValid() {
    if (!this.currentToken || !this.currentTokenTimestamp) {
      return false;
    }

    const age = Date.now() - this.currentTokenTimestamp;
    return age < TOKEN_VALIDITY_DURATION;
  }

  /**
   * Clear cached token
   */
  clearToken() {
    this.currentToken = null;
    this.currentTokenTimestamp = null;
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove widget
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch (err) {
        // Ignore
      }
    }
    
    // Remove container
    if (this.containerElement && document.body.contains(this.containerElement)) {
      document.body.removeChild(this.containerElement);
    }
    
    this.widgetId = null;
    this.containerElement = null;
    this.isInitialized = false;
    this.currentToken = null;
    this.currentTokenTimestamp = null;
  }
}

// Singleton instance
export const simpleTurnstileManager = new SimpleTurnstileManager();

export default simpleTurnstileManager;
