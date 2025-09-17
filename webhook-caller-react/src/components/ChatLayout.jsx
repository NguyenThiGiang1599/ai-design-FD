import React from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import "../styles/ChatLayout.css";

export default function ChatLayout({ accountId, onChangeAccount }) {
  return (
    <div className="chat-layout">
      <Sidebar 
        accountId={accountId} 
        onChangeAccount={onChangeAccount}
      />
      <ChatArea />
    </div>
  );
}