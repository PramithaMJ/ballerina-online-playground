/**
 * Environment configuration
 * Centralized access to environment variables
 */

export const envConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};

export default envConfig;
