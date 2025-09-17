import React, { useRef, useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChat } from "../contexts/ChatContext";
import "../styles/ChatArea.css";

export default function ChatArea() {
  const { sessions, currentSession, status } = useChat();
  const scrollRef = useRef(null);

  const messages = sessions[currentSession] || [];

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="chat-area">
      <div className="chat-container">
        <div className="chat-header">
          <h1 className="chat-title">AI Assistant</h1>
          <div className="chat-status">
            <div className={`status-indicator ${status === 'Ready' ? 'ready' : 'working'}`} />
            <span>{status}</span>
          </div>
        </div>

        <div 
          className="messages-container"
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <h2>Ready to help!</h2>
              <p>What would you like to know or work on today?</p>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>

        <MessageInput />
      </div>
    </main>
  );
}