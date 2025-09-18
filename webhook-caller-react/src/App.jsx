import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import ChatLayout from "./components/ChatLayout";
import { ChatProvider } from "./contexts/ChatContext";
import "./styles/App.css";

function ChatPage() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const handleChangeAccount = () => {
    navigate("/");
  };

  return (
    <ChatProvider accountId={accountId}>
      <ChatLayout 
        accountId={accountId} 
        onChangeAccount={handleChangeAccount} 
      />
    </ChatProvider>
  );
}

function LoginPage() {
  const navigate = useNavigate();

  const handleAccountSubmit = (id) => {
    navigate(`/${id}`);
  };

  return <LoginForm onSubmit={handleAccountSubmit} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/:accountId" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}