"use client";

import { useState, useCallback } from "react";
import {
  encryptIdentityGraph,
  decryptIdentityGraph,
  generateSecurePassphrase,
  validatePassphrase,
  hashPassphraseForVerification,
} from "./encryption";

/**
 * React hook for managing encrypted identity graphs
 *
 * Usage:
 * const { encrypt, decrypt, generatePassphrase } = useEncryption();
 */
export function useEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Encrypt an identity graph with a passphrase
   */
  const encrypt = useCallback(
    async (profile: any, passphrase: string) => {
      setIsEncrypting(true);
      setError(null);

      try {
        // Validate passphrase
        const validation = validatePassphrase(passphrase);
        if (!validation.valid) {
          throw new Error(
            `Weak passphrase: ${validation.feedback.join(". ")}`
          );
        }

        // Encrypt
        const encrypted = await encryptIdentityGraph(profile, passphrase);

        // Also generate a verification hash (for checking passphrase later)
        const verificationHash = await hashPassphraseForVerification(
          passphrase
        );

        setIsEncrypting(false);
        return {
          ...encrypted,
          verificationHash,
        };
      } catch (err: any) {
        setError(err.message);
        setIsEncrypting(false);
        throw err;
      }
    },
    []
  );

  /**
   * Decrypt an identity graph with a passphrase
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

      try {
        const decrypted = await decryptIdentityGraph(
          encryptedData,
          salt,
          iv,
          passphrase
        );

        setIsDecrypting(false);
        return decrypted;
      } catch (err: any) {
        setError(err.message);
        setIsDecrypting(false);
        throw err;
      }
    },
    []
  );

  /**
   * Generate a secure random passphrase
   */
  const generatePassphrase = useCallback((wordCount: number = 6) => {
    return generateSecurePassphrase(wordCount);
  }, []);

  /**
   * Validate a passphrase
   */
  const validateUserPassphrase = useCallback((passphrase: string) => {
    return validatePassphrase(passphrase);
  }, []);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    encrypt,
    decrypt,
    generatePassphrase,
    validatePassphrase: validateUserPassphrase,
    isEncrypting,
    isDecrypting,
    error,
    clearError,
  };
}

/**
 * Local storage for encrypted data (client-side only)
 */
export function useLocalEncryptedStorage() {
  const STORAGE_KEY = "continuum.encrypted.profile";

  /**
   * Save encrypted profile to local storage
   */
  const saveEncrypted = useCallback(
    (encryptedData: {
      encryptedData: string;
      salt: string;
      iv: string;
      verificationHash: string;
    }) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedData));
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
   * Clear encrypted profile from local storage
   */
  const clearEncrypted = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear encrypted data:", error);
    }
  }, []);

  return {
    saveEncrypted,
    loadEncrypted,
    clearEncrypted,
  };
}
