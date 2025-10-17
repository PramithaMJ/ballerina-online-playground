/**
 * On-Demand Turnstile Token Generator
 * 
 * Generates fresh Turnstile tokens for each API request.
 * Uses COMPACT widget in a modal overlay.
 * 
 * IMPORTANT: 
 * - Turnstile tokens are SINGLE-USE!
 * - "invisible" size is NOT supported by Cloudflare
 * - Valid sizes: "compact", "flexible", "normal"
 * 
 * @see https://developers.cloudflare.com/turnstile/
 */

import { envConfig } from '../config';

class TurnstileOnDemandGenerator {
  constructor() {
    this.widgetId = null;
    this.containerElement = null;
    this.overlayElement = null;
    this.debug = envConfig.debug;
  }

  /**
   * Initialize compact widget container with modal overlay
   */
  initialize() {
    if (this.containerElement) {
      return; // Already initialized
    }

    // Create modal overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'turnstile-on-demand-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    // Create container for widget
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'turnstile-on-demand-container';
    this.containerElement.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      text-align: center;
    `;

    // Add message
    const message = document.createElement('div');
    message.textContent = '🔒 Verifying your request...';
    message.style.cssText = `
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
      color: #333;
    `;
    this.containerElement.appendChild(message);

    this.overlayElement.appendChild(this.containerElement);
    document.body.appendChild(this.overlayElement);

    this.log('✅ On-demand generator initialized');
  }

  /**
   * Generate fresh token for API request
   * Shows compact widget in modal overlay
   * 
   * @returns {Promise<string>} Fresh Turnstile token
   * @throws {Error} If token generation fails
   */
  async generateToken() {
    if (!window.turnstile) {
      throw new Error('Turnstile not loaded');
    }

    this.initialize();

    // Show modal overlay
    this.overlayElement.style.display = 'flex';

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        this.overlayElement.style.display = 'none';
        reject(new Error('Token generation timeout'));
      }, 30000); // 30 second timeout

      try {
        this.log('🔄 Generating fresh token...');

        // Create a div for the widget inside the container
        const widgetDiv = document.createElement('div');
        this.containerElement.appendChild(widgetDiv);

        this.widgetId = window.turnstile.render(widgetDiv, {
          sitekey: envConfig.turnstileSiteKey,
          callback: (token) => {
            clearTimeout(timeout);
            this.log('✅ Fresh token generated');
            this.overlayElement.style.display = 'none';
            this.cleanup();
            resolve(token);
          },
          'error-callback': (error) => {
            clearTimeout(timeout);
            console.error('❌ Token generation failed:', error);
            this.overlayElement.style.display = 'none';
            this.cleanup();
            reject(new Error(`Token generation failed: ${error}`));
          },
          'timeout-callback': () => {
            clearTimeout(timeout);
            console.error('⏱️ Token generation timeout');
            this.overlayElement.style.display = 'none';
            this.cleanup();
            reject(new Error('Token generation timeout'));
          },
          size: 'compact', // CHANGED: compact instead of invisible
          theme: 'light',
          action: 'api-request',
          cData: `request-${Date.now()}`,
        });
      } catch (err) {
        clearTimeout(timeout);
        this.overlayElement.style.display = 'none';
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
    
    // Clear widget div from container (keep the message)
    if (this.containerElement) {
      const widgetDivs = this.containerElement.querySelectorAll('div:not(:first-child)');
      widgetDivs.forEach(div => div.remove());
    }
  }

  /**
   * Destroy the generator completely
   */
  destroy() {
    this.cleanup();
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
      this.overlayElement = null;
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
