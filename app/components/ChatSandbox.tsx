"use client";

import { useState } from "react";

type SandboxMessage = {
  role: "user" | "assistant";
  content: string;
};

interface ChatSandboxProps {
  profileJson: any;
  darkMode: boolean;
}

export default function ChatSandbox({ profileJson, darkMode }: ChatSandboxProps) {
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bgBubbleUser = darkMode ? "bg-emerald-600 text-white" : "bg-emerald-100";
  const bgBubbleAssistant = darkMode
    ? "bg-neutral-800 text-neutral-50"
    : "bg-neutral-100 text-neutral-900";

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileJson,
          messages: newMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Sandbox error");
        setLoading(false);
        return;
      }

      // Clean markdown **bold** so it doesn’t show as asterisks
      const rawReply = data.reply as string;
      const cleanedReply = rawReply.replace(/\*\*/g, "");

      const reply: SandboxMessage = {
        role: "assistant",
        content: cleanedReply,
      };

      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      console.error(e);
      alert("Network error in sandbox.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mini Chat Sandbox</h2>
          <p className="text-xs opacity-70">
            Talk to an assistant that is fully conditioned on your identity graph.
          </p>
        </div>
      </div>

      <div
        className="border rounded-xl p-3 h-64 overflow-y-auto space-y-2 bg-neutral-50/70"
        style={darkMode ? { backgroundColor: "#0a0a0a", borderColor: "#27272a" } : {}}
      >
        {messages.length === 0 && (
          <p className="text-xs opacity-60">
            Try something like:{" "}
            <span className="italic">
              &quot;Given my goals and constraints, what should I focus on this month?&quot;
            </span>
          </p>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ${
                m.role === "user" ? bgBubbleUser : bgBubbleAssistant
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full text-xs border rounded-lg px-3 py-2 resize-none h-16"
          placeholder="Ask something that matters to you. The assistant will respond using your identity graph."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-between text-[11px]">
          <span className="opacity-60">
            Press Enter to send · Shift+Enter for newline
          </span>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-1 rounded-full bg-black text-white text-xs disabled:opacity-40"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

