import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "../styles/Message.css";

export default function Message({ role, text, timestamp, isLoading }) {
  const isUser = role === "user";
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
            {isUser ? 'You' : 'AI Innovative Design Generation'}
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          )}
        </div>

        {!isUser && (
          <div className="message-actions">
            <button 
              className={`copy-button ${copySuccess ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy message"
            >
              {copySuccess ? (
                <svg className="copy-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              ) : (
                <svg className="copy-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              )}
              <span className="copy-text">
                {copySuccess ? 'Copied!' : 'Copy'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}