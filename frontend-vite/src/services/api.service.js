/**
 * API Service
 * Handles all HTTP communication with the backend
 * Single Responsibility: API calls and response handling
 */

import { envConfig } from '../config/env.config';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/app.constants';
import { turnstileManager } from '../utils/turnstile-manager.util';

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

      // Get Turnstile token from session storage (set during initial verification)
      const headers = { 'Content-Type': 'application/json' };
      
      if (envConfig.enableVerification) {
        try {
          // First, try to get token from session storage (from initial TurnstileChallenge verification)
          let token = sessionStorage.getItem('turnstile_token');
          const timestamp = sessionStorage.getItem('turnstile_timestamp');
          
          // Check if token is still valid (less than 4 minutes old)
          const isTokenValid = timestamp && (Date.now() - parseInt(timestamp)) < 4 * 60 * 1000;
          
          if (!token || !isTokenValid) {
            // Token expired or missing - need fresh verification
            this.debug('🔄 Token expired or missing, showing verification dialog');
            
            // Clear expired token
            sessionStorage.removeItem('turnstile_verified');
            sessionStorage.removeItem('turnstile_token');
            sessionStorage.removeItem('turnstile_timestamp');
            
            return {
              output: '',
              error: '🔒 Security verification expired.\n\nPlease refresh the page to verify again.',
            };
          }
          
          this.debug('🔐 Using Turnstile token from session');
          headers['CF-Turnstile-Token'] = token;
          
        } catch (err) {
          console.error('❌ Failed to get Turnstile token:', err);
          return {
            output: '',
            error: '🔒 Verification error.\n\nPlease refresh the page and try again.',
          };
        }
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
