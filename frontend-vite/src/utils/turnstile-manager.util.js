/**
 * Turnstile Token Manager
 * Manages token pool with pre-generated tokens for instant availability
 * Implements smart caching and background refresh
 */

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const TOKEN_VALIDITY_DURATION = 4 * 60 * 1000; // 4 minutes (tokens valid for 5 min, use 4 for safety)
const TOKEN_POOL_SIZE = 1; // Keep only 1 pre-generated token (avoid rate limiting)
const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes - periodic cleanup and refill
const TOKEN_GENERATION_DELAY = 2000; // 2 seconds between token generations (avoid rate limiting)
const TOKEN_GENERATION_TIMEOUT = 30000; // 30 seconds timeout for token generation (increased)

class TurnstileManager {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.isRefreshing = false;
    this.pendingResolve = null;
    this.isInitialized = false;
    this.tokenPool = [];
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
      console.error(' Cannot render Turnstile widget');
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
      console.error(' Error rendering background Turnstile widget:', err);
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
    const tokensToGenerate = TOKEN_POOL_SIZE - this.tokenPool.length;
    
    this.debug(` Pre-generating ${tokensToGenerate} tokens...`);
    
    for (let i = 0; i < tokensToGenerate; i++) {
      try {
        await this.generateToken();
        // Small delay between generations to avoid rate limiting
        if (i < tokensToGenerate - 1) {
          await new Promise(resolve => setTimeout(resolve, TOKEN_GENERATION_DELAY));
        }
      } catch (error) {
        console.warn(` Failed to pre-generate token ${i + 1}:`, error);
        // Continue trying to generate remaining tokens
      }
    }
    
    this.debug(` Token pool initialized with ${this.tokenPool.length} tokens`);
  }

  /**
   * Generate a single token
   */
  generateToken() {
    return new Promise((resolve, reject) => {
      if (this.isGenerating) {
        this.debug(' Token generation already in progress...');
        // Queue this request
        setTimeout(() => {
          this.generateToken().then(resolve).catch(reject);
        }, 500);
        return;
      }

      this.isGenerating = true;
      this.pendingResolve = resolve;

      if (!this.widgetId || !window.turnstile) {
        console.error(' Turnstile widget not initialized');
        this.isGenerating = false;
        reject(new Error('Turnstile not initialized'));
        return;
      }

      try {
        this.debug(' Generating new token...');
        window.turnstile.reset(this.widgetId);
        
        // Timeout after 15 seconds (increased from 5)
        setTimeout(() => {
          if (this.isGenerating && this.pendingResolve === resolve) {
            console.warn(' Token generation timeout');
            this.isGenerating = false;
            this.pendingResolve = null;
            reject(new Error('Token generation timeout'));
          }
        }, TOKEN_GENERATION_TIMEOUT);
      } catch (err) {
        console.error('Error generating token:', err);
        this.isGenerating = false;
        this.pendingResolve = null;
        reject(err);
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

    // No cached token available - generate one now with better error handling
    this.debug(' No pooled token available, generating new one...');
    
    try {
      const token = await this.generateToken();
      
      // Trigger background refill
      this.refillPoolInBackground();
      
      return token;
    } catch (error) {
      console.error(' Token generation failed:', error);
      
      // Try to use any available token as fallback (even if old)
      const anyToken = this.tokenPool.find(t => !t.used);
      if (anyToken) {
        console.warn(' Using older token as fallback');
        anyToken.used = true;
        // Trigger background refill
        this.refillPoolInBackground();
        return anyToken.token;
      }
      
      // No tokens available at all
      console.error(' No tokens available at all');
      return null;
    }
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
          try {
            await this.generateToken();
            await new Promise(resolve => setTimeout(resolve, TOKEN_GENERATION_DELAY));
          } catch (error) {
            console.warn(` Background token generation ${i + 1} failed:`, error);
          }
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
