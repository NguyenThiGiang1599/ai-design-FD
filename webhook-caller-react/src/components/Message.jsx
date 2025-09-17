import React from "react";
import ReactMarkdown from 'react-markdown';
import "../styles/Message.css";

export default function Message({ role, text, timestamp, isLoading }) {
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (
          <div className="user-avatar">👤</div>
        ) : (
          <div className="assistant-avatar">🤖</div>
        )}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">
            {isUser ? 'You' : 'AI Functional Design Assistant'}
          </span>
          {timestamp && (
            <span className="message-time">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="message-text">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Processing...</span>
            </div>
          ) : isUser ? (
            text
          ) : (
            <ReactMarkdown>{text}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}