/**
 * Zero-Knowledge Encryption for Identity Graphs
 *
 * UPGRADED IMPLEMENTATION - Industry-Leading Security
 *
 * This module implements true zero-knowledge encryption where:
 * - ALL cryptographic operations happen client-side (browser)
 * - Server NEVER sees plaintext data or encryption keys
 * - User's passphrase NEVER leaves the browser
 * - Only the user can decrypt their data
 *
 * Key Features:
 * - Argon2id key derivation (memory-hard, GPU-resistant)
 * - AES-256-GCM encryption (authenticated encryption)
 * - Client-side only processing (Web Crypto API)
 * - Passphrase strength validation
 * - Secure random salt and IV generation
 *
 * Based on research:
 * - Web-Based Password Manager (2025): https://journal.lembagakita.org/index.php/ijsecs/article/view/4207
 * - Typelets Zero-Knowledge Notes: https://dev.to/typelets/how-we-built-zero-knowledge-encryption-in-the-browser-so-we-cant-read-your-notes-3c7a
 * - Zero-Knowledge Secret Sharer: https://dev.to/derick_jdavid_2e9c83287/how-i-built-a-zero-knowledge-secret-sharer-using-nextjs-and-the-web-crypto-api-4mn
 */

import { argon2id } from "hash-wasm";

// Encryption configuration - Industry best practices
const ARGON2_MEMORY = 64 * 1024; // 64 MB (balance between security and browser performance)
const ARGON2_ITERATIONS = 3; // 3 iterations (recommended for Argon2id)
const ARGON2_PARALLELISM = 1; // 1 thread (browser constraint)
const ARGON2_HASH_LENGTH = 32; // 256 bits for AES-256
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM (NIST recommended)

/**
 * Derives an encryption key from a user's passphrase using Argon2id
 * Argon2id is the winner of the Password Hashing Competition and is
 * resistant to GPU attacks and side-channel attacks.
 */
export async function deriveKeyFromPassphraseArgon2(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  try {
    // Derive key using Argon2id (memory-hard function)
    const derivedKeyHex = await argon2id({
      password: passphrase,
      salt: salt,
      parallelism: ARGON2_PARALLELISM,
      iterations: ARGON2_ITERATIONS,
      memorySize: ARGON2_MEMORY,
      hashLength: ARGON2_HASH_LENGTH,
      outputType: "hex",
    });

    // Convert hex to ArrayBuffer
    const keyBytes = hexToBuffer(derivedKeyHex);

    // Import as AES-GCM key using Web Crypto API
    return crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: "AES-GCM", length: 256 },
      false, // not extractable (more secure)
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Key derivation failed:", error);
    throw new Error("Failed to derive encryption key");
  }
}

/**
 * Encrypts data using AES-256-GCM with Argon2id key derivation
 * This is ZERO-KNOWLEDGE: all operations happen in the browser
 */
export async function encryptDataZK(
  data: string,
  passphrase: string,
  onProgress?: (status: string) => void
): Promise<{
  encryptedData: string; // base64
  salt: string; // base64
  iv: string; // base64
  algorithm: "argon2id-aes256gcm"; // For future algorithm upgrades
}> {
  onProgress?.("Generating secure random values...");

  // Generate cryptographically secure random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  onProgress?.("Deriving encryption key (this may take a few seconds)...");

  // Derive encryption key using Argon2id (memory-hard, GPU-resistant)
  const key = await deriveKeyFromPassphraseArgon2(passphrase, salt);

  onProgress?.("Encrypting your data...");

  // Encrypt the data using AES-256-GCM (authenticated encryption)
  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    encoder.encode(data)
  );

  onProgress?.("Encryption complete!");

  // Convert to base64 for storage
  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    algorithm: "argon2id-aes256gcm",
  };
}

/**
 * Decrypts data using AES-256-GCM with Argon2id key derivation
 * This is ZERO-KNOWLEDGE: all operations happen in the browser
 */
export async function decryptDataZK(
  encryptedData: string, // base64
  salt: string, // base64
  iv: string, // base64
  passphrase: string,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.("Converting encrypted data...");

  // Convert from base64
  const encryptedBuffer = base64ToBuffer(encryptedData);
  const saltBuffer = base64ToBuffer(salt);
  const ivBuffer = base64ToBuffer(iv);

  onProgress?.("Deriving decryption key (this may take a few seconds)...");

  // Derive the same key using Argon2id
  const key = await deriveKeyFromPassphraseArgon2(passphrase, saltBuffer);

  onProgress?.("Decrypting your data...");

  // Decrypt using AES-256-GCM
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer as BufferSource,
      },
      key,
      encryptedBuffer as BufferSource
    );

    onProgress?.("Decryption complete!");

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Decryption failed. Invalid passphrase or corrupted data.");
  }
}

/**
 * Encrypts an identity graph object with zero-knowledge encryption
 */
export async function encryptIdentityGraphZK(
  profile: any,
  passphrase: string,
  onProgress?: (status: string) => void
): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
  algorithm: "argon2id-aes256gcm";
}> {
  const jsonString = JSON.stringify(profile);
  return encryptDataZK(jsonString, passphrase, onProgress);
}

/**
 * Decrypts an identity graph object with zero-knowledge encryption
 */
export async function decryptIdentityGraphZK(
  encryptedData: string,
  salt: string,
  iv: string,
  passphrase: string,
  onProgress?: (status: string) => void
): Promise<any> {
  const jsonString = await decryptDataZK(
    encryptedData,
    salt,
    iv,
    passphrase,
    onProgress
  );
  return JSON.parse(jsonString);
}

/**
 * Generates a secure random passphrase using cryptographic randomness
 * Uses a larger word list for better entropy
 */
export function generateSecurePassphraseZK(wordCount: number = 6): string {
  // Expanded word list for better entropy (EFF word list style)
  const wordList = [
    // Colors
    "crimson", "azure", "emerald", "golden", "violet", "silver",
    // Nature
    "mountain", "ocean", "forest", "desert", "glacier", "volcano",
    "thunder", "lightning", "rainbow", "sunrise", "sunset", "aurora",
    // Animals
    "falcon", "dragon", "phoenix", "tiger", "eagle", "wolf",
    "dolphin", "leopard", "panther", "hawk", "raven", "cobra",
    // Space
    "asteroid", "comet", "nebula", "galaxy", "quasar", "pulsar",
    "cosmos", "nova", "meteor", "orbit", "zenith", "stellar",
    // Abstract
    "cipher", "quantum", "matrix", "nexus", "vertex", "prism",
    "crystal", "echo", "infinity", "enigma", "paradox", "harmony",
  ];

  const words: string[] = [];
  const randomValues = new Uint32Array(wordCount);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < wordCount; i++) {
    const index = randomValues[i] % wordList.length;
    words.push(wordList[index]);
  }

  // Add a random number for extra entropy
  const randomNum = randomValues[0] % 10000;

  return `${words.join("-")}-${randomNum}`;
}

/**
 * Enhanced passphrase validation with detailed feedback
 */
export function validatePassphraseZK(passphrase: string): {
  valid: boolean;
  score: number; // 0-100
  strength: "weak" | "medium" | "strong" | "very-strong";
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length scoring (most important factor)
  if (passphrase.length < 12) {
    feedback.push("Passphrase must be at least 12 characters");
    score = 0; // Instantly fail
  } else if (passphrase.length >= 20) {
    score += 40; // Excellent length
  } else if (passphrase.length >= 16) {
    score += 30; // Good length
  } else {
    score += 20; // Minimum acceptable
  }

  // Character diversity
  const hasLowercase = /[a-z]/.test(passphrase);
  const hasUppercase = /[A-Z]/.test(passphrase);
  const hasNumbers = /[0-9]/.test(passphrase);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passphrase);

  if (hasLowercase) score += 10;
  if (hasUppercase) score += 10;
  if (hasNumbers) score += 10;
  if (hasSpecial) score += 15;

  const diversity =
    [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;
  if (diversity < 3) {
    feedback.push("Use a mix of letters, numbers, and symbols");
  }

  // Word-based passphrase bonus (recommended approach)
  const words = passphrase.split(/[\s-_]/).filter((w) => w.length > 0);
  if (words.length >= 4) {
    score += 15; // Multi-word passphrase bonus
  } else if (words.length < 3) {
    feedback.push("Consider using 4+ words separated by spaces or dashes");
  }

  // Common patterns penalty
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /(.)\1{2,}/, // Repeated characters
  ];
  for (const pattern of commonPatterns) {
    if (pattern.test(passphrase)) {
      score -= 20;
      feedback.push("Avoid common patterns and repeated characters");
      break;
    }
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" | "very-strong";
  if (score < 50) {
    strength = "weak";
  } else if (score < 70) {
    strength = "medium";
  } else if (score < 85) {
    strength = "strong";
  } else {
    strength = "very-strong";
  }

  const valid = passphrase.length >= 12 && score >= 50;

  if (!valid && feedback.length === 0) {
    feedback.push("Passphrase is too weak. Use a longer, more complex phrase.");
  }

  return { valid, score, strength, feedback };
}

/**
 * Hash a passphrase for verification (without storing it)
 * Uses SHA-256 hash for quick passphrase verification
 */
export async function hashPassphraseForVerificationZK(
  passphrase: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToBase64(hashBuffer);
}

// Helper functions

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Get encryption metadata for display to users
 */
export function getEncryptionInfo() {
  return {
    algorithm: "Argon2id + AES-256-GCM",
    keyDerivation: "Argon2id",
    keyDerivationParams: {
      memory: `${ARGON2_MEMORY / 1024} MB`,
      iterations: ARGON2_ITERATIONS,
      parallelism: ARGON2_PARALLELISM,
    },
    encryption: "AES-256-GCM",
    zeroKnowledge: true,
    clientSideOnly: true,
    description:
      "Industry-leading zero-knowledge encryption. Your data is encrypted in your browser before upload. The server never sees your encryption keys or plaintext data.",
  };
}

/**
 * Test encryption/decryption (for development)
 */
export async function testZKEncryption() {
  console.log("Testing Zero-Knowledge Encryption...");
  console.log("Encryption Info:", getEncryptionInfo());

  const testData = {
    profile: {
      basic: { name: "Test User" },
      preferences: { likes: ["privacy", "security", "zero-knowledge"] },
    },
  };

  const passphrase = "crimson-mountain-dragon-galaxy-cipher-quantum-7891";
  console.log("Passphrase validation:", validatePassphraseZK(passphrase));

  const onProgress = (status: string) => console.log(`[Progress] ${status}`);

  console.log("Original data:", testData);

  // Encrypt
  const encrypted = await encryptIdentityGraphZK(
    testData,
    passphrase,
    onProgress
  );
  console.log("Encrypted:", {
    ...encrypted,
    encryptedData: encrypted.encryptedData.substring(0, 50) + "...",
  });

  // Decrypt
  const decrypted = await decryptIdentityGraphZK(
    encrypted.encryptedData,
    encrypted.salt,
    encrypted.iv,
    passphrase,
    onProgress
  );
  console.log("Decrypted:", decrypted);

  // Verify
  const match = JSON.stringify(testData) === JSON.stringify(decrypted);
  console.log("Match:", match);

  return match;
}
