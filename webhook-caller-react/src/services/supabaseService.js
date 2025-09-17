const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zemaqahsqafhcnhqwnlb.supabase.co/rest/v1/conversations";
const SUPABASE_TOKEN = import.meta.env.VITE_SUPABASE_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbWFxYWhzcWFmaGNuaHF3bmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDc2OTQsImV4cCI6MjA3MzQ4MzY5NH0.d1gcT4eBXbXeONo8kXMjuEF5wbeZKQcnFI5bFglwnbg";

class SupabaseService {
  constructor() {
    this.baseURL = SUPABASE_URL;
    this.token = SUPABASE_TOKEN;
  }

  /**
   * Fetch conversation history by account_id and optionally session_id
   * @param {string} accountId - Account ID
   * @param {string|null} sessionId - Optional session ID to filter
   * @returns {Array} Array of conversation records
   */
  async fetchHistory(accountId, sessionId = null) {
    try {
      let url = `${this.baseURL}?select=*&account_id=eq.${accountId}`;
      
      if (sessionId) {
        url += `&session_id=eq.${sessionId}`;
      }
      
      // Order by created_at descending (newest first)
      url += `&order=created_at.desc`;

      console.log('Fetching history from:', url);

      const response = await fetch(url, {
        headers: {
          'apikey': this.token,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Supabase response:', data);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching history from Supabase:', error);
      throw error;
    }
  }

  /**
   * Transform Supabase records to chat messages format
   * @param {Array} records - Raw Supabase records
   * @returns {Object} Grouped sessions with messages
   */
  transformToSessions(records) {
    const grouped = {};
    const sessionList = [];

    records.forEach(record => {
      const { session_id, user_text, response_text, created_at, function_name } = record;
      
      // Initialize session if not exists
      if (!grouped[session_id]) {
        grouped[session_id] = [];
        
        // Add to session list if not already present
        if (!sessionList.find(s => s.sessionId === session_id)) {
          sessionList.push({
            sessionId: session_id,
            created_at: created_at,
            function_name: function_name || null
          });
        }
      }

      // Add user message
      if (user_text) {
        grouped[session_id].push({
          role: "user",
          text: user_text,
          created_at: created_at
        });
      }

      // Add assistant response
      if (response_text) {
        grouped[session_id].push({
          role: "assistant", 
          text: response_text,
          created_at: created_at
        });
      }
    });

    // Sort sessions by created_at desc
    sessionList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Sort messages within each session by created_at asc (chronological order)
    Object.keys(grouped).forEach(sessionId => {
      grouped[sessionId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    return { sessions: grouped, sessionList };
  }

  /**
   * Get all conversations for an account, grouped by sessions
   * @param {string} accountId - Account ID
   * @returns {Object} { sessions: {}, sessionList: [] }
   */
  async getConversationsByAccount(accountId) {
    try {
      const records = await this.fetchHistory(accountId);
      return this.transformToSessions(records);
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { sessions: {}, sessionList: [] };
    }
  }

  /**
   * Get specific session conversation
   * @param {string} accountId - Account ID  
   * @param {string} sessionId - Session ID
   * @returns {Array} Messages array
   */
  async getSessionMessages(accountId, sessionId) {
    try {
      const records = await this.fetchHistory(accountId, sessionId);
      const { sessions } = this.transformToSessions(records);
      return sessions[sessionId] || [];
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }

  /**
   * Update function_name for a specific session
   * @param {string} accountId - Account ID
   * @param {string} sessionId - Session ID
   * @param {string} functionName - Function name to update
   * @returns {boolean} Success status
   */
  async updateSessionFunctionName(accountId, sessionId, functionName) {
    try {
      const url = `${this.baseURL}?account_id=eq.${accountId}&session_id=eq.${sessionId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': this.token,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          function_name: functionName
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Function name updated successfully for session:', sessionId);
      return true;
    } catch (error) {
      console.error('Error updating function name:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();