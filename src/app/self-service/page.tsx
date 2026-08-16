"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    resolved?: boolean;
    escalated?: boolean;
    appointmentScheduled?: boolean;
    ticketNumber?: string;
    appointmentNumber?: string;
  };
}

export default function SelfServicePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to DentalCRM Self-Service! I'm your AI dental assistant. I can help you:\n\n• Schedule appointments\n• View your patient history\n• Check ticket status\n• Answer dental questions\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendMessage(transcript);
        };
        recognition.onend = () => setVoiceStatus("idle");
        recognition.onerror = () => setVoiceStatus("idle");
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/self-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        metadata: {
          resolved: data.resolved,
          escalated: data.escalated,
          appointmentScheduled: data.appointmentScheduled,
          ticketNumber: data.ticketNumber,
          appointmentNumber: data.appointmentNumber,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak the response in voice mode
      if (mode === "voice" && synthRef.current) {
        setVoiceStatus("speaking");
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        utterance.onend = () => setVoiceStatus("idle");
        synthRef.current.speak(utterance);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again or contact support.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoice = () => {
    if (recognitionRef.current) {
      setVoiceStatus("listening");
      recognitionRef.current.start();
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setVoiceStatus("idle");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold">DentalCRM Self-Service</h1>
              <p className="text-blue-300/60 text-xs">AI-Powered Dental Support</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setMode("chat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "chat" ? "bg-blue-500 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMode("voice")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "voice" ? "bg-blue-500 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              🎤 Voice
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6 mb-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
                <div
                  className={`px-5 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-white/10 text-white/90 border border-white/10 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                {/* Metadata badges */}
                {msg.metadata && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.metadata.appointmentScheduled && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✅ Appointment Booked: {msg.metadata.appointmentNumber}
                      </span>
                    )}
                    {msg.metadata.ticketNumber && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        🎫 Ticket: {msg.metadata.ticketNumber}
                      </span>
                    )}
                    {msg.metadata.escalated && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚠️ Escalated to Human Agent
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/10 px-5 py-4 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-6">
          {/* Voice Status */}
          {mode === "voice" && voiceStatus !== "idle" && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
                <span className={`h-2 w-2 rounded-full ${
                  voiceStatus === "listening" ? "bg-emerald-400 animate-pulse" :
                  voiceStatus === "speaking" ? "bg-blue-400 animate-pulse" :
                  "bg-amber-400 animate-pulse"
                }`} />
                <span className="text-white/80 text-sm">
                  {voiceStatus === "listening" && "Listening..."}
                  {voiceStatus === "processing" && "Thinking..."}
                  {voiceStatus === "speaking" && "Speaking..."}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {mode === "voice" ? (
              <button
                onClick={voiceStatus === "listening" ? stopVoice : startVoice}
                disabled={isLoading}
                className={`h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  voiceStatus === "listening"
                    ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/30"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30"
                } disabled:opacity-50`}
              >
                {voiceStatus === "listening" ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            ) : (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 h-14 px-5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            )}

            {mode === "chat" && (
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="h-14 px-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            )}
          </div>

          <p className="text-center text-white/30 text-xs mt-3">
            Powered by AI • Responses are automated • <span className="text-blue-400">Talk to a human</span> if needed
          </p>
        </div>
      </div>
    </div>
  );
}
