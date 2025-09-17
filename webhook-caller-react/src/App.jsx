import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import ChatLayout from "./components/ChatLayout";
import { ChatProvider } from "./contexts/ChatContext";
import "./styles/App.css";

export default function App() {
  const [accountId, setAccountId] = useState("");
  const [accountIdEntered, setAccountIdEntered] = useState(false);

  const handleAccountSubmit = (id) => {
    setAccountId(id);
    setAccountIdEntered(true);
  };

  const handleChangeAccount = () => {
    setAccountIdEntered(false);
    setAccountId("");
  };

  if (!accountIdEntered) {
    return <LoginForm onSubmit={handleAccountSubmit} />;
  }

  return (
    <ChatProvider accountId={accountId}>
      <ChatLayout 
        accountId={accountId} 
        onChangeAccount={handleChangeAccount} 
      />
    </ChatProvider>
  );
}