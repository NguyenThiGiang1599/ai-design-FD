import React, { useState } from "react";
import "../styles/LoginForm.css";

export default function LoginForm({ onSubmit }) {
  const [accountId, setAccountId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accountId.trim()) return;
    onSubmit(accountId.trim());
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">💬</div>
            <h1 className="login-title">F-IDGS Studio AI</h1>
            <p className="login-subtitle">Connect with your personal assistant</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="accountId" className="input-label">
                Account ID
              </label>
              <input
                id="accountId"
                type="text"
                placeholder="Enter your account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="login-input"
                autoFocus
              />
            </div>
            
            <button type="submit" className="login-button">
              <span>Start Chatting</span>
              <svg className="login-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
          
          <div className="login-footer">
            <p>Secure • Fast • Intelligent</p>
          </div>
        </div>
      </div>
    </div>
  );
}