# Continuum - Portable AI Memory

**Your AI context, owned by you, portable everywhere.**

Continuum extracts your personal context from AI chat exports (ChatGPT, Claude, Gemini) and structures it into a portable identity graph. Use the same personalized AI experience across any model, application, or tool.

---

## 🚀 What is Continuum?

AI assistants are becoming central to how we work and think. But every time you switch from ChatGPT to Claude to Gemini, you start from zero. Your preferences, context, and history are trapped inside each vendor's silo.

**Continuum solves this.**

1. **Import** your AI chat history (ChatGPT, Claude, Gemini)
2. **Extract** your preferences, goals, skills, communication style, and context
3. **Structure** it into a portable JSON identity graph
4. **Use it everywhere** via a simple API: `GET /api/identity-graph`

Developers can integrate Continuum to instantly personalize their AI tools without storing user data.

---

## ✨ Features

### For Users
- 📤 **Import AI history** from ChatGPT, Claude, and Gemini
- 🧠 **Automatic extraction** of preferences, goals, skills, and communication style
- 📊 **Visual identity graph** showing your AI memory structure
- 🔑 **API key management** to control access to your data
- 💾 **Export formats**: JSON, plain text, and AI-specific prompts
- 🌓 **Dark mode** for comfortable viewing

### For Developers
- 🔌 **Simple REST API** to fetch user identity graphs
- 🔐 **Secure authentication** with API keys
- 📝 **Standardized schema** for cross-AI compatibility
- ⚡ **Rate limiting** built-in
- 📚 **Comprehensive docs** and integration examples
- 🎯 **No user data storage** - just fetch context on-demand

---

## 🏃 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/continuum.git
cd continuum

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=sk-...

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### First-Time Setup

1. **Upload your AI chat exports**
   - Go to the Continuum dashboard
   - Upload your ChatGPT, Claude, or Gemini chat exports
   - Wait for the identity graph to be generated

2. **Generate an API key**
   - Scroll to the "API Key Management" section
   - Enter your email address
   - Click "Generate New API Key"
   - **Save the key securely** - you won't see it again!

3. **Test your API key**
```bash
curl -X GET http://localhost:3000/api/identity-graph \
  -H "Authorization: Bearer pk_live_your_key_here"
```

---

## 📖 Documentation

- **[API Documentation](./README_API.md)** - Complete API reference
- **[Integration Examples](./examples/integration-examples.md)** - Real-world code examples
- **[Architecture](./docs/architecture.md)** - System design and schema

---

## 🔧 How It Works

### 1. Import AI Chat History

Export your conversations from:
- **ChatGPT**: Settings → Data controls → Export data
- **Claude**: Settings → Export conversations
- **Gemini**: Google Takeout → Select Gemini

Upload the ZIP or JSON files to Continuum.

### 2. AI Extraction

Continuum uses GPT-4 to analyze your conversations and extract:
- **Basic info**: Name, location, age range
- **Preferences**: Likes, dislikes, communication tone
- **Work context**: Roles, industries, current focus
- **Goals**: Short-term and long-term objectives
- **Skills**: Technical and soft skills
- **Constraints**: Time, budget, resource limitations
- **Communication style**: How you prefer to interact

### 3. Structured Identity Graph

Your context is organized into a standardized JSON schema:

```json
{
  "profile": {
    "basic": { "name": "...", "location": "..." },
    "preferences": { "likes": [...], "tone": "..." },
    "work": { "roles": [...], "current_focus": [...] },
    "goals": { "short_term": [...], "long_term": [...] },
    "skills": [...],
    "constraints": [...],
    "communication_style": [...]
  }
}
```

### 4. API Access

Developers fetch your graph via the API:

```javascript
const response = await fetch('https://your-continuum.com/api/identity-graph', {
  headers: { 'Authorization': 'Bearer pk_live_...' }
});

const { profile } = await response.json();
// Use profile to personalize AI interactions
```

---

## 🔌 API Usage

### Authentication

All API requests require a Bearer token:

```bash
Authorization: Bearer pk_live_your_key_here
```

### Get Identity Graph

```bash
GET /api/identity-graph
```

**Response:**
```json
{
  "profile": { ... },
  "version": 3,
  "updated_at": 1705334400000,
  "created_at": 1704729600000
}
```

### Update Identity Graph

```bash
POST /api/identity-graph
Content-Type: application/json

{
  "profile": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "version": 4,
  "updated_at": 1705338000000
}
```

See **[API Documentation](./README_API.md)** for full details.

---

## 🛠️ Development

### Project Structure

```
continuum/
├── app/
│   ├── api/
│   │   ├── identity-graph/   # Main API endpoint
│   │   ├── keys/              # API key management
│   │   ├── upload-files/      # File upload handler
│   │   └── chat-sandbox/      # Testing endpoint
│   ├── components/
│   │   ├── FileUploader.tsx   # Upload UI
│   │   ├── ApiKeyManager.tsx  # API key dashboard
│   │   └── IdentityNodeGraph.tsx  # Visual graph
│   └── page.tsx               # Main dashboard
├── lib/
│   ├── db/                    # Database layer (SQLite)
│   ├── api/                   # Auth & middleware
│   ├── parsers/               # ChatGPT, Claude, Gemini parsers
│   └── ingest/                # Profile extraction logic
├── examples/                  # Integration examples
└── scripts/                   # Utility scripts
```

### Running Tests

```bash
# Start the dev server
npm run dev

# In another terminal, run the API test
npx tsx scripts/test-api.ts
```

### Database

Continuum uses SQLite for simplicity. The database is stored in `data/continuum.db`.

**Schema:**
- `users` - User accounts (email-based)
- `api_keys` - API keys with secure hashing
- `identity_graphs` - JSON storage of identity graphs
- `api_usage` - Request logging for rate limiting

---

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/continuum)

**Important:** Vercel's serverless functions don't support SQLite. For production:

1. **Use a different database** (PostgreSQL, MySQL, or Supabase)
2. **Update `lib/db/index.ts`** to use your database
3. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`

### Deploy to a VPS (Recommended)

For SQLite support:

```bash
# On your server
git clone https://github.com/your-username/continuum.git
cd continuum

npm install
npm run build

# Set environment variables
export OPENAI_API_KEY=sk-...
export DATABASE_PATH=/path/to/continuum.db

# Run with PM2
pm2 start npm --name "continuum" -- start
```

---

## 🔐 Security

### For Users
- **API keys are hashed** using bcrypt before storage
- **Keys are shown only once** when generated
- **Revoke keys anytime** from the dashboard
- **Rate limiting** prevents abuse (100 req/hour for reads, 50 for writes)

### For Developers
- **Never expose API keys** in client-side code
- **Always proxy through your backend**
- **Store keys in environment variables** or secret managers
- **Rotate keys regularly**

---

## 🤝 Use Cases

### 1. Personal AI Assistant
Build a chatbot that remembers user preferences across sessions without storing their data.

### 2. Content Generation
Generate blog posts, emails, or social media content in the user's voice.

### 3. Code Review Tool
Provide personalized code reviews based on the user's expertise level.

### 4. Meeting Summarizer
Summarize meetings with action items relevant to the user's role and goals.

### 5. Custom GPT
Create a GPT that accesses the user's portable memory via API.

See **[Integration Examples](./examples/integration-examples.md)** for full code samples.

---

## 🗺️ Roadmap

- [ ] **Multi-source merging** - Combine ChatGPT + Claude + Gemini exports
- [ ] **Real-time sync** - Auto-update graphs as users chat
- [ ] **Graph versioning** - Track changes over time
- [ ] **Selective sharing** - Share only specific parts of your graph
- [ ] **OAuth integration** - "Login with Continuum" for third-party apps
- [ ] **Browser extension** - Inject your context into any AI tool
- [ ] **Mobile app** - Manage your AI memory on the go

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Contributing

Contributions are welcome! Please open an issue or submit a PR.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly: `npm run dev` + `npx tsx scripts/test-api.ts`
5. Submit a PR with a clear description

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/continuum/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/continuum/discussions)
- **Email**: support@your-domain.com

---

## 🌟 Why This Matters

As AI becomes embedded in our daily workflows, **context fragmentation** is a critical problem:

1. Users repeat themselves to every new AI tool
2. AI vendors lock in users with proprietary memory systems
3. Developers can't personalize without storing sensitive user data

**Continuum fixes this** by making AI memory **portable, user-owned, and privacy-first**.

**This is "Login with My AI Profile" for the multi-AI world.**

---

Built with ❤️ by developers frustrated with context lock-in.
