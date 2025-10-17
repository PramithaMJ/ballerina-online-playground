/**
 * API Service
 * Handles all HTTP communication with the backend
 * Single Responsibility: API calls and response handling
 * 
 * IMPORTANT: Turnstile tokens are SINGLE-USE!
 * Each token can only be validated ONCE by Cloudflare.
 * We generate a fresh token for EACH API request.
 */

import { envConfig } from '../config/env.config';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/app.constants';
import { turnstileOnDemand } from '../utils/turnstile-on-demand.util';

const DEBUG_MODE = import.meta.env.DEV; // Only show debug logs in development

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
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
   * Execute Ballerina code
   * @param {string} code - The Ballerina code to execute
   * @param {string} version - The Ballerina version to use
   * @param {AbortSignal} signal - Optional abort signal for cancellation
   * @returns {Promise<{output: string, error: string}>}
   */
  async executeCode(code, version = '2201.12.0', signal = null) {
    if (!code || !code.trim()) {
      return {
        output: '',
        error: ERROR_MESSAGES.EMPTY_CODE,
      };
    }

    // Generate cache key
    const cacheKey = `${code}-${version}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Use the provided signal or the timeout controller
      const finalSignal = signal || controller.signal;

      // Simple approach: Don't send token, rely on Cloudflare infrastructure protection
      const headers = { 'Content-Type': 'application/json' };
      
      if (envConfig.enableVerification) {
        // Check if user has completed initial verification (for UX only)
        const isVerified = sessionStorage.getItem('turnstile_verified') === 'true';
        
        if (!isVerified) {
          this.debug('❌ User not verified yet');
          return {
            output: '',
            error: '🔒 Please complete verification first.\n\nRefresh the page if you don\'t see the verification widget.',
          };
        }
        
        this.debug('✅ User verified, making API request (no token needed)');
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.EXECUTE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, version }),
        signal: finalSignal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      // Handle Turnstile verification failures
      if (response.status === 401) {
        console.warn('❌ Verification failed - token rejected or expired');
        
        // Clear invalid token
        sessionStorage.removeItem('turnstile_verified');
        sessionStorage.removeItem('turnstile_token');
        sessionStorage.removeItem('turnstile_timestamp');
        
        return {
          output: '',
          error: '🔒 Verification token expired or rejected.\n\nPlease refresh the page to verify again.',
        };
      }

      let outputResult;
      if (response.ok) {
        // Request successful - token was accepted
        this.debug('✅ Request successful - token was accepted');
        
        // Note: Token is single-use and now consumed
        // User will need to refresh page if token expires (after 4 minutes)
        
        if (result.error) {
          outputResult = {
            output: result.output || '',
            error: result.error,
          };
        } else {
          outputResult = {
            output: result.output || SUCCESS_MESSAGES.NO_OUTPUT,
            error: '',
          };
        }
        // Cache successful results
        this.cache.set(cacheKey, outputResult);
        // Limit cache size
        if (this.cache.size > 50) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }
        return outputResult;
      }

      return {
        output: '',
        error: result.error || ERROR_MESSAGES.SERVER_ERROR,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err; // Re-throw AbortError to be handled by the caller
      }
      return {
        output: '',
        error: `${ERROR_MESSAGES.CONNECTION_ERROR}: ${err.message}\n\nMake sure the backend server is running on ${this.baseUrl}`,
      };
    }
  }
}

// Singleton instance
export const apiService = new ApiService(envConfig.apiUrl);

export default apiService;
