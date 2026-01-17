# Privacy & Security in Continuum

**TL;DR:** Your data is encrypted in your browser before it ever reaches our servers. We can't read it. Only you have the key.

---

## Security Model

Continuum uses **end-to-end encryption** (E2EE) to protect your identity graph. Here's how it works:

```
Your Browser                    Server
     │                            │
     ├─ Generate encryption key   │
     │  from your passphrase      │
     │                            │
     ├─ Encrypt identity graph    │
     │  (AES-256-GCM)             │
     │                            │
     ├─────Encrypted data─────────>│
     │                            │
     │                     Store encrypted
     │                     blob (unreadable)
     │                            │
     │<────Encrypted data─────────┤
     │                            │
     ├─ Decrypt with passphrase   │
     │                            │
     └─ View your identity graph  │
```

**Key point:** Your passphrase NEVER leaves your browser. The server only sees encrypted data.

---

## Encryption Details

### Algorithm: AES-256-GCM

- **AES-256**: Industry-standard encryption (same used by banks and governments)
- **GCM mode**: Provides both encryption and authentication
- **256-bit keys**: Would take billions of years to brute force

### Key Derivation: PBKDF2

- **100,000 iterations**: OWASP recommended minimum
- **SHA-256 hash**: Cryptographically secure
- **Random salt**: 128 bits, unique per encryption
- **Result**: Your passphrase becomes a 256-bit encryption key

### Implementation: Web Crypto API

```typescript
// All encryption happens in your browser
const key = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: randomSalt,
    iterations: 100000,
    hash: "SHA-256"
  },
  passphraseKey,
  { name: "AES-GCM", length: 256 },
  false, // not extractable (more secure)
  ["encrypt", "decrypt"]
);
```

---

## What We Store

### With Encryption Enabled:

| Field | What It Contains | Can We Read It? |
|-------|------------------|-----------------|
| `encrypted_data` | Your identity graph (encrypted) | ❌ No |
| `salt` | Random value for key derivation | ✅ Yes (public, safe) |
| `iv` | Initialization vector | ✅ Yes (public, safe) |
| `verification_hash` | SHA-256 of passphrase | ✅ Yes (for validation only) |

**Important:** Salt and IV are NOT secrets. They're public values needed for decryption. The security comes from your passphrase, which we never see.

### Without Encryption (Optional):

If you choose not to encrypt, we store your identity graph in plain JSON. **We recommend encryption for sensitive data.**

---

## Threat Model

### What We Protect Against:

✅ **Database breach**
- Even if our database is stolen, your data is unreadable without your passphrase

✅ **Malicious insiders**
- Our employees can't read your encrypted data

✅ **Server compromise**
- If our server is hacked, encrypted data remains safe

✅ **Man-in-the-middle attacks**
- HTTPS protects data in transit
- Even if intercepted, data is encrypted

✅ **API key theft**
- API keys only allow access to encrypted data
- Passphrase is still required to decrypt

### What We DON'T Protect Against:

❌ **Weak passphrases**
- "password123" can be brute-forced
- Use strong passphrases (12+ characters, multiple words)

❌ **Lost passphrases**
- If you forget your passphrase, your data is GONE
- We can't recover it (by design - we don't have a backdoor)

❌ **Keyloggers / Malware on your device**
- If your computer is compromised, encryption can't help
- Keep your device secure

❌ **Phishing attacks**
- Don't enter your passphrase on fake Continuum sites
- Always verify the URL

---

## Passphrase Best Practices

### Strong Passphrase Examples:

✅ **Good:**
- `correct-horse-battery-staple-42` (multiple words + number)
- `MyDog'sName!IsMax&HeIs7YearsOld` (phrase with special chars)
- `I-Love-AI-Memory-2025!` (easy to remember, hard to crack)

❌ **Bad:**
- `password123` (too common)
- `mycontinuum` (too short)
- `12345678` (all numbers)

### Passphrase Strength Meter:

Our UI shows real-time strength:
- **< 50%**: Weak (red) - won't accept
- **50-75%**: Moderate (yellow) - acceptable
- **> 75%**: Strong (green) - recommended

### Generated Passphrases:

We can generate secure passphrases for you:
```
alpha-bravo-charlie-delta-echo-foxtrot
```

- 6 random words from a 36-word list
- 36^6 = 2.2 billion combinations
- Easy to remember, hard to crack

---

## Privacy Modes

### Mode 1: Encrypted Server Storage (Recommended)

```
✅ Your data is encrypted
✅ Accessible from any device
✅ We can't read your data
⚠️  Requires trust in our server (for availability, not privacy)
```

**Use case:** Normal operation, multi-device access

### Mode 2: Local-Only Storage

```
✅ Data never leaves your browser
✅ Zero server trust required
✅ Maximum privacy
❌ Only accessible on this device
```

**Use case:** Maximum paranoia, single-device users

### Mode 3: Unencrypted Storage (Not Recommended)

```
⚠️  Data stored in plain text
✅ No passphrase needed
❌ We can read your data
❌ Less private
```

**Use case:** Non-sensitive data, testing

---

## Zero-Knowledge Proofs (Future)

We're exploring zero-knowledge proofs for advanced privacy:

### Use Case: Selective Sharing

Prove you have certain attributes without revealing them:

```typescript
// Prove you're a "Software Engineer" without revealing
// your full identity graph
const proof = generateZKProof(
  identityGraph,
  { work: { roles: ["Software Engineer"] } }
);

// Third party can verify the proof without seeing your data
verifyZKProof(proof); // Returns: true
```

**Coming soon:** Stay tuned for ZK-SNARK integration.

---

## API Security

### API Key Security:

```bash
# ❌ BAD: Exposing API keys in URLs
https://continuum.com/api/identity-graph?key=pk_live_abc123

# ✅ GOOD: Using Authorization header
Authorization: Bearer pk_live_abc123
```

**Best practices:**
- Store keys in environment variables
- Never commit keys to git
- Rotate keys regularly
- Revoke unused keys

### Rate Limiting:

- 100 requests/hour (reads)
- 50 requests/hour (writes)
- Prevents brute-force attacks on API keys

---

## Compliance & Audits

### Current Status:

- ✅ End-to-end encryption implemented
- ✅ Open source (you can audit the code)
- ⏳ Third-party security audit (planned)
- ⏳ SOC 2 compliance (future)

### GDPR Compliance:

- **Right to access:** Download your data anytime (JSON export)
- **Right to erasure:** Delete your account and all data
- **Right to portability:** Export in JSON format
- **Data minimization:** We only store what's necessary
- **Encryption at rest:** AES-256 for all sensitive data

---

## Security Features Timeline

| Feature | Status |
|---------|--------|
| AES-256 encryption | ✅ Implemented |
| PBKDF2 key derivation | ✅ Implemented |
| API key authentication | ✅ Implemented |
| Rate limiting | ✅ Implemented |
| Local-only mode | ✅ Implemented |
| Zero-knowledge proofs | 🔄 In progress |
| Hardware key support (YubiKey) | 📋 Planned |
| Multi-signature encryption | 📋 Planned |
| Biometric authentication | 📋 Planned |

---

## Reporting Security Issues

**Found a vulnerability?** We take security seriously.

**DO:**
- Email: security@your-domain.com
- Include steps to reproduce
- Wait for our response before public disclosure

**DON'T:**
- Post publicly before we've fixed it
- Attempt to access other users' data
- Use vulnerabilities for harm

**Bug Bounty:** Coming soon (we'll reward responsible disclosure)

---

## Frequently Asked Questions

### Q: Can Continuum employees read my data?

**A:** No. If you enable encryption, your data is encrypted before it reaches our servers. We only see encrypted blobs that are unreadable without your passphrase.

### Q: What if I forget my passphrase?

**A:** Your data is permanently lost. This is by design - we don't have a backdoor. Write down your passphrase and store it securely (password manager, safe, etc.).

### Q: Can the government force you to decrypt my data?

**A:** No. We don't have your passphrase. Even under a court order, we can't decrypt your data. We can only provide the encrypted blob, which is useless without your passphrase.

### Q: Is my passphrase sent to your servers?

**A:** No. Encryption happens entirely in your browser. Your passphrase never leaves your device.

### Q: What if your database is hacked?

**A:** Attackers would only get encrypted data. Without passphrases (which we don't have), the data is useless. Your identity graph remains private.

### Q: Can I trust the encryption?

**A:** Yes. We use industry-standard algorithms (AES-256, PBKDF2) via the Web Crypto API. The code is open source - you can audit it yourself.

### Q: What about quantum computers?

**A:** AES-256 is considered quantum-resistant for the foreseeable future. When quantum threats become real, we'll upgrade to post-quantum algorithms.

### Q: Do you log my API requests?

**A:** We log minimal metadata (timestamp, endpoint, user ID) for rate limiting and debugging. We don't log request bodies or responses.

### Q: Can I use Continuum offline?

**A:** Yes, with local-only mode. Your encrypted data is stored in your browser's local storage. No internet required after initial setup.

---

## Security Checklist for Users

Before you start:

- [ ] Enable end-to-end encryption
- [ ] Use a strong passphrase (12+ characters)
- [ ] Save your passphrase securely (password manager)
- [ ] Never share your passphrase
- [ ] Use HTTPS (always check for the lock icon)
- [ ] Keep your device secure (OS updates, antivirus)
- [ ] Revoke unused API keys
- [ ] Enable 2FA on your email (for account recovery)

---

## Technical Deep Dive

For developers who want to understand the implementation:

### Client-Side Encryption Flow:

```typescript
// 1. Derive encryption key from passphrase
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
  passphraseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);

// 2. Encrypt the identity graph
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  encoder.encode(JSON.stringify(identityGraph))
);

// 3. Send to server (only encrypted data, salt, iv)
await fetch("/api/identity-graph", {
  method: "POST",
  body: JSON.stringify({
    encryptedData: bufferToBase64(encrypted),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv)
  })
});
```

### Server-Side Storage:

```sql
-- Server stores only encrypted blobs
INSERT INTO identity_graphs (
  user_id,
  profile_json,        -- Encrypted data (unreadable)
  is_encrypted,        -- 1 (true)
  encryption_salt,     -- Public salt
  encryption_iv        -- Public IV
) VALUES (?, ?, 1, ?, ?);
```

### Client-Side Decryption Flow:

```typescript
// 1. Fetch encrypted data from server
const { encryptedData, salt, iv } = await fetch("/api/identity-graph")
  .then(r => r.json());

// 2. Derive the same key from passphrase
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt: base64ToBuffer(salt), ... },
  passphraseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["decrypt"]
);

// 3. Decrypt
const decrypted = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv: base64ToBuffer(iv) },
  key,
  base64ToBuffer(encryptedData)
);

// 4. Parse JSON
const identityGraph = JSON.parse(decoder.decode(decrypted));
```

---

## Conclusion

**Privacy is a core feature, not an afterthought.**

Continuum is designed from the ground up to protect your data:
- End-to-end encryption by default
- Zero-knowledge architecture (we can't read your data)
- Open source (audit our code)
- User-controlled (you own your data)

**Your identity graph is yours. We just store the encrypted version.**

Questions? Email: privacy@your-domain.com

---

Last updated: 2026-01-17
