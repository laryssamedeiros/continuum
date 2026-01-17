/**
 * End-to-End Encryption for Identity Graphs
 *
 * Uses Web Crypto API for client-side encryption
 * - AES-256-GCM for encryption
 * - PBKDF2 for key derivation from passphrase
 * - Random salt and IV for each encryption
 *
 * Security model:
 * - Data is encrypted in the browser BEFORE sending to server
 * - Server only stores encrypted blobs (cannot read them)
 * - User's passphrase never leaves the browser
 * - Only the user can decrypt their data
 */

// Crypto configuration
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const AES_KEY_LENGTH = 256;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Derives an encryption key from a user's passphrase
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Convert passphrase to key material
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive AES-256 key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false, // not extractable (more secure)
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data using AES-256-GCM
 */
export async function encryptData(
  data: string,
  passphrase: string
): Promise<{
  encryptedData: string; // base64
  salt: string; // base64
  iv: string; // base64
}> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive encryption key
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  // Encrypt the data
  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    encoder.encode(data)
  );

  // Convert to base64 for storage
  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts data using AES-256-GCM
 */
export async function decryptData(
  encryptedData: string, // base64
  salt: string, // base64
  iv: string, // base64
  passphrase: string
): Promise<string> {
  // Convert from base64
  const encryptedBuffer = base64ToBuffer(encryptedData);
  const saltBuffer = base64ToBuffer(salt);
  const ivBuffer = base64ToBuffer(iv);

  // Derive the same key
  const key = await deriveKeyFromPassphrase(passphrase, saltBuffer);

  // Decrypt
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer as BufferSource,
      },
      key,
      encryptedBuffer as BufferSource
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Decryption failed. Invalid passphrase or corrupted data.");
  }
}

/**
 * Encrypts an identity graph object
 */
export async function encryptIdentityGraph(
  profile: any,
  passphrase: string
): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
}> {
  const jsonString = JSON.stringify(profile);
  return encryptData(jsonString, passphrase);
}

/**
 * Decrypts an identity graph object
 */
export async function decryptIdentityGraph(
  encryptedData: string,
  salt: string,
  iv: string,
  passphrase: string
): Promise<any> {
  const jsonString = await decryptData(encryptedData, salt, iv, passphrase);
  return JSON.parse(jsonString);
}

/**
 * Generates a secure random passphrase for users who don't want to create one
 */
export function generateSecurePassphrase(wordCount: number = 6): string {
  // Use a word list for human-readable passphrases
  const wordList = [
    "alpha", "bravo", "charlie", "delta", "echo", "foxtrot",
    "golf", "hotel", "india", "juliet", "kilo", "lima",
    "mike", "november", "oscar", "papa", "quebec", "romeo",
    "sierra", "tango", "uniform", "victor", "whiskey", "xray",
    "yankee", "zulu", "asteroid", "beacon", "crystal", "dragon",
    "eclipse", "falcon", "galaxy", "horizon", "infinite", "journey",
  ];

  const words: string[] = [];
  const randomValues = new Uint32Array(wordCount);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < wordCount; i++) {
    const index = randomValues[i] % wordList.length;
    words.push(wordList[index]);
  }

  return words.join("-");
}

/**
 * Validates passphrase strength
 */
export function validatePassphrase(passphrase: string): {
  valid: boolean;
  score: number; // 0-100
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (passphrase.length < 12) {
    feedback.push("Passphrase should be at least 12 characters");
  } else if (passphrase.length >= 20) {
    score += 30;
  } else {
    score += 15;
  }

  // Complexity checks
  if (/[a-z]/.test(passphrase)) score += 10;
  if (/[A-Z]/.test(passphrase)) score += 10;
  if (/[0-9]/.test(passphrase)) score += 10;
  if (/[^a-zA-Z0-9]/.test(passphrase)) score += 15;

  // Multiple words (spaces or dashes)
  const wordCount = passphrase.split(/[\s-]/).length;
  if (wordCount >= 4) {
    score += 25;
  } else {
    feedback.push("Consider using multiple words separated by spaces or dashes");
  }

  const valid = passphrase.length >= 12 && score >= 50;

  if (!valid) {
    feedback.push("Passphrase is too weak. Use a longer phrase or mix character types.");
  }

  return { valid, score, feedback };
}

/**
 * Hash a passphrase for verification (without storing it)
 * Returns a hash that can be used to verify the passphrase later
 */
export async function hashPassphraseForVerification(
  passphrase: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToBase64(hashBuffer);
}

// Helper functions

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
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

/**
 * Test encryption/decryption (for development)
 */
export async function testEncryption() {
  const testData = {
    profile: {
      basic: { name: "Test User" },
      preferences: { likes: ["privacy", "security"] },
    },
  };

  const passphrase = "my-super-secret-passphrase-123";

  console.log("Original data:", testData);

  // Encrypt
  const encrypted = await encryptIdentityGraph(testData, passphrase);
  console.log("Encrypted:", encrypted);

  // Decrypt
  const decrypted = await decryptIdentityGraph(
    encrypted.encryptedData,
    encrypted.salt,
    encrypted.iv,
    passphrase
  );
  console.log("Decrypted:", decrypted);

  // Verify
  console.log(
    "Match:",
    JSON.stringify(testData) === JSON.stringify(decrypted)
  );
}
