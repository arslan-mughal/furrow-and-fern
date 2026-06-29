"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sprout, X, Send, Loader2, AlertCircle } from "lucide-react";
import type { ResponseSource, Intent } from "@/lib/assistant/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: ResponseSource;
  intent?: Intent;
}

interface ApiResponse {
  reply: string;
  source: ResponseSource;
  intent: Intent;
  error?: string;
  retryAfter?: number;
}

// ── Source badge ──────────────────────────────────────────────────────────────

const SOURCE_LABELS: Partial<Record<ResponseSource, string>> = {
  db: "Order data",
  faq: "FAQ",
  ai: "Gardening AI",
};

function SourceBadge({ source }: { source?: ResponseSource }) {
  const label = source ? SOURCE_LABELS[source] : null;
  if (!label) return null;
  return (
    <span className="mt-1 inline-block rounded-sm bg-canopy/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-canopy/50">
      {label}
    </span>
  );
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
// Handles the bold (**text**) and link ([label](url)) syntax returned by
// the DB and FAQ handlers, without pulling in a full markdown library.

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Process inline elements: **bold** and [label](url)
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Link
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
      const linkIdx = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity;

      if (boldMatch && boldIdx <= linkIdx) {
        parts.push(remaining.slice(0, boldIdx));
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldIdx + boldMatch[0].length);
      } else if (linkMatch && linkIdx < Infinity) {
        parts.push(remaining.slice(0, linkIdx));
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            className="text-marigold underline"
            target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
            rel={linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkIdx + linkMatch[0].length);
      } else {
        parts.push(remaining);
        remaining = "";
      }
    }

    // Bullet line
    const isBullet = line.startsWith("- ") || line.startsWith("• ");
    if (isBullet) {
      const content = parts.slice(1); // drop the "- " prefix
      return (
        <li key={lineIdx} className="ml-4 list-disc">
          {content}
        </li>
      );
    }

    // Blank line → spacer
    if (line.trim() === "") {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return <p key={lineIdx}>{parts}</p>;
  });
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-card px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-canopy text-parchment"
            : "bg-sage/50 text-loam"
        }`}
      >
        <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
        {!isUser && <SourceBadge source={message.source} />}
      </div>
    </div>
  );
}

// ── Suggested prompts shown in the empty state ────────────────────────────────

const SUGGESTIONS = [
  { label: "Check my order", prompt: "What's the status of my order?" },
  { label: "Return policy", prompt: "What's your return policy?" },
  { label: "Stock check", prompt: "Do you have snake plants in stock?" },
  { label: "Plant care", prompt: "How do I care for a Monstera?" },
];

// ── Main widget ───────────────────────────────────────────────────────────────

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Sprout 🌱 I can help with order status, product availability, shipping, returns, and gardening advice. What do you need?",
  source: "faq",
  intent: "greeting",
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  // Focus input when the widget opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only send role + content — never source/intent (server derives those)
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data: ApiResponse = await res.json();

      if (res.status === 429) {
        setError(data.error ?? "Too many messages — please wait a moment.");
        setRetryAfter(data.retryAfter ?? 60);
        setMessages(history); // Remove the user message optimistic add? No, keep it
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setMessages([
        ...history,
        {
          role: "assistant",
          content: data.reply,
          source: data.source,
          intent: data.intent,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(`${message} — try again.`);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleSuggestion(prompt: string) {
    sendMessage(prompt);
  }

  const showSuggestions = messages.length === 1; // Only the greeting

  return (
    <>
      {/* ── Floating button ────────────────────────────────────────────── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-canopy text-parchment shadow-lg transition-transform hover:scale-105 hover:bg-marigold hover:text-loam focus-visible:ring-2 focus-visible:ring-marigold"
        >
          <Sprout className="h-5 w-5" strokeWidth={1.5} />
        </button>
      )}

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-40 flex w-80 flex-col overflow-hidden rounded-card border border-canopy/10 bg-parchment shadow-2xl sm:w-96"
          style={{ maxHeight: "min(560px, calc(100dvh - 80px))" }}
          role="dialog"
          aria-label="Sprout assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-canopy/10 bg-canopy px-4 py-3">
            <Sprout className="h-4 w-4 text-parchment" strokeWidth={1.5} />
            <span className="font-display text-sm text-parchment">Sprout</span>
            <span className="ml-1 stamp-badge rounded-full bg-marigold/20 px-2 py-px text-[10px] text-marigold">
              Assistant
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ml-auto rounded p-0.5 text-parchment/60 hover:text-parchment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
          >
            {messages.map((message, i) => (
              <MessageBubble key={i} message={message} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-card bg-sage/50 px-3 py-2 text-sm text-loam/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking…</span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-card bg-clay/10 px-3 py-2 text-xs text-clay">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>
                  {error}
                  {retryAfter && ` Try again in ${retryAfter}s.`}
                </span>
              </div>
            )}

            {/* Suggestion chips */}
            {showSuggestions && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSuggestion(prompt)}
                    className="rounded-full border border-canopy/20 bg-parchment px-3 py-1 text-xs text-canopy transition-colors hover:border-canopy hover:bg-sage/40"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-canopy/10 px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              aria-label="Message Sprout"
              disabled={loading}
              className="flex-1 rounded-card border border-canopy/20 bg-parchment px-3 py-2 text-sm text-loam placeholder:text-loam/40 focus:border-canopy focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-canopy text-parchment transition-colors hover:bg-marigold hover:text-loam disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
