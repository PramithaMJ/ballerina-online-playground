/**
 * Environment configuration
 * Centralized access to environment variables
 * 
 * Cloudflare Pages Environment Variables:
 * - VITE_API_URL: Backend API endpoint
 * - VITE_TURNSTILE_SITE_KEY: Cloudflare Turnstile site key
 * - VITE_ENABLE_VERIFICATION: Enable/disable Turnstile verification
 */

export const envConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
  enableVerification: import.meta.env.VITE_ENABLE_VERIFICATION === 'true',
  debug: import.meta.env.DEV, // Debug mode in development
};

export default envConfig;
