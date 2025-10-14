/**
 * API Service
 * Handles all HTTP communication with the backend
 * Single Responsibility: API calls and response handling
 */

import { envConfig } from '../config/env.config';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/app.constants';
import { turnstileManager } from '../utils/turnstile-manager.util';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
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
          // Check if a token is already being used/refreshed
          const tokenUsageCount = turnstileManager.getTokenUsageCount();
          const tokenAge = turnstileManager.getTokenAge();
          
          // If token has been used before OR is old, get a fresh one
          if (tokenUsageCount > 0 || (tokenAge && parseFloat(tokenAge) > 0.5)) {
            console.log(`🔄 Token already used ${tokenUsageCount} times (age: ${tokenAge} min) - getting fresh token...`);
            await turnstileManager.refreshToken();
          }
          
          const token = await turnstileManager.getToken();
          if (token) {
            const age = turnstileManager.getTokenAge();
            const usage = turnstileManager.getTokenUsageCount();
            console.log(`🔐 Using Turnstile token for API request (age: ${age || 'new'} min, usage: ${usage})`);
            
            // Mark token as being used
            turnstileManager.incrementUsageCount();
            
            headers['CF-Turnstile-Token'] = token;
          } else {
            console.warn('⚠️ No Turnstile token available');
          }
        } catch (err) {
          console.error('❌ Failed to get Turnstile token:', err);
          return {
            output: '',
            error: '🔒 Verification failed. Please refresh the page.',
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
        console.error('❌ Verification failed (401) - token was rejected by server');
        
        // Clear and refresh token
        turnstileManager.clearToken();
        
        try {
          console.log('🔄 Attempting to refresh token...');
          await turnstileManager.refreshToken();
          console.log('✅ Token refreshed successfully');
        } catch (refreshErr) {
          console.error('❌ Token refresh failed:', refreshErr);
        }
        
        return {
          output: '',
          error: '🔒 Verification expired or invalid. A new verification token has been requested.\n\nPlease try running your code again in a moment.',
        };
      }

      let outputResult;
      if (response.ok) {
        // Request successful - token was consumed by backend
        console.log('✅ Request successful - token was accepted');
        
        // CRITICAL: Immediately request a new token after successful use
        // Turnstile tokens are single-use only!
        if (envConfig.enableVerification) {
          console.log('🔄 Token consumed - requesting fresh token immediately...');
          // Don't await - let it happen in background
          turnstileManager.refreshToken().catch(err => {
            console.error('⚠️ Background token refresh failed:', err);
          });
        }
        
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
