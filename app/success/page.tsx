"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const [darkMode, setDarkMode] = useState(true);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const mainClasses = darkMode
    ? "min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 dark-gradient text-slate-50"
    : "min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 light-gradient text-neutral-900";

  return (
    <main className={mainClasses}>
      <div className={`max-w-2xl w-full ${
        darkMode ? "glass" : "glass-light"
      } rounded-3xl p-12 text-center animate-fade-in`}>
        {/* Success Icon */}
        <div className="text-8xl mb-6 animate-float">
          🎉
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold mb-4 gradient-text">
          Welcome to Continuum Pro!
        </h1>

        <p className="text-xl opacity-80 mb-8">
          Your subscription is now active. You have access to all Pro features.
        </p>

        {/* Feature List */}
        <div className={`${
          darkMode ? "bg-white/5" : "bg-black/5"
        } rounded-2xl p-6 mb-8 text-left`}>
          <h2 className="font-bold text-lg mb-4">What's included:</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">☁️</span>
              <span>Cloud backup (encrypted)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <span>Sync across all your devices</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <span>Version history & snapshots</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <span>Advanced export formats & API access</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🆕</span>
              <span>Early access to new LLMs</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-4 mb-8">
          <h2 className="font-bold text-lg">Next steps:</h2>
          <ol className="text-left space-y-2 opacity-80">
            <li>1. Check your email for a receipt and getting started guide</li>
            <li>2. Export your first AI conversation with cloud backup enabled</li>
            <li>3. Join our Discord community for tips and support</li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-smooth"
          >
            Start Using Continuum
          </a>
          <a
            href="/account/billing"
            className={`px-8 py-3 rounded-xl font-medium transition-smooth ${
              darkMode ? "glass hover:bg-white/10" : "glass-light hover:bg-black/5"
            }`}
          >
            Manage Billing
          </a>
        </div>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <p className="text-xs opacity-30 mt-8">
            Session ID: {sessionId}
          </p>
        )}
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`mt-8 px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
          darkMode ? "glass hover:bg-white/10" : "glass-light hover:bg-black/5"
        }`}
      >
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>
    </main>
  );
}
