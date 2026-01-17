"use client";

import { useState } from "react";
import { useEncryption, useLocalEncryptedStorage } from "@/lib/crypto/useEncryption";

interface EncryptionManagerProps {
  profileJson: any;
  darkMode?: boolean;
  onEncryptionComplete?: (encrypted: {
    encryptedData: string;
    salt: string;
    iv: string;
    verificationHash: string;
  }) => void;
}

export default function EncryptionManager({
  profileJson,
  darkMode = false,
  onEncryptionComplete,
}: EncryptionManagerProps) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [generatedPassphrase, setGeneratedPassphrase] = useState("");
  const [encryptionMode, setEncryptionMode] = useState<"custom" | "generated">("custom");

  const {
    encrypt,
    generatePassphrase,
    validatePassphrase: validateUserPassphrase,
    isEncrypting,
    error,
  } = useEncryption();

  const { saveEncrypted } = useLocalEncryptedStorage();

  const cardClasses = darkMode
    ? "w-full space-y-4 bg-[#0b1020] border border-slate-800 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
    : "w-full space-y-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm";

  const inputClasses = darkMode
    ? "w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-[#020617] text-slate-100"
    : "w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white";

  const buttonClasses = darkMode
    ? "px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
    : "px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-neutral-800";

  const handleGeneratePassphrase = () => {
    const newPassphrase = generatePassphrase(6);
    setGeneratedPassphrase(newPassphrase);
    setEncryptionMode("generated");
  };

  const handleEncrypt = async () => {
    const passphraseToUse = encryptionMode === "generated" ? generatedPassphrase : passphrase;

    // Validation
    if (encryptionMode === "custom") {
      if (!passphrase) {
        alert("Please enter a passphrase");
        return;
      }

      if (passphrase !== confirmPassphrase) {
        alert("Passphrases don't match");
        return;
      }

      const validation = validateUserPassphrase(passphrase);
      if (!validation.valid) {
        alert(`Weak passphrase:\n${validation.feedback.join("\n")}`);
        return;
      }
    }

    try {
      const encrypted = await encrypt(profileJson, passphraseToUse);

      // Save to local storage
      saveEncrypted(encrypted);

      // Notify parent component
      if (onEncryptionComplete) {
        onEncryptionComplete(encrypted);
      }

      alert("✅ Identity graph encrypted successfully!\n\nYour data is now protected. Save your passphrase securely - you'll need it to decrypt your data.");
    } catch (err: any) {
      alert(`Encryption failed: ${err.message}`);
    }
  };

  const validation = encryptionMode === "custom" ? validateUserPassphrase(passphrase) : null;

  return (
    <div className={cardClasses}>
      <div>
        <h2 className="text-xl font-semibold mb-2">🔒 End-to-End Encryption</h2>
        <p className="text-xs opacity-70">
          Encrypt your identity graph before storing it. Only you will have the key to decrypt it.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setEncryptionMode("custom")}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${
              encryptionMode === "custom"
                ? "bg-black text-white border-black"
                : "bg-transparent border-neutral-300"
            }`}
          >
            Custom Passphrase
          </button>
          <button
            onClick={() => setEncryptionMode("generated")}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${
              encryptionMode === "generated"
                ? "bg-black text-white border-black"
                : "bg-transparent border-neutral-300"
            }`}
          >
            Generate Secure Passphrase
          </button>
        </div>

        {/* Custom Passphrase Mode */}
        {encryptionMode === "custom" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Passphrase (min 12 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong passphrase"
                  className={inputClasses}
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                >
                  {showPassphrase ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Confirm Passphrase
              </label>
              <input
                type={showPassphrase ? "text" : "password"}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter passphrase"
                className={inputClasses}
              />
            </div>

            {validation && passphrase && (
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-slate-900 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        validation.score >= 75
                          ? "bg-green-500"
                          : validation.score >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${validation.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] opacity-70">
                    {validation.score}% strength
                  </span>
                </div>
                {validation.feedback.length > 0 && (
                  <ul className="space-y-0.5 opacity-70">
                    {validation.feedback.map((fb, i) => (
                      <li key={i}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generated Passphrase Mode */}
        {encryptionMode === "generated" && (
          <div className="space-y-3">
            <button
              onClick={handleGeneratePassphrase}
              className={buttonClasses}
            >
              Generate Secure Passphrase
            </button>

            {generatedPassphrase && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Your generated passphrase:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-black text-white rounded text-xs font-mono">
                    {generatedPassphrase}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassphrase);
                      alert("Passphrase copied!");
                    }}
                    className="px-3 py-2 text-xs rounded-lg border hover:bg-neutral-100"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  ⚠️ <strong>Save this passphrase securely!</strong> You won't be able to decrypt your data without it.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Encrypt Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleEncrypt}
            disabled={
              isEncrypting ||
              (encryptionMode === "custom" && (!passphrase || passphrase !== confirmPassphrase)) ||
              (encryptionMode === "generated" && !generatedPassphrase)
            }
            className={`w-full ${buttonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isEncrypting ? "Encrypting..." : "🔒 Encrypt Identity Graph"}
          </button>
        </div>

        {/* Security Info */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>How it works:</strong>
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 mt-1">
            <li>• Data encrypted in your browser using AES-256-GCM</li>
            <li>• Your passphrase never leaves your device</li>
            <li>• Server stores only encrypted data (unreadable)</li>
            <li>• Only you can decrypt with your passphrase</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
