"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sprout, X, Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi, I'm Sprout. Ask me about plants, tools, or your recent orders.",
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The canned greeting never went through the API — leave it out
          // of what gets sent, so the model only sees the real exchange.
          messages: nextMessages.filter((message) => message !== GREETING),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Couldn't reach Sprout. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-card border border-canopy/20 bg-parchment shadow-xl sm:w-96">
          <div className="flex items-center justify-between bg-canopy px-4 py-3">
            <span className="font-display text-base text-parchment">Sprout</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-parchment/80 hover:text-parchment"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user" ? "ml-auto bg-canopy text-parchment" : "bg-sage text-loam"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-card bg-sage px-3 py-2 text-sm text-loam/60">
                Sprout is thinking…
              </div>
            )}
            {error && <p className="text-xs text-clay">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-canopy/10 p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Message Sprout
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about plants, tools, orders…"
              className="flex-1 rounded-card border border-canopy/20 bg-white px-3 py-2 text-sm text-loam focus:border-canopy"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="rounded-card bg-marigold p-2 text-loam transition-colors hover:bg-canopy hover:text-parchment disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Sprout chat" : "Open Sprout chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-canopy text-parchment shadow-lg transition-transform hover:scale-105 hover:bg-marigold hover:text-loam"
      >
        {open ? <X className="h-6 w-6" /> : <Sprout className="h-6 w-6" />}
      </button>
    </div>
  );
}
