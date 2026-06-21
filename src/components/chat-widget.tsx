"use client";

import { useRef, useEffect, useState, Component, ReactNode, ErrorInfo } from "react";
import { useChat } from "@ai-sdk/react";
import { useIndustry, useIndustryColors, useIndustryChatbot } from "@/lib/industry/context";
import { useLang } from "@/lib/i18n/context";

class ChatErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("ChatWidget error:", error, info); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ChatWidgetInner() {
  const { messages, sendMessage, status, error } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  const { config } = useIndustry();
  const colors = useIndustryColors();
  const chatbot = useIndustryChatbot();
  const { t } = useLang();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br ${colors.gradient} shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 group`}
          style={{ boxShadow: `0 10px 25px -5px ${colors.primary}40` }}
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white">
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[calc(100vh-48px)] rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ animation: "chatSlideUp 0.3s ease-out" }}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${colors.gradient} px-5 py-4 flex items-center justify-between shrink-0 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <img src={config.logo} alt={config.name} className="h-10 w-10" />
              <div>
                <h3 className="text-white font-semibold text-sm">{chatbot.name} Support</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-white/80 text-xs">{t("chatWidget.online")}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors relative z-10 h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: "smooth" }}>
            {messages.length === 0 && (
              <div className="text-center py-6">
                <img src={config.logo} alt={config.name} className="h-16 w-16 mx-auto mb-4" />
                <h4 className="text-gray-900 font-bold text-lg mb-1">{t("chatWidget.welcomeTitle", `Welcome to ${config.name}`)}</h4>
                <p className="text-sm text-gray-500 mb-6">{t("chatWidget.welcomeDesc")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {chatbot.quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        setInput(action.label);
                        sendMessage({ text: action.label });
                      }}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left text-xs text-gray-700 transition-all duration-200 hover:shadow-sm group"
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0 group-hover:scale-110 transition-transform"
                        style={{ background: colors.gradientCSS }}
                      >
                        {action.icon}
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animation: "messageFadeIn 0.3s ease-out" }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? `bg-gradient-to-br ${colors.gradient} text-white rounded-br-md shadow-sm`
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div
                        className="h-5 w-5 rounded-md flex items-center justify-center"
                        style={{ background: colors.gradientCSS }}
                      >
                        <span className="text-white text-[8px] font-bold">AI</span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-500">{chatbot.name}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">
                    {message.parts
                      ?.filter((p) => p.type === "text")
                      .map((p) => p.text)
                      .join("") || ""}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start" style={{ animation: "messageFadeIn 0.3s ease-out" }}>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div
                      className="h-5 w-5 rounded-md flex items-center justify-center"
                      style={{ background: colors.gradientCSS }}
                    >
                      <span className="text-white text-[8px] font-bold">AI</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">{t("chatWidget.thinking")}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: colors.primary }} />
                    <span className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: colors.primary }} />
                    <span className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: colors.primary }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t("chatWidget.error")}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-100 shrink-0 bg-white"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chatWidget.placeholder")}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{ "--tw-ring-color": `${colors.primary}40` } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              {t("chatWidget.poweredBy", `Powered by ${chatbot.name} · AI-Powered Support`)}
            </p>
          </form>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes messageFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export function ChatWidget() {
  return (
    <ChatErrorBoundary>
      <ChatWidgetInner />
    </ChatErrorBoundary>
  );
}
