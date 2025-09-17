import React from "react";
import Message from "./Message";
import "../styles/MessageList.css";

export default function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <Message
          key={index}
          role={message.role}
          text={message.text}
          timestamp={message.created_at}
          isLoading={message.isLoading}
        />
      ))}
    </div>
  );
}