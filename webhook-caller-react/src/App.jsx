import React, { useEffect, useMemo, useRef, useState } from "react";

// Webhook Tester – ChatGPT-style (No Tailwind, pure CSS)
// One-file React component: includes a <style> tag with vanilla CSS

export default function App() {
  // form state
  const [baseUrl, setBaseUrl] = useState("");
  const [path, setPath] = useState("/webhook/generate-fd");
  const [functionName, setFunctionName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [finalResult, setFinalResult] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Ready");

  // chat messages
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Chào bạn! Điền thông tin bên dưới và gửi để gọi webhook n8n." },
  ]);

  // history (sidebar)
  const [history, setHistory] = useState([]);

  // derived
  const endpoint = useMemo(() => {
    const base = (baseUrl || "").replace(/\/$/, "");
    const p = path?.startsWith("/") ? path : `/${path || ""}`;
    return `${base}${p}`;
  }, [baseUrl, path]);

  const payload = useMemo(() => ({
    finalResult,
    text,
    accountId,
    sessionId,
    functionName,
  }), [finalResult, text, accountId, sessionId, functionName]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // load/save localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wt_react_state") || "null");
      if (saved) {
        setBaseUrl(saved.baseUrl || "");
        setPath(saved.path || "/webhook/generate-fd");
        setFunctionName(saved.functionName || "");
        setAccountId(saved.accountId || "");
        setSessionId(saved.sessionId || "");
        setFinalResult(!!saved.finalResult);
        setText(saved.text || "");
      }
      const hist = JSON.parse(localStorage.getItem("wt_react_history") || "[]");
      setHistory(hist);
    } catch {}
  }, []);

  useEffect(() => {
    const data = { baseUrl, path, functionName, accountId, sessionId, finalResult, text };
    localStorage.setItem("wt_react_state", JSON.stringify(data));
  }, [baseUrl, path, functionName, accountId, sessionId, finalResult, text]);

  function pushHistory(item) {
    const next = [item, ...history].slice(0, 40);
    setHistory(next);
    localStorage.setItem("wt_react_history", JSON.stringify(next));
  }

  function addMessage(role, t) {
    setMessages((prev) => [...prev, { role, text: t }]);
  }

  function validate() {
    const errs = [];
    if (!baseUrl?.trim()) errs.push("Base URL");
    if (!path?.trim()) errs.push("Path");
    if (!text?.trim()) errs.push("text");
    if (!accountId?.trim()) errs.push("accountId");
    if (!sessionId?.trim()) errs.push("sessionId");
    if (!functionName?.trim()) errs.push("functionName");
    return errs;
  }

  function randomId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  }

  async function onSend() {
    const errs = validate();
    if (errs.length) { setStatus(`Thiếu: ${errs.join(", ")}`); return; }
    addMessage("user", JSON.stringify(payload, null, 2));
    setStatus("Sending...");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const txt = await res.text();
      try { addMessage("assistant", JSON.stringify(JSON.parse(txt), null, 2)); }
      catch { addMessage("assistant", txt); }
      setStatus(res.ok ? "OK" : `HTTP ${res.status}`);
      pushHistory({ title: `${functionName}${finalResult ? " (final)" : ""}`, endpoint, config: { baseUrl, path }, payload, time: Date.now() });
    } catch (err) {
      setStatus("Network/CORS error");
      addMessage("assistant", String(err));
    }
  }

  function onCopyCurl() {
    const errs = validate();
    if (errs.length) { setStatus(`Thiếu: ${errs.join(", ")}`); return; }
    // Use double-quoted -d and escape internal double quotes for a safe cURL command
    const escaped = JSON.stringify(payload).replace(/"/g, '\\"');
    const cmd = `curl -X POST ${endpoint} -H "Content-Type: application/json" -d "${escaped}"`;
    navigator.clipboard.writeText(cmd);
    setStatus("Đã copy cURL");
  }

  function onGenerateIds() {
    if (!accountId) setAccountId(randomId("acc"));
    if (!sessionId) setSessionId(randomId("sess"));
    setStatus("IDs generated");
  }

  function loadFromHistory(h) {
    setBaseUrl(h?.config?.baseUrl || "");
    setPath(h?.config?.path || "/webhook/generate-fd");
    setFunctionName(h?.payload?.functionName || "");
    setAccountId(h?.payload?.accountId || "");
    setSessionId(h?.payload?.sessionId || "");
    setFinalResult(!!h?.payload?.finalResult);
    setStatus("Loaded from history");
  }

  return (
    <div className="app">
      {/* PURE CSS styles */}
      <style>{`
        :root{--bg:#0f1115;--panel:#1b1f2a;--panel2:#0c0f14;--muted:#a0a6b6;--text:#e6ebff;--border:#262b3a;--accent:#7aa2ff}
        *{box-sizing:border-box} html,body,#root{height:100%}
        body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial}
        .app{min-height:100%;display:grid;grid-template-columns:280px 1fr}
        /* Sidebar */
        .sidebar{height:100vh;display:flex;flex-direction:column;border-right:1px solid var(--border);background:linear-gradient(180deg,var(--panel2),var(--panel))}
        .sb-top{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid var(--border)}
        .logo{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#8ab4ff,#8bf3ff)}
        .sb-title{font-weight:600}
        .sb-actions{padding:12px;border-bottom:1px solid var(--border)}
        .btn{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:#202636;border:1px solid var(--border);color:var(--text);cursor:pointer}
        .btn:hover{background:#242b3e}
        .sb-list{flex:1 1 auto;overflow:auto;padding:8px}
        .item{width:100%;text-align:left;padding:8px 10px;border-radius:10px;color:#cfd6ef;border:0;background:transparent;cursor:pointer}
        .item:hover{background:#20263a}
        .sb-footer{padding:10px;border-top:1px solid var(--border);color:var(--muted);font-size:12.5px}
        /* Main */
        .main{height:100vh;display:grid;grid-template-rows:auto 1fr auto}
        .topbar{position:sticky;top:0;display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border);background:rgba(27,31,42,.9);backdrop-filter:blur(8px)}
        .title{font-weight:700}
        .pill{margin-left:auto;padding:6px 10px;border-radius:999px;border:1px solid var(--border);color:var(--muted)}
        .chat{overflow:auto;padding:24px 0}
        .container{max-width:860px;margin:0 auto;padding:0 20px}
        .msg{display:flex;gap:12px;padding:12px 4px}
        .avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#8ab4ff,#8bf3ff)}
        .avatar.user{background:linear-gradient(135deg,#a2adc2,#6a7da1)}
        .bubble{flex:1;background:#0f1420;border:1px solid var(--border);border-radius:12px;padding:14px}
        .bubble pre{margin:6px 0 0;background:#0b0f1a;border:1px solid #1a2130;border-radius:10px;padding:12px;white-space:pre-wrap;word-break:break-word;overflow:auto}
        .muted{color:var(--muted)}
        .composer-wrap{border-top:1px solid var(--border);background:rgba(11,14,22,.8);backdrop-filter:blur(8px);padding:14px 0}
        .composer{max-width:860px;margin:0 auto;padding:0 20px}
        .grid{display:grid;gap:10px}
        .grid5{grid-template-columns:repeat(5,1fr)}
        .cell{background:#0e1320;border:1px solid var(--border);border-radius:10px;padding:10px}
        .label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
        .input{width:100%;background:transparent;border:none;color:var(--text);outline:none}
        .row{display:grid;grid-template-columns:1fr auto auto auto;gap:10px;margin-top:8px}
        .toggle{display:flex;align-items:center;gap:8px;color:var(--muted)}
        .actions{display:flex;align-items:center;gap:8px;justify-content:flex-end}
        .status{font-size:12px;color:var(--muted)}
        .editor{display:flex;gap:10px;margin-top:10px}
        textarea.editor-input{flex:1;min-height:90px;background:#0e1320;border:1px solid var(--border);border-radius:12px;color:var(--text);padding:12px 14px;outline:none}
        .btn.primary{background:linear-gradient(180deg,#2b7cff,#1e4fff);border-color:#2b6fff}
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sb-top"><div className="logo"></div><div className="sb-title">Webhook Tester</div></div>
        <div className="sb-actions"><button className="btn" onClick={() => { setMessages([{ role: "assistant", text: "(new test)" }]); setStatus("New test"); }}>＋ New test</button></div>
        <div className="sb-list" id="history">
          {history.length === 0 ? (
            <div style={{color:"#a0a6b6", fontSize:13, padding:"8px 10px"}}>Chưa có test nào</div>
          ) : (
            history.map((h, i) => (
              <button key={i} className="item" title={h.endpoint} onClick={() => loadFromHistory(h)}>
                {h.title || h.endpoint}
              </button>
            ))
          )}
        </div>
        <div className="sb-footer">Tip: bật CORS trong n8n nếu gọi từ trình duyệt.</div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <div className="title">Chat</div>
          <div className="pill">Endpoint: <code>{path}</code></div>
        </div>

        <section ref={scrollRef} className="chat">
          <div className="container">
            {messages.map((m, idx) => (
              <div key={idx} className="msg">
                <div className={`avatar ${m.role === "user" ? "user" : ""}`}></div>
                <div className="bubble">
                  <div className={m.role === "user" ? "" : "muted"}>{m.role === "user" ? "You" : "Server"}</div>
                  <pre>{m.text}</pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="composer-wrap">
          <div className="composer">
            <div className="grid grid5">
              <div className="cell"><span className="label">Base URL</span><input className="input" placeholder="https://your-n8n-host" value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} /></div>
              <div className="cell"><span className="label">Path</span><input className="input" value={path} onChange={(e)=>setPath(e.target.value)} /></div>
              <div className="cell"><span className="label">functionName</span><input className="input" placeholder="createUser" value={functionName} onChange={(e)=>setFunctionName(e.target.value)} /></div>
              <div className="cell"><span className="label">accountId</span><input className="input" placeholder="acc_123" value={accountId} onChange={(e)=>setAccountId(e.target.value)} /></div>
              <div className="cell"><span className="label">sessionId</span><input className="input" placeholder="sess_456" value={sessionId} onChange={(e)=>setSessionId(e.target.value)} /></div>
            </div>
            <div className="row">
              <label className="toggle"><input type="checkbox" checked={finalResult} onChange={(e)=>setFinalResult(e.target.checked)} /> finalResult</label>
              <div className="actions">
                <button className="btn" onClick={onGenerateIds}>Generate IDs</button>
                <button className="btn" onClick={onCopyCurl}>Copy cURL</button>
                <span className="status">{status}</span>
              </div>
            </div>
            <div className="editor">
              <textarea className="editor-input" placeholder="Nhập nội dung tin nhắn gửi vào workflow..." value={text} onChange={(e)=>setText(e.target.value)} />
              <button className="btn primary" onClick={onSend}>Send</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
