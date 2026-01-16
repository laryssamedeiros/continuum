"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string | null;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

interface ApiKeyManagerProps {
  darkMode?: boolean;
}

export default function ApiKeyManager({ darkMode = false }: ApiKeyManagerProps) {
  const [email, setEmail] = useState("");
  const [keyName, setKeyName] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardClasses = darkMode
    ? "w-full space-y-4 bg-[#0b1020] border border-slate-800 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
    : "w-full space-y-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm";

  const inputClasses = darkMode
    ? "w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-[#020617] text-slate-100"
    : "w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white";

  const buttonClasses = darkMode
    ? "px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
    : "px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-neutral-800";

  const loadKeys = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/keys?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.keys || []);
      } else {
        setError(data.error || "Failed to load API keys");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);
    setNewKey(null);

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: keyName || undefined }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewKey(data.api_key);
        setKeyName("");
        // Reload keys
        await loadKeys();
      } else {
        setError(data.error || "Failed to create API key");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/keys?id=${keyId}&email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        // Reload keys
        await loadKeys();
      } else {
        setError(data.error || "Failed to revoke API key");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={cardClasses}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">API Key Management</h2>
          <p className="text-xs opacity-70">
            Generate and manage API keys to access your identity graph programmatically.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
            {error}
          </div>
        )}

        {newKey && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Your new API key (save this now - you won't see it again):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-black text-white rounded text-xs font-mono">
                {newKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey)}
                className="px-3 py-2 text-xs rounded-lg border hover:bg-neutral-100"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputClasses}
            />
          </div>

          <button
            onClick={loadKeys}
            disabled={loading}
            className={buttonClasses}
          >
            {loading ? "Loading..." : "Load My API Keys"}
          </button>
        </div>

        {apiKeys.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Your API Keys</h3>
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={`p-3 rounded-lg border ${
                    key.revoked_at
                      ? "opacity-50 bg-neutral-50 dark:bg-slate-900/50"
                      : "bg-neutral-50 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{key.key_prefix}...</code>
                        {key.name && (
                          <span className="text-xs opacity-70">({key.name})</span>
                        )}
                        {key.revoked_at && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-600">
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] opacity-60 mt-1">
                        Created: {formatDate(key.created_at)}
                      </p>
                      {key.last_used_at && (
                        <p className="text-[10px] opacity-60">
                          Last used: {formatDate(key.last_used_at)}
                        </p>
                      )}
                    </div>
                    {!key.revoked_at && (
                      <button
                        onClick={() => revokeKey(key.id)}
                        disabled={loading}
                        className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <h3 className="text-sm font-semibold">Create New API Key</h3>
          <div>
            <label className="block text-xs font-medium mb-1">
              Key Name (optional)
            </label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production, Development, Testing"
              className={inputClasses}
            />
          </div>
          <button
            onClick={createKey}
            disabled={loading || !email}
            className={buttonClasses}
          >
            {loading ? "Creating..." : "Generate New API Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
