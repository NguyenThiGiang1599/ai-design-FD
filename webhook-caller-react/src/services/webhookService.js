const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "https://idgs.io.vn";
const WEBHOOK_PATH = import.meta.env.VITE_WEBHOOK_PATH || "/webhook/generate-fd";

class WebhookService {
  constructor() {
    this.baseURL = WEBHOOK_URL;
    this.webhookPath = WEBHOOK_PATH;
  }

  /**
   * Send message to N8N webhook
   * @param {Object} params - Message parameters
   * @param {string} params.accountId - Account ID
   * @param {string} params.sessionId - Session ID  
   * @param {string} params.functionName - Function name
   * @param {string} params.text - Message text
   * @param {boolean} params.finalResult - Whether this is final result
   * @returns {Object} N8N response
   */
  async sendMessage({ accountId, sessionId, functionName, text, finalResult = false }) {
    try {
      // Format theo N8N requirement
      const payload = [{
        accountId: accountId,
        sessionId: sessionId,
        functionName: functionName,
        text: text,
        finalResult: finalResult
      }];

      console.log('Sending to N8N:', {
        url: `${this.baseURL}${this.webhookPath}`,
        payload
      });

      const response = await fetch(`${this.baseURL}${this.webhookPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8N webhook error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('N8N response:', data);
      
      return data;
    } catch (error) {
      console.error('Error sending message to N8N:', error);
      throw error;
    }
  }

  /**
   * Test connection to N8N webhook
   * @returns {boolean} Connection status
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('N8N connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `sess_${timestamp}_${random}`;
  }
}

export const webhookService = new WebhookService();