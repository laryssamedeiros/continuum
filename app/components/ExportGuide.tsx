"use client";

import { useState } from "react";

type ExportGuideProps = {
  darkMode: boolean;
};

export default function ExportGuide({ darkMode }: ExportGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chatgpt" | "claude" | "gemini">("chatgpt");

  const cardClasses = darkMode ? "glass" : "glass-light";
  const tabActiveClasses = darkMode
    ? "bg-purple-600 text-white"
    : "bg-purple-500 text-white";
  const tabInactiveClasses = darkMode
    ? "bg-white/5 hover:bg-white/10 text-slate-300"
    : "bg-black/5 hover:bg-black/10 text-neutral-700";

  return (
    <div className={`w-full max-w-4xl ${cardClasses} rounded-3xl p-6 transition-smooth`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">📚</div>
          <div>
            <h2 className="text-xl font-bold">How to Export Your AI Chat History</h2>
            <p className="text-sm opacity-70 mt-1">
              Step-by-step guide for ChatGPT, Claude, and Gemini
            </p>
          </div>
        </div>
        <div className={`text-2xl transition-transform ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4 animate-fade-in">
          {/* Tab buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("chatgpt")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
                activeTab === "chatgpt" ? tabActiveClasses : tabInactiveClasses
              }`}
            >
              💬 ChatGPT
            </button>
            <button
              onClick={() => setActiveTab("claude")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
                activeTab === "claude" ? tabActiveClasses : tabInactiveClasses
              }`}
            >
              🤖 Claude
            </button>
            <button
              onClick={() => setActiveTab("gemini")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
                activeTab === "gemini" ? tabActiveClasses : tabInactiveClasses
              }`}
            >
              ✨ Gemini
            </button>
          </div>

          {/* Tab content */}
          <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-2xl p-6`}>
            {activeTab === "chatgpt" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  💬 Export from ChatGPT
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">Open ChatGPT Settings</p>
                      <p className="opacity-70 mt-1">
                        Go to <code className="px-2 py-0.5 rounded bg-black/20">chatgpt.com</code> → Click your profile picture → Settings
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">Navigate to Data Controls</p>
                      <p className="opacity-70 mt-1">
                        Click <strong>Data controls</strong> → <strong>Export data</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">Confirm Export</p>
                      <p className="opacity-70 mt-1">
                        Click <strong>Confirm export</strong> → You'll receive an email when ready (usually within a few minutes)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold">Download Your Data</p>
                      <p className="opacity-70 mt-1">
                        Open the email → Click the download link → You'll get a <code className="px-2 py-0.5 rounded bg-black/20">.zip</code> file
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      5
                    </div>
                    <div>
                      <p className="font-semibold">Upload to Continuum</p>
                      <p className="opacity-70 mt-1">
                        Drag and drop the <code className="px-2 py-0.5 rounded bg-black/20">.zip</code> file above to extract your AI memory!
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}>
                  <p className="text-xs">
                    <strong>💡 Tip:</strong> The ZIP contains <code className="px-1.5 py-0.5 rounded bg-black/10">conversations.json</code> with your FULL chat history.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "claude" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  🤖 Export from Claude
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">Open Claude Settings</p>
                      <p className="opacity-70 mt-1">
                        Go to <code className="px-2 py-0.5 rounded bg-black/20">claude.ai</code> → Click your profile → Settings
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">Navigate to Privacy</p>
                      <p className="opacity-70 mt-1">
                        Click <strong>Privacy</strong> tab → Scroll to <strong>Data Export</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">Request Export</p>
                      <p className="opacity-70 mt-1">
                        Click <strong>Export data</strong> → Confirm → Wait for email notification
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold">Download Your Conversations</p>
                      <p className="opacity-70 mt-1">
                        Open the email (arrives within 24 hours) → Download the <code className="px-2 py-0.5 rounded bg-black/20">.zip</code> file
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                      5
                    </div>
                    <div>
                      <p className="font-semibold">Upload to Continuum</p>
                      <p className="opacity-70 mt-1">
                        Drag and drop the files (JSON, TXT, or MD) above to process!
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
                  <p className="text-xs">
                    <strong>⚠️ Note:</strong> Claude exports are only available on web/desktop, not mobile apps.
                  </p>
                </div>

                <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}>
                  <p className="text-xs">
                    <strong>💡 Alternative:</strong> Use the{" "}
                    <a
                      href="https://chromewebstore.google.com/detail/claude-exporter-save-clau/elhmfakncmnghlnabnolalcjkdpfjnin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-purple-600"
                    >
                      Claude Exporter extension
                    </a>{" "}
                    to export individual conversations as Markdown.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "gemini" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  ✨ Export from Gemini
                </h3>

                <div className={`p-4 rounded-lg ${darkMode ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
                  <p className="text-sm">
                    <strong>⚠️ No native export yet:</strong> Google Gemini doesn't have a built-in export feature. Use one of these methods:
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-bold mb-2">Option 1: Browser Extension (Recommended)</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold">Install Extension</p>
                          <p className="opacity-70 mt-1">
                            Install{" "}
                            <a
                              href="https://chromewebstore.google.com/detail/gemini-chat-exporter/ljmglaakhffcadgboicnmjabiaciniph"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-purple-600"
                            >
                              Gemini Chat Exporter
                            </a>{" "}
                            or{" "}
                            <a
                              href="https://chromewebstore.google.com/detail/gemini-all-chat-downloade/jncnfgpbecbngbcgejflppklmmhnoadp"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-purple-600"
                            >
                              Gemini All Chat Downloader
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-semibold">Export Your Chats</p>
                          <p className="opacity-70 mt-1">
                            Open <code className="px-2 py-0.5 rounded bg-black/20">gemini.google.com</code> → Click the extension icon → Export as JSON
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-semibold">Upload to Continuum</p>
                          <p className="opacity-70 mt-1">
                            Drag and drop the JSON file above!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold mb-2">Option 2: Gemini CLI</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold">Use CLI Export Command</p>
                          <p className="opacity-70 mt-1">
                            If using Gemini CLI: <code className="px-2 py-0.5 rounded bg-black/20">/export markdown</code> or <code className="px-2 py-0.5 rounded bg-black/20">/export jsonl</code>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-semibold">Upload Exported File</p>
                          <p className="opacity-70 mt-1">
                            Drag and drop the <code className="px-2 py-0.5 rounded bg-black/20">.md</code> or <code className="px-2 py-0.5 rounded bg-black/20">.jsonl</code> file above
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold mb-2">Option 3: Manual Copy</h4>
                    <p className="opacity-70">
                      Copy and paste individual conversations into a <code className="px-2 py-0.5 rounded bg-black/20">.txt</code> file and upload it.
                    </p>
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}>
                  <p className="text-xs">
                    <strong>💡 Tip:</strong> Browser extensions are the easiest way to export all Gemini conversations at once.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
