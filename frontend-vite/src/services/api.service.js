/**
 * API Service
 * Handles all HTTP communication with the backend
 * Industry-standard implementation with proper Turnstile token handling
 * 
 * Flow:
 * 1. User completes initial Turnstile verification on page load
 * 2. For each API request, generate a fresh token on-demand
 * 3. Send token in CF-Turnstile-Token header
 * 4. Backend validates token server-side
 * 5. Token is single-use and expires after 5 minutes
 */

import { envConfig } from '../config/env.config';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/app.constants';
import { turnstileTokenGenerator } from '../utils/turnstile-token-generator.util';

const DEBUG_MODE = import.meta.env.DEV;
const REQUEST_TIMEOUT = 120000; // 2 minutes for compilation + execution

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.requestCount = 0;
  }

  /**
   * Debug logging
   */
  debug(...args) {
    if (DEBUG_MODE) {
      console.log('[ApiService]', ...args);
    }
  }

  /**
   * Get a fresh Turnstile token for API request
   * @returns {Promise<string|null>} Fresh token or null if verification not enabled
   */
  async getTurnstileToken() {
    if (!envConfig.enableVerification) {
      return null;
    }

    // Check if user has completed initial verification
    const isVerified = sessionStorage.getItem('turnstile_verified') === 'true';
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    const isVerificationValid = timestamp && (Date.now() - parseInt(timestamp)) < 4 * 60 * 1000;

    if (!isVerified || !isVerificationValid) {
      throw new Error('VERIFICATION_REQUIRED');
    }

    try {
      // Generate fresh token on-demand
      this.debug('🎫 Generating fresh Turnstile token...');
      const token = await turnstileTokenGenerator.generateToken();
      this.debug('✅ Fresh token generated', { tokenLength: token.length });
      return token;
    } catch (error) {
      console.error('❌ Failed to generate token:', error);
      throw new Error('TOKEN_GENERATION_FAILED');
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

    // Check cache first
    const cacheKey = `${code}-${version}`;
    if (this.cache.has(cacheKey)) {
      this.debug('💾 Returning cached result');
      return this.cache.get(cacheKey);
    }

    // Increment request counter
    this.requestCount++;
    const requestId = this.requestCount;
    this.debug(`📤 API Request #${requestId} starting...`);

    try {
      // Setup request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Use provided signal or timeout controller
      const finalSignal = signal || controller.signal;

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
      };

      // Get fresh Turnstile token if verification is enabled
      if (envConfig.enableVerification) {
        try {
          const token = await this.getTurnstileToken();
          if (token) {
            headers['CF-Turnstile-Token'] = token;
            this.debug(`🎫 Token attached to request #${requestId}`);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error.message === 'VERIFICATION_REQUIRED') {
            return {
              output: '',
              error: '🔒 Verification expired. Please refresh the page to verify again.',
            };
          }
          
          if (error.message === 'TOKEN_GENERATION_FAILED') {
            return {
              output: '',
              error: '⚠️ Failed to generate verification token. Please try again or refresh the page.',
            };
          }
          
          throw error;
        }
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.EXECUTE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, version }),
        signal: finalSignal,
      });

      clearTimeout(timeoutId);

      // Handle response
      const result = await response.json();

      // Check for verification errors
      if (response.status === 401) {
        console.warn(`❌ Request #${requestId}: Verification failed`);
        
        // Clear verification status
        sessionStorage.removeItem('turnstile_verified');
        sessionStorage.removeItem('turnstile_timestamp');
        
        return {
          output: '',
          error: '🔒 Verification failed. Please refresh the page to verify again.\n\n' +
                 (result.error || 'Token was rejected by the server.'),
        };
      }

      if (response.status === 429) {
        console.warn(`⚠️ Request #${requestId}: Rate limit exceeded`);
        return {
          output: '',
          error: '⏱️ Too many requests. Please wait a moment and try again.\n\n' +
                 'Rate limit: 5 requests per 5 seconds',
        };
      }

      if (response.status === 503) {
        console.warn(`⚠️ Request #${requestId}: Service unavailable`);
        return {
          output: '',
          error: '🔧 Service temporarily unavailable. Please try again in a moment.\n\n' +
                 (result.error || 'The backend service may be restarting.'),
        };
      }

      // Success response
      if (response.ok) {
        this.debug(`✅ Request #${requestId} completed successfully`);
        
        const outputResult = {
          output: result.output || SUCCESS_MESSAGES.NO_OUTPUT,
          error: result.error || '',
        };

        // Cache successful results
        this.cache.set(cacheKey, outputResult);
        
        // Limit cache size
        if (this.cache.size > 50) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }

        return outputResult;
      }

      // Other error responses
      return {
        output: '',
        error: result.error || ERROR_MESSAGES.SERVER_ERROR,
      };

    } catch (err) {
      if (err.name === 'AbortError') {
        this.debug(`⏹️ Request #${requestId} aborted by user`);
        throw err; // Re-throw to be handled by caller
      }

      console.error(`❌ Request #${requestId} failed:`, err);
      return {
        output: '',
        error: `${ERROR_MESSAGES.CONNECTION_ERROR}: ${err.message}\n\n` +
               `Backend: ${this.baseUrl}\n` +
               'Please ensure the backend server is running and accessible.',
      };
    }
  }

  /**
   * Clear the result cache
   */
  clearCache() {
    this.cache.clear();
    this.debug('🧹 Cache cleared');
  }
}

// Singleton instance
export const apiService = new ApiService(envConfig.apiUrl);

export default apiService;
