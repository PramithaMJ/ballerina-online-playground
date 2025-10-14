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

      // Get fresh Turnstile token (auto-refreshes if needed)
      const headers = { 'Content-Type': 'application/json' };
      
      if (envConfig.enableVerification) {
        try {
          // Get token from pool (instant if available, otherwise generates new one)
          const token = await turnstileManager.getToken();
          
          if (token) {
            this.debug('🔐 Using Turnstile token for API request');
            headers['CF-Turnstile-Token'] = token;
          } else {
            // No token available - show user-friendly message
            console.warn(' Verification token not ready yet');
            return {
              output: '',
              error: '🔒 Security verification is initializing...\n\nPlease wait a moment and try again.',
            };
          }
        } catch (err) {
          console.error(' Failed to get Turnstile token:', err);
          return {
            output: '',
            error: '🔒 Verification temporarily unavailable.\n\nPlease wait a moment and try again, or refresh the page if the issue persists.',
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
        console.warn(' Verification failed - token may have been rejected');
        
        return {
          output: '',
          error: '🔒 Verification failed. The token may have expired or been rejected.\n\nA fresh token will be used for your next request.',
        };
      }

      let outputResult;
      if (response.ok) {
        // Request successful
        this.debug(' Request successful - token was accepted');
        
        // Token pool will automatically refill in background
        // No need to manually trigger refresh after each request
        
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
