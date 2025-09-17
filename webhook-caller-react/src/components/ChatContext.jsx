import React, { createContext, useContext, useReducer, useEffect } from "react";
import { supabaseService } from "../services/supabaseService";
import { webhookService } from "../services/webhookService";

const ChatContext = createContext();

const initialState = {
  sessions: {},
  currentSession: "",
  sessionList: [],
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
    
    case "SET_SESSIONS":
      return { ...state, sessions: action.payload };
    
    case "SET_CURRENT_SESSION":
      return { ...state, currentSession: action.payload };
    
    case "SET_SESSION_LIST":
      return { ...state, sessionList: action.payload };
    
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
    
    case "ADD_SESSION":
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.payload.sessionId]: action.payload.messages
        },
        sessionList: [
          { sessionId: action.payload.sessionId, created_at: new Date().toISOString() },
          ...state.sessionList
        ],
        currentSession: action.payload.sessionId
      };
    
    case "UPDATE_SESSION_MESSAGES":
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.payload.sessionId]: action.payload.messages
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

  // Generate unique sessionId
  const generateSessionId = () => {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  };

  // Initialize chat data when accountId changes
  useEffect(() => {
    if (accountId) {
      loadChatHistory();
    }
  }, [accountId]);

  const loadChatHistory = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_STATUS", payload: "Đang tải lịch sử..." });
    
    try {
      const history = await supabaseService.fetchHistory(accountId);
      
      // Group by sessionId
      const grouped = {};
      const sessionIds = [];
      
      history.forEach(msg => {
        if (!grouped[msg.session_id]) grouped[msg.session_id] = [];
        grouped[msg.session_id].push({ 
          role: msg.role, 
          text: msg.text, 
          created_at: msg.created_at 
        });
        
        if (!sessionIds.find(s => s.sessionId === msg.session_id)) {
          sessionIds.push({ 
            sessionId: msg.session_id, 
            created_at: msg.created_at 
          });
        }
      });

      // Sort sessionIds by created_at desc
      sessionIds.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      
      dispatch({ type: "SET_SESSION_LIST", payload: sessionIds });
      dispatch({ type: "SET_SESSIONS", payload: grouped });

      // Select latest session or create new
      if (sessionIds.length > 0) {
        dispatch({ type: "SET_CURRENT_SESSION", payload: sessionIds[0].sessionId });
        dispatch({ type: "SET_STATUS", payload: "Lịch sử đã tải" });
      } else {
        createNewSession();
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Lỗi khi tải lịch sử" });
      dispatch({ type: "SET_STATUS", payload: "Lỗi" });
      createNewSession();
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const createNewSession = () => {
    const newSessionId = generateSessionId();
    const welcomeMessage = {
      role: "assistant",
      text: `Xin chào ${accountId}! Hãy nhập câu hỏi để bắt đầu.`
    };

    dispatch({
      type: "ADD_SESSION",
      payload: {
        sessionId: newSessionId,
        messages: [welcomeMessage]
      }
    });
    dispatch({ type: "SET_STATUS", payload: "Ready" });
  };

  const switchSession = async (sessionId) => {
    dispatch({ type: "SET_CURRENT_SESSION", payload: sessionId });
    dispatch({ type: "SET_STATUS", payload: "Đang tải lịch sử..." });
    
    try {
      const history = await supabaseService.fetchHistory(accountId, sessionId);
      const messages = history.map(msg => ({
        role: msg.role,
        text: msg.text,
        created_at: msg.created_at
      }));
      
      dispatch({
        type: "UPDATE_SESSION_MESSAGES",
        payload: { sessionId, messages }
      });
      dispatch({ type: "SET_STATUS", payload: "Lịch sử đã tải" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Lỗi khi tải session" });
    }
  };

  const sendMessage = async (functionName, text, finalResult = false) => {
    if (!functionName?.trim() || !text?.trim()) {
      dispatch({ type: "SET_STATUS", payload: "Thiếu thông tin" });
      return;
    }

    // Add user message
    dispatch({
      type: "ADD_MESSAGE",
      payload: { role: "user", text }
    });

    dispatch({ type: "SET_STATUS", payload: "Sending..." });

    try {
      const response = await webhookService.sendMessage({
        accountId,
        sessionId: state.currentSession,
        functionName,
        text,
        finalResult
      });

      if (response?.data) {
        dispatch({
          type: "ADD_MESSAGE",
          payload: { role: "assistant", text: response.data }
        });

        if (finalResult && response.docs) {
          dispatch({
            type: "ADD_MESSAGE",
            payload: { role: "assistant", text: `Link docs: ${response.docs}` }
          });
        }
      } else {
        dispatch({
          type: "ADD_MESSAGE",
          payload: { role: "assistant", text: JSON.stringify(response) }
        });
      }

      dispatch({ type: "SET_STATUS", payload: "OK" });
    } catch (error) {
      dispatch({ type: "SET_STATUS", payload: "Network/CORS error" });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", text: String(error) }
      });
    }
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };

  const value = {
    ...state,
    createNewSession,
    switchSession,
    sendMessage,
    reset,
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