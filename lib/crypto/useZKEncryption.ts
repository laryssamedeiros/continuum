"use client";

import { useState, useCallback } from "react";
import {
  encryptIdentityGraphZK,
  decryptIdentityGraphZK,
  generateSecurePassphraseZK,
  validatePassphraseZK,
  hashPassphraseForVerificationZK,
  getEncryptionInfo,
} from "./zkEncryption";

/**
 * React hook for managing zero-knowledge encrypted identity graphs
 *
 * This hook provides a simple interface for encrypting and decrypting
 * user data with industry-leading zero-knowledge encryption.
 *
 * Features:
 * - Argon2id key derivation (GPU-resistant, memory-hard)
 * - AES-256-GCM encryption (authenticated encryption)
 * - Progress callbacks for user feedback
 * - Passphrase strength validation
 * - Error handling
 *
 * Usage:
 * ```tsx
 * const { encrypt, decrypt, generatePassphrase, encryptionInfo } = useZKEncryption();
 *
 * // Encrypt data
 * const encrypted = await encrypt(profileData, userPassphrase);
 *
 * // Decrypt data
 * const decrypted = await decrypt(encrypted.encryptedData, encrypted.salt, encrypted.iv, userPassphrase);
 * ```
 */
export function useZKEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Encrypt an identity graph with zero-knowledge encryption
   */
  const encrypt = useCallback(
    async (profile: any, passphrase: string) => {
      setIsEncrypting(true);
      setError(null);
      setProgress("Starting encryption...");

      try {
        // Validate passphrase strength
        const validation = validatePassphraseZK(passphrase);
        if (!validation.valid) {
          throw new Error(
            `Weak passphrase (${validation.strength}): ${validation.feedback.join(". ")}`
          );
        }

        // Encrypt with progress updates
        const encrypted = await encryptIdentityGraphZK(
          profile,
          passphrase,
          (status) => setProgress(status)
        );

        // Generate verification hash
        const verificationHash = await hashPassphraseForVerificationZK(
          passphrase
        );

        setIsEncrypting(false);
        setProgress("");

        return {
          ...encrypted,
          verificationHash,
        };
      } catch (err: any) {
        setError(err.message);
        setIsEncrypting(false);
        setProgress("");
        throw err;
      }
    },
    []
  );

  /**
   * Decrypt an identity graph with zero-knowledge encryption
   */
  const decrypt = useCallback(
    async (
      encryptedData: string,
      salt: string,
      iv: string,
      passphrase: string
    ) => {
      setIsDecrypting(true);
      setError(null);
      setProgress("Starting decryption...");

      try {
        const decrypted = await decryptIdentityGraphZK(
          encryptedData,
          salt,
          iv,
          passphrase,
          (status) => setProgress(status)
        );

        setIsDecrypting(false);
        setProgress("");
        return decrypted;
      } catch (err: any) {
        setError(err.message);
        setIsDecrypting(false);
        setProgress("");
        throw err;
      }
    },
    []
  );

  /**
   * Generate a secure random passphrase
   * Returns a cryptographically secure passphrase with high entropy
   */
  const generatePassphrase = useCallback((wordCount: number = 6) => {
    return generateSecurePassphraseZK(wordCount);
  }, []);

  /**
   * Validate a passphrase and get detailed feedback
   */
  const validateUserPassphrase = useCallback((passphrase: string) => {
    return validatePassphraseZK(passphrase);
  }, []);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get information about the encryption algorithm
   */
  const encryptionInfo = getEncryptionInfo();

  return {
    // Core functions
    encrypt,
    decrypt,
    generatePassphrase,
    validatePassphrase: validateUserPassphrase,

    // State
    isEncrypting,
    isDecrypting,
    progress,
    error,
    clearError,

    // Info
    encryptionInfo,
  };
}

/**
 * Local storage for encrypted data (client-side only)
 * Zero-knowledge architecture: encrypted data never leaves the browser
 * unless explicitly exported by the user
 */
export function useLocalZKStorage() {
  const STORAGE_KEY = "continuum.zk.encrypted.profile";
  const METADATA_KEY = "continuum.zk.metadata";

  /**
   * Save encrypted profile to local storage
   */
  const saveEncrypted = useCallback(
    (encryptedData: {
      encryptedData: string;
      salt: string;
      iv: string;
      algorithm: string;
      verificationHash: string;
    }) => {
      if (typeof window === "undefined") return false;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedData));

        // Save metadata separately (for UI display)
        const metadata = {
          encryptedAt: new Date().toISOString(),
          algorithm: encryptedData.algorithm,
          hasData: true,
        };
        localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));

        return true;
      } catch (error) {
        console.error("Failed to save encrypted data:", error);
        return false;
      }
    },
    []
  );

  /**
   * Load encrypted profile from local storage
   */
  const loadEncrypted = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to load encrypted data:", error);
      return null;
    }
  }, []);

  /**
   * Load metadata without decrypting
   */
  const loadMetadata = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(METADATA_KEY);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to load metadata:", error);
      return null;
    }
  }, []);

  /**
   * Clear encrypted profile from local storage
   */
  const clearEncrypted = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(METADATA_KEY);
    } catch (error) {
      console.error("Failed to clear encrypted data:", error);
    }
  }, []);

  /**
   * Check if encrypted data exists
   */
  const hasEncryptedData = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  }, []);

  return {
    saveEncrypted,
    loadEncrypted,
    loadMetadata,
    clearEncrypted,
    hasEncryptedData,
  };
}
