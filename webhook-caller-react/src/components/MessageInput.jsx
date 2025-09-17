import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../contexts/ChatContext";
import "../styles/MessageInput.css";

export default function MessageInput() {
  const [functionName, setFunctionName] = useState("");
  const [text, setText] = useState("");
  const [containerHeight, setContainerHeight] = useState(200);
  const containerRef = useRef(null);
  const isResizing = useRef(false);
  const { sendMessage, approveFinalResult, loading, getCurrentSessionFunctionName, setSessionFunctionName, currentSession } = useChat();

  // Load function name for current session
  useEffect(() => {
    const savedFunctionName = getCurrentSessionFunctionName();
    if (savedFunctionName) {
      setFunctionName(savedFunctionName);
    } else {
      setFunctionName("");
    }
  }, [currentSession, getCurrentSessionFunctionName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!functionName.trim() || !text.trim() || loading) return;
    
    // Save function name for this session if not already saved
    if (!getCurrentSessionFunctionName()) {
      setSessionFunctionName(functionName);
    }
    
    sendMessage(functionName, text, false);
    setText(""); // Only clear text, keep function name
  };

  const handleApprove = () => {
    if (!functionName.trim() || loading) return;
    
    // Save function name for this session if not already saved
    if (!getCurrentSessionFunctionName()) {
      setSessionFunctionName(functionName);
    }
    
    approveFinalResult(functionName);
    setText(""); // Clear text after approve
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      
      if (newHeight >= 150 && newHeight <= 500) {
        setContainerHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };



  return (
    <div 
      ref={containerRef}
      className="message-input-container" 
      style={{ height: `${containerHeight}px` }}
    >
      <div 
        className="resize-handle"
        onMouseDown={handleResizeStart}
      ></div>
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-row function-input-row">
          <div className="function-input-group">
            <label htmlFor="functionName" className="input-label">
              Function Name
            </label>
            <input
              id="functionName"
              type="text"
              placeholder={getCurrentSessionFunctionName() ? "Function name saved for this session" : "Enter function name..."}
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="function-input"
              disabled={loading || !!getCurrentSessionFunctionName()}
              title={getCurrentSessionFunctionName() ? "Function name is already set for this session" : ""}
            />
          </div>
        </div>

        <div className="input-row main-input-row">
          <div className="input-group flex-1">
            {/* <label htmlFor="messageText" className="input-label">
              Message
            </label> */}
            <textarea
              id="messageText"
              placeholder="Ask anything..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="message-textarea"
              disabled={loading}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <div className="buttons-group">
            <button
              type="submit"
              disabled={loading || !functionName.trim() || !text.trim()}
              className="send-button"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <svg className="send-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
              {loading ? 'Sending...' : 'Send'}
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={loading || !functionName.trim()}
              className="approve-button"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <svg className="approve-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {loading ? 'Processing...' : 'Approve Result'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}