"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SpeechRecognitionInstance, SpeechRecognitionEvent } from "@/types/voice";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl?: string;
}

export function VoiceAgent({ isOpen, onClose, apiUrl = "/api/voice" }: VoiceAgentProps) {
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) setTranscript(final);
      if (interim) setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Voice error: ${event.error}`);
        setStatus("idle");
      }
    };

    recognition.onend = () => {
      if (status === "listening") {
        setStatus("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      synthRef.current?.cancel();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (transcript && status === "listening") {
      handleUserSpeech(transcript);
      setTranscript("");
      setInterimTranscript("");
    }
  }, [transcript, status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateVolume = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(avg / 255);
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      recognitionRef.current?.start();
      setStatus("listening");
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    cancelAnimationFrame(animationRef.current);
    setVolume(0);
  }, []);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = synthRef.current.getVoices();
      const preferred = voices.find((v) => v.name.includes("Google") || v.name.includes("Samantha"));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setStatus("speaking");
      utterance.onend = () => {
        setStatus("idle");
        resolve();
      };
      utterance.onerror = () => {
        setStatus("idle");
        resolve();
      };
      synthRef.current.speak(utterance);
    });
  }, []);

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      stopListening();
      setStatus("processing");

      const userMsg: VoiceMessage = { role: "user", content: text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) throw new Error("Voice API request failed");

        const data = await res.json();
        const reply = data.reply || "I'm sorry, I couldn't process that. Can you try again?";

        const assistantMsg: VoiceMessage = { role: "assistant", content: reply, timestamp: new Date() };
        setMessages((prev) => [...prev, assistantMsg]);

        await speak(reply);
      } catch {
        const errMsg = "Sorry, I encountered an error. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg, timestamp: new Date() }]);
        await speak(errMsg);
      }
    },
    [messages, apiUrl, speak, stopListening]
  );

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
      setStatus("idle");
    } else if (status === "idle") {
      startListening();
    } else if (status === "speaking") {
      synthRef.current?.cancel();
      setStatus("idle");
      startListening();
    }
  }, [status, startListening, stopListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0b1a2e 0%, #0f2340 40%, #142d50 100%)" }}>
      <div className="relative w-full max-w-lg mx-4 flex flex-col h-[90vh] max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Voice Assistant</h3>
              <p className="text-blue-300/60 text-xs">
                {status === "idle" && "Tap to speak"}
                {status === "listening" && "Listening..."}
                {status === "processing" && "Thinking..."}
                {status === "speaking" && "Speaking..."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transcript area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && status === "idle" && (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-white/60 text-sm mb-2">Tap the microphone to start</p>
              <p className="text-white/30 text-xs">Ask me about appointments, tickets, or any dental question</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white/10 text-white/90 border border-white/10 rounded-bl-md"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {status === "processing" && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {interimTranscript && (
            <div className="flex justify-end">
              <div className="bg-blue-500/30 text-blue-200/70 px-4 py-2 rounded-2xl rounded-br-md text-sm italic">
                {interimTranscript}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Volume visualizer */}
        {(status === "listening" || status === "speaking") && (
          <div className="px-6 py-2">
            <div className="flex items-center justify-center gap-1 h-8">
              {Array.from({ length: 20 }).map((_, i) => {
                const barHeight = status === "listening"
                  ? Math.max(4, volume * 32 * (1 + Math.sin(Date.now() / 200 + i * 0.5) * 0.3))
                  : Math.max(4, Math.random() * 24 + 4);
                return (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${barHeight}px`,
                      background: status === "listening"
                        ? `linear-gradient(to top, #3b82f6, #60a5fa)`
                        : `linear-gradient(to top, #10b981, #34d399)`,
                      opacity: 0.6 + volume * 0.4,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="px-6 py-2">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2 text-red-300 text-xs text-center">
              {error}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-6 py-6 flex items-center justify-center gap-4">
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setTranscript(""); setInterimTranscript(""); }}
              className="h-12 px-5 rounded-xl bg-white/10 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/20 transition-all"
            >
              Clear
            </button>
          )}

          <button
            onClick={toggleListening}
            disabled={!isSupported || status === "processing"}
            className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              status === "listening"
                ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/30"
                : status === "speaking"
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {status === "listening" ? (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : status === "speaking" ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {!isSupported && (
            <p className="text-red-400 text-xs text-center mt-2">
              Voice is not supported in this browser. Please use Chrome or Edge.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
