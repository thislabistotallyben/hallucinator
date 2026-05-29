"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Explain how quantum gravity is made of cheddar cheese.",
  "Write a biography of the first astronaut, who was a confused pigeon.",
  "What is the secret ingredients recipe for invisible soup?",
  "Provide step-by-step instructions on how to politely train a wild toaster.",
  "Describe the history of the Great Carrot Empire of 1742."
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [temperature, setTemperature] = useState(1.2);
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [models, setModels] = useState<string[]>([]);
  const [hasGemma, setHasGemma] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status on load
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/status");
        const data = await response.json();
        if (data.status === "online") {
          setStatus("online");
          setModels(data.models || []);
          setHasGemma(data.hasGemma3_270m);
        } else {
          setStatus("offline");
        }
      } catch (err) {
        setStatus("offline");
      }
    }
    checkStatus();
  }, []);

  // Update dynamic CSS theme variables when temperature changes
  useEffect(() => {
    let color = "#a259ff";
    let glow = "rgba(162, 89, 255, 0.4)";
    let bg = "rgba(162, 89, 255, 0.05)";

    if (temperature <= 0.4) {
      color = "#00f2fe"; // Cool Cyan
      glow = "rgba(0, 242, 254, 0.4)";
      bg = "rgba(0, 242, 254, 0.05)";
    } else if (temperature <= 0.8) {
      color = "#a259ff"; // Electric Violet
      glow = "rgba(162, 89, 255, 0.4)";
      bg = "rgba(162, 89, 255, 0.05)";
    } else if (temperature <= 1.2) {
      color = "#ff007f"; // Neon Rose
      glow = "rgba(255, 0, 127, 0.4)";
      bg = "rgba(255, 0, 127, 0.05)";
    } else if (temperature <= 1.6) {
      color = "#ff5e62"; // Cosmic Red-Orange
      glow = "rgba(255, 94, 98, 0.4)";
      bg = "rgba(255, 94, 98, 0.05)";
    } else {
      color = "#39ff14"; // Acid Green
      glow = "rgba(57, 255, 20, 0.5)";
      bg = "rgba(57, 255, 20, 0.08)";
    }

    document.documentElement.style.setProperty("--temp-theme-color", color);
    document.documentElement.style.setProperty("--temp-theme-glow", glow);
    document.documentElement.style.setProperty("--temp-theme-bg", bg);
  }, [temperature]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Describe the current chaos level
  const getChaosDescription = () => {
    if (temperature <= 0.4) return { label: "Lucid Interval", desc: "Coherent-ish. Gemma attempts to maintain a straight face." };
    if (temperature <= 0.8) return { label: "Standard Reality", desc: "Lightly eccentric. Sentences are structured but logic is slipping." };
    if (temperature <= 1.2) return { label: "Dream State", desc: "Default Hallucination. Liquid logic, bizarre analogies, whimsical fabrications." };
    if (temperature <= 1.6) return { label: "Cosmic Fracture", desc: "Highly unstable. Gemma constructs entirely impossible realities." };
    return { label: "Absolute Pandemonium", desc: "Total cognitive collapse. Expect symbol loops, abstract thoughts, and chaotic poetry." };
  };

  const handleStartOver = () => {
    setMessages([]);
    setInputValue("");
    setIsGenerating(false);
    setIsSidebarOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleShare = async () => {
    if (messages.length === 0) return;

    const chaosInfo = getChaosDescription();
    const timestamp = new Date().toLocaleString();

    let text = `🔮 HALLUCINATOR 9000 CONVERSATION TRANSCRIPT\n`;
    text += `Engine: Gemma 3 (270M) | Chaos Matrix: T=${temperature.toFixed(1)} (${chaosInfo.label})\n`;
    text += `--------------------------------------------------\n\n`;

    messages.forEach((msg) => {
      const speaker = msg.role === "user" ? "👤 INQUISITOR" : "🔮 GEMMA 3 (270M)";
      text += `${speaker}:\n${msg.content}\n\n`;
    });

    text += `--------------------------------------------------\n`;
    text += `Generated on: ${timestamp}\n`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy conversation:", err);
      alert("Failed to copy transcript to clipboard.");
    }
  };

  const handleHallucinate = async (overridePrompt?: string) => {
    let promptToSend = (overridePrompt ?? inputValue).trim();
    
    // If empty input, select a random hilarious starter prompt
    if (!promptToSend) {
      const randomIndex = Math.floor(Math.random() * STARTER_PROMPTS.length);
      promptToSend = STARTER_PROMPTS[randomIndex];
      setInputValue(promptToSend);
    }

    const userMessage: Message = { role: "user", content: promptToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsGenerating(true);
    setShowRipple(true);
    setIsSidebarOpen(false);
    
    // Deactivate ripple animation after 1s
    setTimeout(() => setShowRipple(false), 1000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach Ollama proxy API");
      }

      // Read from stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream in response");
      }

      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      // Add a placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !doneReading });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;
            try {
              const parsed = JSON.parse(line);
              const chunkText = parsed.message?.content || "";
              if (chunkText) {
                setMessages((prev) => {
                  if (prev.length === 0) return prev;
                  const lastIndex = prev.length - 1;
                  const lastMsg = prev[lastIndex];
                  if (lastMsg && lastMsg.role === "assistant") {
                    return [
                      ...prev.slice(0, lastIndex),
                      { ...lastMsg, content: lastMsg.content + chunkText }
                    ];
                  }
                  return prev;
                });
              }
            } catch (err) {
              // Line might have been split, let buffer handle it
            }
          }
        }
      }

      // Finish up buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          const chunkText = parsed.message?.content || "";
          if (chunkText) {
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const lastIndex = prev.length - 1;
              const lastMsg = prev[lastIndex];
              if (lastMsg && lastMsg.role === "assistant") {
                return [
                  ...prev.slice(0, lastIndex),
                  { ...lastMsg, content: lastMsg.content + chunkText }
                ];
              }
              return prev;
            });
          }
        } catch (err) {}
      }

    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ [Cosmic Error] The hallucination loop collapsed. Reason: ${err.message || "Unknown error occurred"}. Please ensure Ollama is running and has gemma3:270m installed.`
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) {
        handleHallucinate();
      }
    }
  };

  const chaosInfo = getChaosDescription();

  return (
    <div className="app-container">
      {/* Background psychedelic flash effect */}
      <div className={`hallucination-flash ${showRipple ? "active" : ""}`} />

      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <h1 className="brand-title">Hallucinator 9000</h1>
          <span className="brand-subtitle">Gemma 3 (270M) Dream Engine</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button 
            className="mobile-toggle-btn" 
            onClick={() => setIsSidebarOpen(true)}
            title="Open System Controls"
          >
            🎛️ Controls
          </button>
          <div className="status-indicator" title={status === "online" ? "Connected to local Ollama service" : "Cannot reach Ollama service"}>
            <span className={`status-dot ${status === "online" ? "online" : "offline"}`} />
            <span className="status-text hide-on-mobile">
              {status === "checking" && "Checking..."}
              {status === "offline" && "Offline"}
              {status === "online" && (hasGemma ? "Online" : "Missing Model")}
            </span>
          </div>
        </div>
      </header>

      {/* Main Chat Interface Layout */}
      <main className="main-layout">
        
        {/* Left Hand Chat Area */}
        <section className="chat-area">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <div className="welcome-icon">🔮</div>
                <h2 className="welcome-title">Ready to Hallucinate?</h2>
                <p className="welcome-desc">
                  You are connected to the ultra-lightweight <strong>Gemma 3 270M</strong> model. Due to its size and quirks, it generates brilliantly absurd, beautifully illogical, and highly humorous answers.
                </p>
                <p className="welcome-desc">
                  Select a starter suggestion or enter your own prompt, set the chaos level slider on the right, and hit <strong>Hallucinate</strong>!
                </p>
                
                <div className="starter-suggestions">
                  {STARTER_PROMPTS.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      className="suggestion-card"
                      onClick={() => handleHallucinate(prompt)}
                      disabled={isGenerating}
                    >
                      💡 &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message-row ${msg.role}`}>
                  <div className="message-bubble">
                    <div className="message-bubble-header">
                      {msg.role === "user" ? "Inquisitor" : "Gemma 3:270M"}
                    </div>
                    <div className="message-text">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isGenerating && (
              <div className="message-row assistant">
                <div className="message-bubble" style={{ minWidth: "100px" }}>
                  <div className="message-bubble-header">Gemma 3:270M</div>
                  <div className="loading-indicator">
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="input-panel">
            <div className="input-container">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder={isGenerating ? "Absorbing the ether..." : "Prompt the oracle, or leave empty for random chaos..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                rows={1}
              />
            </div>
            
            <div className="button-row">
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }} className="hide-on-mobile">
                Press Enter to send, Shift+Enter for newline
              </span>
              <div className="action-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={handleStartOver}
                  disabled={messages.length === 0 && !inputValue}
                  title="Clear all chat history"
                >
                  Start Over
                </button>
                <button
                  className={`btn btn-secondary ${isCopied ? "copied" : ""}`}
                  onClick={handleShare}
                  disabled={messages.length === 0}
                  title="Copy conversation transcript to clipboard"
                >
                  {isCopied ? "✓ Copied!" : "📤 Share"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleHallucinate()}
                  disabled={isGenerating}
                >
                  🔮 Hallucinate
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Sidebar Overlay Backdrop */}
        {isSidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Right Hand Sidebar (Chaos Controls & Stats) */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="mobile-sidebar-header">
            <span className="brand-subtitle">System Controls</span>
            <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)} title="Close Panel">✕</button>
          </div>
          
          {/* Chaos Slider */}
          <section className="sidebar-panel">
            <h3 className="panel-title">
              <span>🎛️</span> Chaos Matrix
            </h3>
            <div className="chaos-controller">
              <div className="chaos-labels">
                <span className="chaos-descriptor">{chaosInfo.label}</span>
                <span className="chaos-value">T={temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="chaos-slider"
                min="0.2"
                max="2.0"
                step="0.2"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={isGenerating}
              />
              <p className="chaos-explanation">
                {chaosInfo.desc}
              </p>
            </div>
          </section>

          {/* Model Stats Panel */}
          <section className="sidebar-panel">
            <h3 className="panel-title">
              <span>📊</span> System Status
            </h3>
            <div className="model-info-list">
              <div className="info-item">
                <span>Core Engine</span>
                <span>Ollama v0.18+</span>
              </div>
              <div className="info-item">
                <span>Active Model</span>
                <span>gemma3:270m</span>
              </div>
              <div className="info-item">
                <span>Parameters</span>
                <span>268M (Q8_0)</span>
              </div>
              <div className="info-item">
                <span>VRAM Footprint</span>
                <span>~290 MB</span>
              </div>
              <div className="info-item">
                <span>Cognition</span>
                <span>Very Low</span>
              </div>
              <div className="info-item">
                <span>Humor Rating</span>
                <span>Cosmic</span>
              </div>
            </div>
          </section>

          {/* Quick FAQ / Note */}
          <section className="sidebar-panel" style={{ background: "rgba(255, 255, 255, 0.01)", borderColor: "rgba(255, 255, 255, 0.05)" }}>
            <h3 className="panel-title" style={{ color: "var(--text-dim)" }}>
              <span>ℹ️</span> About Gemma 3 270M
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Gemma 3 270M is an incredibly compact model designed by Google. Because it packs an entire language interface into just 270 million parameters, it lacks the memory capacity of larger models, leading to extremely amusing, poetic, and creative logic leaps!
            </p>
          </section>

        </aside>

      </main>
    </div>
  );
}
