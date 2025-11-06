import { envConfig } from '../config';

/**
 * AI Service for interacting with the backend AI endpoints
 * Provides chat, code explanation, fixing, and suggestions
 */
class AIService {
  constructor() {
    this.baseUrl = envConfig.apiUrl || 'http://localhost:8081';
  }

  /**
   * Send chat message to AI
   * @param {string} message - User message
   * @param {string} code - Current code in editor
   * @param {string} version - Ballerina version
   * @param {object} context - Additional context
   * @param {array} history - Conversation history
   * @returns {Promise<object>} AI response with optional suggested code
   */
  async chat(message, code = '', version = 'latest', context = {}, history = []) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          code,
          version,
          context,
          history: history.slice(-5), // Keep last 5 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        response: data.response || '',
        suggestedCode: data.suggestedCode || null,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Get code explanation
   * @param {string} code - Code to explain
   * @param {string} version - Ballerina version
   * @returns {Promise<object>} Explanation
   */
  async explainCode(code, version = 'latest') {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          version,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to explain code');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        response: data.response || '',
        suggestedCode: data.suggestedCode || null,
      };
    } catch (error) {
      console.error('AI Explain Error:', error);
      throw error;
    }
  }

  /**
   * Fix code errors
   * @param {string} code - Code with errors
   * @param {string} error - Error message
   * @param {string} version - Ballerina version
   * @returns {Promise<object>} Fixed code and explanation
   */
  async fixCode(code, error = '', version = 'latest') {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          error,
          version,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fix code');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        response: data.response || '',
        suggestedCode: data.suggestedCode || null,
      };
    } catch (error) {
      console.error('AI Fix Error:', error);
      throw error;
    }
  }

  /**
   * Get code suggestions
   * @param {string} prompt - What to generate
   * @param {string} code - Current code context
   * @param {string} version - Ballerina version
   * @returns {Promise<object>} Suggested code
   */
  async suggestCode(prompt, code = '', version = 'latest') {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          code,
          version,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to suggest code');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        response: data.response || '',
        suggestedCode: data.suggestedCode || null,
      };
    } catch (error) {
      console.error('AI Suggest Error:', error);
      throw error;
    }
  }

  /**
   * Check if AI service is available
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    try {
      // Try a simple health check or minimal request
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.warn('AI service not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
