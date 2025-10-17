/**
 * On-Demand Turnstile Token Generator
 * 
 * Generates fresh Turnstile tokens for each API request.
 * Uses invisible widget to avoid disrupting user experience.
 * 
 * IMPORTANT: Turnstile tokens are SINGLE-USE!
 * Each token can only be verified ONCE by Cloudflare.
 * After verification, the token is consumed and cannot be reused.
 * 
 * @see https://developers.cloudflare.com/turnstile/
 */

import { envConfig } from '../config';

class TurnstileOnDemandGenerator {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.debug = envConfig.debug;
  }

  /**
   * Initialize invisible widget container
   */
  initialize() {
    if (this.containerElement) {
      return; // Already initialized
    }

    // Create invisible container for Turnstile widget
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'turnstile-on-demand-container';
    this.containerElement.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      visibility: hidden;
      pointer-events: none;
    `;
    document.body.appendChild(this.containerElement);

    this.log('✅ On-demand generator initialized');
  }

  /**
   * Generate fresh token for API request
   * 
   * @returns {Promise<string>} Fresh Turnstile token
   * @throws {Error} If token generation fails
   */
  async generateToken() {
    if (!window.turnstile) {
      throw new Error('Turnstile not loaded');
    }

    this.initialize();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Token generation timeout'));
      }, 30000); // 30 second timeout

      try {
        this.log('🔄 Generating fresh token...');

        this.widgetId = window.turnstile.render(this.containerElement, {
          sitekey: envConfig.turnstile.siteKey,
          callback: (token) => {
            clearTimeout(timeout);
            this.log('✅ Fresh token generated');
            this.cleanup();
            resolve(token);
          },
          'error-callback': (error) => {
            clearTimeout(timeout);
            console.error('❌ Token generation failed:', error);
            this.cleanup();
            reject(new Error(`Token generation failed: ${error}`));
          },
          'timeout-callback': () => {
            clearTimeout(timeout);
            console.error('⏱️ Token generation timeout');
            this.cleanup();
            reject(new Error('Token generation timeout'));
          },
          size: 'invisible',
          theme: 'light',
          action: 'api-request',
          cData: `request-${Date.now()}`,
        });
      } catch (err) {
        clearTimeout(timeout);
        this.cleanup();
        reject(err);
      }
    });
  }

  /**
   * Clean up widget after token generation
   */
  cleanup() {
    if (this.widgetId !== null) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch (err) {
        // Ignore cleanup errors
      }
      this.widgetId = null;
    }
  }

  /**
   * Destroy the generator completely
   */
  destroy() {
    this.cleanup();
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
      this.containerElement = null;
    }
  }

  log(...args) {
    if (this.debug) {
      console.log('[TurnstileOnDemand]', ...args);
    }
  }
}

// Export singleton instance
export const turnstileOnDemand = new TurnstileOnDemandGenerator();
