import React, { useState } from "react";
import { useChat } from "../contexts/ChatContext";
import "../styles/Sidebar.css";

export default function Sidebar({ accountId, onChangeAccount }) {
  const { sessionList, sessions, currentSession, createNewSession, switchSession } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Function to normalize text (remove diacritics and convert to lowercase)
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
  };

  const filteredSessions = sessionList.filter(session => {
    if (!searchTerm.trim()) return true;
    
    const normalizedSearchTerm = normalizeText(searchTerm);
    
    // Search in session title/function name
    const titleMatch = normalizeText(session.title || session.function_name || "").includes(normalizedSearchTerm);
    
    // Search in conversation content
    const sessionMessages = sessions[session.sessionId] || [];
    const contentMatch = sessionMessages.some(message => 
      normalizeText(message.text || "").includes(normalizedSearchTerm)
    );
    
    return titleMatch || contentMatch;
  });

  const handleDragStart = (e, session) => {
    setDraggedItem(session);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, session) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(session);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e, targetSession) => {
    e.preventDefault();
    setDraggedItem(null);
    setDragOverItem(null);
    // Có thể thêm logic reorder sessions ở đây nếu cần
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">💬</div>
          <h2 className="brand-title">F-IDGS Studio</h2>
        </div>
        
        <div className="account-info">
          <div className="account-avatar">
            {accountId.charAt(0).toUpperCase()}
          </div>
          <div className="account-details">
            <span className="account-name">{accountId}</span>
            <button 
              onClick={onChangeAccount}
              className="change-account-btn"
            >
              Change Account
            </button>
          </div>
        </div>

        <button 
          onClick={createNewSession}
          className="new-chat-btn"
        >
          <svg className="new-chat-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="sidebar-content">
        <div className="search-section">
          <div className="search-input-container">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="sessions-list">
          <div className="sessions-header">
            <h3>Recent Conversations</h3>
            <span className="sessions-count">{filteredSessions.length}</span>
          </div>
          
          <div className="sessions-container">
            {filteredSessions.length === 0 ? (
              <div className="no-sessions">
                <p>No conversations found</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => switchSession(session.sessionId)}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, session)}
                  onDragOver={(e) => handleDragOver(e, session)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, session)}
                  onDragEnd={handleDragEnd}
                  className={`session-item ${
                    session.sessionId === currentSession ? 'active' : ''
                  } ${
                    draggedItem?.sessionId === session.sessionId ? 'dragging' : ''
                  } ${
                    dragOverItem?.sessionId === session.sessionId ? 'drag-over' : ''
                  }`}
                >
                  <div className="drag-handle">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <circle cx="2" cy="3" r="1"/>
                      <circle cx="6" cy="3" r="1"/>
                      <circle cx="10" cy="3" r="1"/>
                      <circle cx="2" cy="6" r="1"/>
                      <circle cx="6" cy="6" r="1"/>
                      <circle cx="10" cy="6" r="1"/>
                      <circle cx="2" cy="9" r="1"/>
                      <circle cx="6" cy="9" r="1"/>
                      <circle cx="10" cy="9" r="1"/>
                    </svg>
                  </div>
                  <div className="session-info">
                    <div className="session-title">
                      {session.function_name || session.title || `${session.sessionId.substring(5, 15)}...`}
                    </div>
                    <div className="session-time">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="session-indicator">
                    {session.sessionId === currentSession && (
                      <div className="active-indicator" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}