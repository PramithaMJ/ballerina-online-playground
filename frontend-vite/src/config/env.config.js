/**
 * Environment configuration
 * Centralized access to environment variables
 */

export const envConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
  enableVerification: import.meta.env.VITE_ENABLE_VERIFICATION !== 'false',
};

export default envConfig;
