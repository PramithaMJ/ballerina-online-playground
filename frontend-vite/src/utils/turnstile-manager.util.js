/**
 * Turnstile Token Manager
 * Manages token pool with pre-generated tokens for instant availability
 * Implements smart caching and background refresh
 */

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const TOKEN_VALIDITY_DURATION = 4 * 60 * 1000; // 4 minutes (tokens valid for 5 min, use 4 for safety)
const TOKEN_POOL_SIZE = 3; // Keep 3 pre-generated tokens ready
const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes - periodic cleanup and refill
const TOKEN_GENERATION_DELAY = 1500; // 1.5 seconds between token generations
const DEBUG_MODE = import.meta.env.DEV; // Only show debug logs in development

class TurnstileManager {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.isRefreshing = false;
    this.pendingResolve = null;
    this.isInitialized = false;
    this.tokenPool = []; // Pool of pre-generated tokens
    this.refreshInterval = null;
    this.isGenerating = false;
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
   * Initialize the background Turnstile widget and token pool
   */
  async initialize() {
    if (this.isInitialized) {
      this.debug(' Turnstile manager already initialized');
      return;
    }

    this.debug(' Initializing Turnstile manager with token pool...');

    // Create invisible container
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'turnstile-refresh-widget';
    this.containerElement.style.cssText = 'position: fixed; bottom: -200px; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none;';
    document.body.appendChild(this.containerElement);

    // Wait for Turnstile script to load
    await this.waitForTurnstile();
    
    // Render widget
    this.renderWidget();
    
    // Pre-generate initial token pool
    await this.preGenerateTokens();
    
    // Start periodic cleanup and refill
    this.startPeriodicMaintenance();
    
    this.isInitialized = true;
    this.debug(' Token manager initialized with pool size:', TOKEN_POOL_SIZE);
  }

  /**
   * Wait for Turnstile script to load
   */
  async waitForTurnstile() {
    return new Promise((resolve) => {
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          resolve();
        }
      }, 100);
    });
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
        size: 'compact',
        callback: (token) => this.handleTokenReceived(token),
        'error-callback': (errorCode) => this.handleTokenError(errorCode),
        'expired-callback': () => this.handleTokenExpired(),
        'timeout-callback': () => this.handleTokenTimeout(),
        theme: 'light',
        action: 'pool-refresh',
        retry: 'auto',
        'retry-interval': 2000,
      });
      this.debug(' Background widget rendered with ID:', this.widgetId);
    } catch (err) {
      console.error('❌ Error rendering background Turnstile widget:', err);
    }
  }

  /**
   * Handle token received from widget
   */
  handleTokenReceived(token) {
    this.debug(' Token generated for pool');
    
    const tokenData = {
      token,
      timestamp: Date.now(),
      used: false,
    };

    // Add to pool if not full
    if (this.tokenPool.length < TOKEN_POOL_SIZE) {
      this.tokenPool.push(tokenData);
      this.debug(`📦 Token added to pool (${this.tokenPool.length}/${TOKEN_POOL_SIZE})`);
    }

    this.isRefreshing = false;
    this.isGenerating = false;

    // Resolve pending promise
    if (this.pendingResolve) {
      this.pendingResolve(token);
      this.pendingResolve = null;
    }
  }

  /**
   * Handle token error
   */
  handleTokenError(errorCode) {
    console.warn(' Token generation error:', errorCode);
    this.isRefreshing = false;
    this.isGenerating = false;
    
    if (this.pendingResolve) {
      this.pendingResolve(null);
      this.pendingResolve = null;
    }
  }

  /**
   * Handle token expired
   */
  handleTokenExpired() {
    this.debug(' Token expired - cleaning pool');
    this.cleanupExpiredTokens();
  }

  /**
   * Handle token timeout
   */
  handleTokenTimeout() {
    console.warn(' Token generation timeout');
    this.isRefreshing = false;
    this.isGenerating = false;
    
    if (this.pendingResolve) {
      this.pendingResolve(null);
      this.pendingResolve = null;
    }
  }

  /**
   * Pre-generate tokens to fill the pool
   */
  async preGenerateTokens() {
    const tokensNeeded = TOKEN_POOL_SIZE - this.getAvailableTokenCount();
    
    this.debug(` Pre-generating ${tokensNeeded} tokens...`);
    
    for (let i = 0; i < tokensNeeded; i++) {
      await this.generateSingleToken();
      
      // Small delay between generations to avoid rate limiting
      if (i < tokensNeeded - 1) {
        await new Promise(resolve => setTimeout(resolve, TOKEN_GENERATION_DELAY));
      }
    }
    
    this.debug(` Token pool filled: ${this.getAvailableTokenCount()} available`);
  }

  /**
   * Generate a single token
   */
  async generateSingleToken() {
    if (this.isGenerating || !this.widgetId || !window.turnstile) {
      return null;
    }

    return new Promise((resolve) => {
      this.isGenerating = true;
      this.pendingResolve = resolve;

      try {
        window.turnstile.reset(this.widgetId);
        
        // Timeout after 15 seconds (increased from 10)
        setTimeout(() => {
          if (this.isGenerating) {
            console.warn(' Token generation timeout');
            this.isGenerating = false;
            if (this.pendingResolve) {
              this.pendingResolve(null);
              this.pendingResolve = null;
            }
          }
        }, 15000);
      } catch (err) {
        console.error('❌ Error generating token:', err);
        this.isGenerating = false;
        resolve(null);
      }
    });
  }

  /**
   * Get a token for use (instant if available in pool)
   */
  async getToken() {
    // Clean up expired tokens first
    this.cleanupExpiredTokens();

    // Try to get fresh unused token from pool
    const freshToken = this.tokenPool.find(t => !t.used && this.isTokenValid(t));
    
    if (freshToken) {
      freshToken.used = true;
      this.debug(`🎯 Using pooled token (${this.getAvailableTokenCount()} remaining)`);
      
      // Trigger background refill if running low
      if (this.getAvailableTokenCount() < 1) {
        this.refillPoolInBackground();
      }
      
      return freshToken.token;
    }

    // No cached token available, generate one now
    this.debug(' No pooled token available, generating new one...');
    const token = await this.generateSingleToken();
    
    // Trigger background refill
    this.refillPoolInBackground();
    
    return token;
  }

  /**
   * Refill token pool in background (non-blocking)
   */
  refillPoolInBackground() {
    if (this.isGenerating) return;

    const tokensNeeded = TOKEN_POOL_SIZE - this.getAvailableTokenCount();

    if (tokensNeeded > 0) {
      this.debug(` Background refill: generating ${tokensNeeded} tokens`);
      
      // Generate tokens in background without blocking
      setTimeout(async () => {
        for (let i = 0; i < tokensNeeded; i++) {
          await this.generateSingleToken();
          await new Promise(resolve => setTimeout(resolve, TOKEN_GENERATION_DELAY));
        }
      }, 0);
    }
  }

  /**
   * Start periodic maintenance (cleanup and refill)
   */
  startPeriodicMaintenance() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      this.debug(' Periodic maintenance: cleaning and refilling pool');
      this.cleanupAndRefill();
    }, REFRESH_INTERVAL);
  }

  /**
   * Cleanup expired/used tokens and refill pool
   */
  async cleanupAndRefill() {
    // Remove expired or used tokens
    const beforeCount = this.tokenPool.length;
    this.tokenPool = this.tokenPool.filter(t => !t.used && this.isTokenValid(t));
    const removedCount = beforeCount - this.tokenPool.length;
    
    if (removedCount > 0) {
      this.debug(`🧹 Cleaned ${removedCount} tokens from pool`);
    }

    // Refill to maintain pool size
    await this.preGenerateTokens();
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const beforeCount = this.tokenPool.length;
    this.tokenPool = this.tokenPool.filter(t => this.isTokenValid(t));
    const removedCount = beforeCount - this.tokenPool.length;
    
    if (removedCount > 0) {
      this.debug(`🧹 Removed ${removedCount} expired tokens`);
    }
  }

  /**
   * Check if token is still valid
   */
  isTokenValid(tokenData) {
    const age = Date.now() - tokenData.timestamp;
    return age < TOKEN_VALIDITY_DURATION;
  }

  /**
   * Get count of available (unused and valid) tokens
   */
  getAvailableTokenCount() {
    return this.tokenPool.filter(t => !t.used && this.isTokenValid(t)).length;
  }

  /**
   * Get token pool statistics
   */
  getPoolStats() {
    const available = this.getAvailableTokenCount();
    const used = this.tokenPool.filter(t => t.used).length;
    const expired = this.tokenPool.filter(t => !this.isTokenValid(t)).length;
    
    return {
      total: this.tokenPool.length,
      available,
      used,
      expired,
      maxSize: TOKEN_POOL_SIZE,
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    // Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Remove widget
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch (err) {
        // Ignore errors during cleanup
      }
    }
    
    // Remove container
    if (this.containerElement && document.body.contains(this.containerElement)) {
      document.body.removeChild(this.containerElement);
    }
    
    // Clear state
    this.widgetId = null;
    this.containerElement = null;
    this.isInitialized = false;
    this.tokenPool = [];
    this.isRefreshing = false;
    this.isGenerating = false;
    this.pendingResolve = null;
  }
}

// Singleton instance
export const turnstileManager = new TurnstileManager();

export default turnstileManager;
