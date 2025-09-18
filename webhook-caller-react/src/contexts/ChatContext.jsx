import React, { createContext, useContext, useReducer, useEffect } from "react";
import { supabaseService } from "../services/supabaseService";
import { webhookService } from "../services/webhookService";

const ChatContext = createContext();

const initialState = {
  sessions: {}, // { sessionId: [messages] }
  currentSession: "",
  sessionList: [], // [{ sessionId, created_at, title, function_name }]
  sessionFunctionNames: {}, // { sessionId: functionName }
  status: "Ready",
  loading: false,
  error: null,
};

function chatReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_SESSIONS_AND_LIST":
      return { 
        ...state, 
        sessions: action.payload.sessions,
        sessionList: action.payload.sessionList,
        sessionFunctionNames: {
          ...state.sessionFunctionNames,
          ...action.payload.sessionFunctionNames
        }
      };
    case "SET_CURRENT_SESSION":
      return { ...state, currentSession: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [state.currentSession]: [
            ...(state.sessions[state.currentSession] || []),
            action.payload
          ]
        }
      };
    case "REPLACE_LAST_MESSAGE":
      const currentMessages = state.sessions[state.currentSession] || [];
      const updatedMessages = [...currentMessages];
      if (updatedMessages.length > 0) {
        updatedMessages[updatedMessages.length - 1] = action.payload;
      }
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [state.currentSession]: updatedMessages
        }
      };
    case "ADD_NEW_SESSION":
      const newSessions = {
        ...state.sessions,
        [action.payload.sessionId]: action.payload.messages
      };
      const newSessionList = [
        { 
          sessionId: action.payload.sessionId, 
          created_at: new Date().toISOString(),
          title: action.payload.title || "New Conversation"
        },
        ...state.sessionList
      ];
      return {
        ...state,
        sessions: newSessions,
        sessionList: newSessionList,
        currentSession: action.payload.sessionId,
        sessionFunctionNames: {
          ...state.sessionFunctionNames,
          [action.payload.sessionId]: action.payload.function_name || null
        }
      };
    case "UPDATE_SESSION_MESSAGES":
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.payload.sessionId]: action.payload.messages
        }
      };
    case "SET_SESSION_FUNCTION_NAME":
      const updatedSessionList = state.sessionList.map(session => 
        session.sessionId === action.payload.sessionId 
          ? { ...session, function_name: action.payload.functionName }
          : session
      );
      return {
        ...state,
        sessionList: updatedSessionList,
        sessionFunctionNames: {
          ...state.sessionFunctionNames,
          [action.payload.sessionId]: action.payload.functionName
        }
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function ChatProvider({ children, accountId }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load history when accountId changes
  useEffect(() => {
    if (accountId) {
      loadAccountHistory();
    }
  }, [accountId]);

  /**
   * Load all conversation history for account
   */
  const loadAccountHistory = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_STATUS", payload: "Loading history..." });
    
    try {
      console.log('Loading history for account:', accountId);
      
      const { sessions, sessionList } = await supabaseService.getConversationsByAccount(accountId);
      
      console.log('Loaded sessions:', sessions);
      console.log('Session list:', sessionList);

      // Create titles for existing sessions and extract function names
      const sessionFunctionNames = {};
      const updatedSessionList = sessionList.map(session => {
        // Use existing title if available and not empty, otherwise generate from messages
        let title = session.title && session.title.trim() !== "" ? session.title : null;
        
        if (!title && sessions[session.sessionId]) {
          title = generateSessionTitle(sessions[session.sessionId]);
        }

        // Store function name for this session
        if (session.function_name) {
          sessionFunctionNames[session.sessionId] = session.function_name;
        }
        
        return {
          ...session,
          title: title || "New Conversation",
          function_name: session.function_name || ''
        };
      });

      dispatch({
        type: "SET_SESSIONS_AND_LIST",
        payload: { 
          sessions, 
          sessionList: updatedSessionList,
          sessionFunctionNames
        }
      });

      // Set current session to latest or create new
      if (updatedSessionList.length > 0) {
        dispatch({ type: "SET_CURRENT_SESSION", payload: updatedSessionList[0].sessionId });
        dispatch({ type: "SET_STATUS", payload: `Loaded ${updatedSessionList.length} conversations` });
      } else {
        await createNewSession();
      }
    } catch (error) {
      console.error('Error loading account history:', error);
      dispatch({ type: "SET_ERROR", payload: "Error when loading history" });
      dispatch({ type: "SET_STATUS", payload: "Error loading history" });
      
      // Create new session as fallback
      await createNewSession();
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Create new session
   */
  const createNewSession = async () => {
    // Create session ID immediately to pass down to hook
    const newSessionId = webhookService.generateSessionId();
    const welcomeMessage = {
      role: "assistant",
      text: `Hi ${accountId}! I am an AI assistant help you create Functional Design Documents. Please describe overview and I will start design!.`,
      created_at: new Date().toISOString()
    };

    console.log('Creating new session:', newSessionId);

    // Create new session with welcome message
    dispatch({
      type: "ADD_NEW_SESSION",
      payload: {
        sessionId: newSessionId,
        messages: [welcomeMessage],
        title: "New Conversation"
      }
    });
    
    dispatch({ type: "SET_STATUS", payload: "New Conversation created!" });
    return newSessionId;
  };

  /**
   * Switch to different session
   */
  const switchSession = async (sessionId) => {
    console.log('Switching to session:', sessionId);
    
    dispatch({ type: "SET_CURRENT_SESSION", payload: sessionId });
    dispatch({ type: "SET_STATUS", payload: "Loading message..." });
    
    try {
      // Check if messages already loaded
      if (state.sessions[sessionId] && state.sessions[sessionId].length > 0) {
        dispatch({ type: "SET_STATUS", payload: "Ready!" });
        return;
      }

      // Load messages for this session
      const messages = await supabaseService.getSessionMessages(accountId, sessionId);
      
      dispatch({
        type: "UPDATE_SESSION_MESSAGES",
        payload: { sessionId, messages }
      });
      
      dispatch({ type: "SET_STATUS", payload: "Messages loaded" });
    } catch (error) {
      console.error('Error switching session:', error);
      dispatch({ type: "SET_ERROR", payload: "Error loading messages" });
        dispatch({ type: "SET_STATUS", payload: "Error" });
    }
  };

  // Helper function to generate title from first few lines of conversation
  const generateSessionTitle = (messages) => {
    if (!messages || messages.length === 0) return "New Conversation";
    
    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.role === "user");
    
    if (!firstUserMessage || !firstUserMessage.text) {
      return "New Conversation";
    }
    
    let titleText = firstUserMessage.text.trim();
    
    // Remove special characters and clean text
    titleText = titleText.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    
    // Truncate title if too long (max 40 characters)
    if (titleText.length > 40) {
      // Find nearest space to cut complete words
      const cutIndex = titleText.lastIndexOf(' ', 37);
      titleText = cutIndex > 20 ? titleText.substring(0, cutIndex) + "..." : titleText.substring(0, 37) + "...";
    }
    
    // Capitalize first letter
    titleText = titleText.charAt(0).toUpperCase() + titleText.slice(1);
    
    return titleText || "New Conversation";
  };

  // Send message when pressing Enter (finalResult=false)
  const sendMessage = async (functionName, text) => {
    if (!functionName?.trim() || !text?.trim()) {
      dispatch({ type: "SET_STATUS", payload: "Please enter complete information" });
      return;
    }

    // Use current session ID (already created from createNewSession)
    const sessionId = state.currentSession;
    if (!sessionId) {
      dispatch({ type: "SET_ERROR", payload: "No session ID" });
      return;
    }

    // Add user message immediately
    const userMessage = {
      role: "user",
      text: text,
      created_at: new Date().toISOString()
    };

    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    
    // Add loading message for assistant
    const loadingMessage = {
      role: "assistant",
      text: "",
      created_at: new Date().toISOString(),
      isLoading: true
    };
    dispatch({ type: "ADD_MESSAGE", payload: loadingMessage });
    
    dispatch({ type: "SET_STATUS", payload: "Sending message..." });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      console.log('Sending message:', {
        accountId,
        sessionId: sessionId,
        functionName,
        text,
        finalResult: false
      });

      const response = await webhookService.sendMessage({
        accountId,
        sessionId: sessionId,
        functionName,
        text,
        finalResult: false
      });

      console.log('N8N response:', response);

      // Handle response - replace loading message with actual response
      if (response) {
        let responseText;
        
        // Check if response is array (n8n returns array format)
        if (Array.isArray(response) && response.length > 0) {
          const firstItem = response[0];
          
          // Case 1: finalResult=true -> response contains link_docs
          if (firstItem.link_docs) {
            const linkDocs = firstItem.link_docs.replace(/Link docs:\\n `|` /g, '').trim();
            responseText = `📄 **Functional Design Document**\n\n🔗 [Xem tài liệu](${linkDocs})`;
          }
          // Case 2: finalResult=false -> response contains response_text
          else if (firstItem.response_text) {
            responseText = firstItem.response_text;
          }
          // Fallback: use entire object as string
          else {
            responseText = JSON.stringify(firstItem, null, 2);
          }
        } else if (response?.data) {
          responseText = response.data;
        } else if (typeof response === 'string') {
          responseText = response;
        } else {
          responseText = JSON.stringify(response, null, 2);
        }
        
        const assistantMessage = {
          role: "assistant",
          text: responseText,
          created_at: new Date().toISOString(),
          isLoading: false
        };
        
        dispatch({ type: "REPLACE_LAST_MESSAGE", payload: assistantMessage });

        // Update session title based on new messages (if needed)
        const currentMessages = state.sessions[sessionId] || [];
        if (currentMessages.length <= 2) { // Only update title for new sessions
          const allMessages = [...currentMessages, userMessage, assistantMessage];
          const newTitle = generateSessionTitle(allMessages);
          
          // Update title in sessionList
          const updatedSessionList = state.sessionList.map(session => 
            session.sessionId === sessionId 
              ? { ...session, title: newTitle }
              : session
          );
          
          dispatch({
            type: "SET_SESSIONS_AND_LIST",
            payload: { 
              sessions: {
                ...state.sessions,
                [sessionId]: allMessages
              }, 
              sessionList: updatedSessionList 
            }
          });
        }
      } else {
        // Handle unexpected response format
        const errorMessage = {
          role: "assistant",
          text: "Please reload page.",
          created_at: new Date().toISOString(),
          isLoading: false
        };
        dispatch({ type: "REPLACE_LAST_MESSAGE", payload: errorMessage });
      }

      dispatch({ type: "SET_STATUS", payload: "Message sent" });
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText;
      if (error.name === 'AbortError') {
        errorText = `⏱️ API is taking too long (>4 minutes). Please try again later or check your connection.`;
      } else if (error.message.includes('fetch')) {
        errorText = `🌐 Network connection error. Please check your connection and try again.`;
      } else if (error.message.includes('timeout')) {
        errorText = `⏱️ Request is being processed, please wait...`;
      } else {
        errorText = `❌ Error sending message: ${error.message}`;
      }
      
      const errorMessage = {
        role: "assistant",
        text: errorText,
        created_at: new Date().toISOString(),
        isLoading: false
      };
      
      dispatch({ type: "REPLACE_LAST_MESSAGE", payload: errorMessage });
      dispatch({ type: "SET_STATUS", payload: "Error sending message" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Send approve (finalResult=true) when pressing Approve button
  const approveFinalResult = async (functionName) => {
    // Add loading message for assistant
    const loadingMessage = {
      role: "assistant",
      text: "",
      created_at: new Date().toISOString(),
      isLoading: true
    };
    dispatch({ type: "ADD_MESSAGE", payload: loadingMessage });
    
    dispatch({ type: "SET_STATUS", payload: "Sending confirmation..." });
    dispatch({ type: "SET_LOADING", payload: true });
    
    try {
      const response = await webhookService.sendMessage({
        accountId,
        sessionId: state.currentSession,
        functionName: functionName || "",
        text: "", // Empty text as requested
        finalResult: true
      });
      
      console.log('Approve response:', response);
      
      // Handle response with link_docs
      if (response) {
        let responseText;
        
        // Check if response is array (n8n returns array format)
        if (Array.isArray(response) && response.length > 0) {
          const firstItem = response[0];
          
          // Case 1: finalResult=true -> response contains link_docs
          if (firstItem.link_docs) {
            const linkDocs = firstItem.link_docs.trim();
            responseText = `${linkDocs}`;
          }
          // Case 2: finalResult=false -> response contains response_text
          else if (firstItem.response_text) {
            responseText = firstItem.response_text;
          }
          // Fallback: use entire object as string
          else {
            responseText = JSON.stringify(firstItem, null, 2);
          }
        } else if (response?.data) {
          responseText = response.data;
        } else if (typeof response === 'string') {
          responseText = response;
        } else {
          responseText = JSON.stringify(response, null, 2);
        }
        
        const assistantMessage = {
          role: "assistant",
          text: responseText,
          created_at: new Date().toISOString(),
          isLoading: false
        };
        dispatch({ type: "REPLACE_LAST_MESSAGE", payload: assistantMessage });
      } else {
        const errorMessage = {
          role: "assistant",
          text: "Please retry.",
          created_at: new Date().toISOString(),
          isLoading: false
        };
        dispatch({ type: "REPLACE_LAST_MESSAGE", payload: errorMessage });
      }
      
      dispatch({ type: "SET_STATUS", payload: "Result confirmed" });
    } catch (error) {
      console.error('Error approving final result:', error);
      
      let errorText;
       if (error.name === 'AbortError') {
         errorText = `⏱️ API is taking too long (>4 minutes). Please try again later or check your connection.`;
       } else if (error.message.includes('fetch')) {
         errorText = `🌐 Network connection error. Please check your connection and try again.`;
       } else if (error.message.includes('timeout')) {
         errorText = `⏱️ Request is being processed, please wait...`;
       } else {
         errorText = `❌ Error confirming result: ${error.message}`;
       }
      
      const errorMessage = {
        role: "assistant",
        text: errorText,
        created_at: new Date().toISOString(),
        isLoading: false
      };
      dispatch({ type: "REPLACE_LAST_MESSAGE", payload: errorMessage });
      dispatch({ type: "SET_STATUS", payload: "Error sending confirmation" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Reset chat context
   */
  const reset = () => {
    dispatch({ type: "RESET" });
  };

  // Set function name for current session
  const setSessionFunctionName = async (functionName) => {
    if (state.currentSession && functionName?.trim()) {
      // Update local state first
      dispatch({
        type: "SET_SESSION_FUNCTION_NAME",
        payload: {
          sessionId: state.currentSession,
          functionName: functionName.trim()
        }
      });
      
      // Update in database
      try {
        await supabaseService.updateSessionFunctionName(
          accountId, 
          state.currentSession, 
          functionName.trim()
        );
        console.log('Function name saved to database for session:', state.currentSession);
      } catch (error) {
        console.error('Failed to save function name to database:', error);
      }
    }
  };

  // Get function name for current session
  const getCurrentSessionFunctionName = () => {
    return state.sessionFunctionNames[state.currentSession] || null;
  };

  const value = {
    ...state,
    accountId,
    createNewSession,
    switchSession,
    sendMessage,
    approveFinalResult,
    reset,
    loadAccountHistory,
    setSessionFunctionName,
    getCurrentSessionFunctionName
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};