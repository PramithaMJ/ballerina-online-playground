/**
 * Turnstile On-Demand Token Generator
 * Production-ready implementation for generating fresh tokens per request
 * Industry-standard approach with proper error handling and retry logic
 */

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const TOKEN_GENERATION_TIMEOUT = 15000; // 15 seconds
const DEBUG_MODE = import.meta.env.DEV;

class TurnstileTokenGenerator {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.isGenerating = false;
    this.isInitialized = false;
    this.generationQueue = [];
  }

  /**
   * Debug logging
   */
  debug(...args) {
    if (DEBUG_MODE) {
      console.log('[TurnstileToken]', ...args);
    }
  }

  /**
   * Initialize the invisible widget
   */
  async initialize() {
    if (this.isInitialized) {
      this.debug('Already initialized');
      return true;
    }

    try {
      // Wait for Turnstile API to load
      await this.waitForTurnstile();

      // Create invisible container
      this.containerElement = document.createElement('div');
      this.containerElement.id = 'turnstile-token-generator';
      this.containerElement.style.cssText = `
        position: fixed;
        bottom: -300px;
        left: -300px;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        z-index: -9999;
      `;
      document.body.appendChild(this.containerElement);

      // Render invisible widget
      this.widgetId = window.turnstile.render(this.containerElement, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'invisible',
        theme: 'light',
        execution: 'execute', // Manual execution only
        appearance: 'interaction-only', // Show only during user interaction
        callback: (token) => this.handleTokenGenerated(token),
        'error-callback': (error) => this.handleTokenError(error),
        'expired-callback': () => this.handleTokenExpired(),
        'timeout-callback': () => this.handleTokenTimeout(),
        'refresh-expired': 'never', // We generate fresh tokens, don't auto-refresh
        retry: 'auto',
        'retry-interval': 8000, // Longer interval to avoid PAT rate limits
      });

      this.isInitialized = true;
      this.debug('✅ Token generator initialized', { widgetId: this.widgetId });
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize token generator:', error);
      return false;
    }
  }

  /**
   * Wait for Turnstile API to load
   */
  async waitForTurnstile(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error('Turnstile API loading timeout'));
        }
      }, 100);
    });
  }

  /**
   * Generate a fresh token on-demand
   * Returns a Promise that resolves with the token
   */
  async generateToken() {
    // Ensure initialized
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize token generator');
      }
    }

    // Check if Turnstile is available
    if (!window.turnstile || !this.widgetId) {
      throw new Error('Turnstile not available');
    }

    // If already generating, queue this request
    if (this.isGenerating) {
      this.debug('⏳ Token generation in progress, queueing request...');
      return new Promise((resolve, reject) => {
        this.generationQueue.push({ resolve, reject });
      });
    }

    // Start generation
    return new Promise((resolve, reject) => {
      this.isGenerating = true;
      
      const timeoutId = setTimeout(() => {
        this.isGenerating = false;
        this.processQueue(null, new Error('Token generation timeout'));
        reject(new Error('Token generation timeout'));
      }, TOKEN_GENERATION_TIMEOUT);

      // Store resolve/reject for callback handling
      this.currentRequest = {
        resolve: (token) => {
          clearTimeout(timeoutId);
          this.isGenerating = false;
          this.processQueue(token, null);
          resolve(token);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          this.isGenerating = false;
          this.processQueue(null, error);
          reject(error);
        }
      };

      try {
        this.debug('🔄 Executing Turnstile challenge...');
        
        // Execute immediately without reset to avoid PAT challenge failures
        // Reset is only needed after errors, not before every execution
        window.turnstile.execute(this.containerElement);
      } catch (error) {
        this.currentRequest.reject(error);
      }
    });
  }

  /**
   * Process queued token requests
   */
  processQueue(token, error) {
    if (this.generationQueue.length === 0) return;

    this.debug(`📤 Processing ${this.generationQueue.length} queued requests`);

    // Process all queued requests with the same token/error
    while (this.generationQueue.length > 0) {
      const request = this.generationQueue.shift();
      if (token) {
        request.resolve(token);
      } else {
        request.reject(error || new Error('Token generation failed'));
      }
    }
  }

  /**
   * Handle successful token generation
   */
  handleTokenGenerated(token) {
    this.debug('✅ Token generated successfully', {
      tokenLength: token.length,
      queueSize: this.generationQueue.length
    });

    if (this.currentRequest) {
      this.currentRequest.resolve(token);
      this.currentRequest = null;
    }
  }

  /**
   * Handle token generation error
   */
  handleTokenError(errorCode) {
    console.error('❌ Token generation error:', errorCode);

    // Reset widget on error for next attempt
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.reset(this.widgetId);
        this.debug('🔄 Widget reset after error');
      } catch (err) {
        // Ignore reset errors
      }
    }

    const error = new Error(`Turnstile error: ${errorCode}`);
    
    if (this.currentRequest) {
      this.currentRequest.reject(error);
      this.currentRequest = null;
    }
  }

  /**
   * Handle token expiration
   */
  handleTokenExpired() {
    this.debug('⏰ Token expired');
    // Tokens are single-use, so expiration is expected after use
  }

  /**
   * Handle token timeout
   */
  handleTokenTimeout() {
    console.warn('⏱️ Token generation timeout');
    
    // Reset widget on timeout for next attempt
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.reset(this.widgetId);
        this.debug('🔄 Widget reset after timeout');
      } catch (err) {
        // Ignore reset errors
      }
    }
    
    const error = new Error('Token generation timeout');
    
    if (this.currentRequest) {
      this.currentRequest.reject(error);
      this.currentRequest = null;
    }
  }

  /**
   * Check if token generator is ready
   */
  isReady() {
    return this.isInitialized && window.turnstile && this.widgetId;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.debug('🧹 Cleaning up token generator');

    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    if (this.containerElement && document.body.contains(this.containerElement)) {
      document.body.removeChild(this.containerElement);
    }

    this.widgetId = null;
    this.containerElement = null;
    this.isInitialized = false;
    this.isGenerating = false;
    this.generationQueue = [];
    this.currentRequest = null;
  }
}

// Export singleton instance
export const turnstileTokenGenerator = new TurnstileTokenGenerator();

export default turnstileTokenGenerator;
