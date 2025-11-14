# UpUp - AI-Powered Team Collaboration Platform

A Slack-like collaboration platform where humans and AI assistants work together seamlessly in channels.

## ✨ What Makes This Special

**Distinctive Design Philosophy:**
- **Warm Dark Theme**: Rich chocolate browns and warm charcoals with amber/gold accents
- **Monospace Chat Interface**: JetBrains Mono for messages (refined terminal aesthetic)
- **Serif Headings**: Crimson Pro for elegant, distinctive typography
- **Atmospheric Depth**: Gradient orbs and subtle noise texture create immersive environment
- **AI Visual Language**: Cyan/teal accents with glow effects distinguish AI from human messages

## 🏗️ Architecture

### Multi-Tenant SaaS Model
- **You (Consultant)**: Manage multiple client workspaces
- **Each Client**: Their own workspace with CompanyOS + Assistants + Channels
- **Pricing**: $199/seat/month for 150 messages

### Three-Tier Knowledge System

```
┌─────────────────────────────────────┐
│   CompanyOS (Locked Foundation)     │  ← Strategic, consultant-managed
├─────────────────────────────────────┤
│   Agent-Specific Docs (Specialized)  │  ← Domain expertise per assistant
├─────────────────────────────────────┤
│   Playbooks (Living Knowledge)       │  ← Evolves with team usage
└─────────────────────────────────────┘
```

### Context Retrieval Flow

Every AI response uses:
1. **Parallel retrieval** (~800ms):
   - CompanyOS semantic search
   - Agent-specific docs search
   - Playbooks search
   - Keyword/full-text search
   - Structured data query

2. **Reranking** (100ms): Cohere Rerank for relevance

3. **Prompt assembly**: Structured context tiers for LLM

4. **Generation** (3s): GPT-4o / Claude Sonnet / Gemini

**Target: 4 seconds total response time**

## 🎨 Design Features

### Color Palette
```css
Background: #1a1612 (deep warm charcoal)
Foreground: #e8dfd6 (warm cream)
Accent: #f4a536 (amber gold)
AI Accent: #4ecdc4 (cyan teal)
```

### Typography
- **Messages**: JetBrains Mono (monospace, technical but refined)
- **Headings**: Crimson Pro (serif, elegant)
- **System**: System fonts for UI elements

### Animations
- **Staggered message entrance**: Each message fades in with 100ms delay
- **AI glow effect**: Subtle pulsing glow on left border of AI messages
- **Smooth transitions**: 300-500ms ease curves throughout

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage)
- **Vector DB**: pgvector (built into Supabase)
- **Styling**: Tailwind CSS v3 with custom theme
- **Animations**: Framer Motion
- **Markdown**: react-markdown for AI responses
- **UI Components**: Radix UI primitives
- **Deployment**: Vercel

## 📁 Project Structure

```
upupclaude/
├── app/
│   ├── globals.css          # Custom theme + animations
│   ├── layout.tsx           # Root layout with gradient orbs
│   └── page.tsx             # Main channel interface
├── components/
│   ├── Message.tsx          # Message component (human + AI)
│   ├── Sidebar.tsx          # Channel/assistant sidebar
│   ├── ChannelHeader.tsx    # Channel info header
│   └── ChatInput.tsx        # Message input with @mentions
├── types/
│   └── index.ts             # TypeScript interfaces
└── lib/
    ├── mock-data.ts         # Demo data
    └── utils.ts             # Helper functions
```

## 🎯 Key Features

### Channel-Based Collaboration
- Create channels and invite both humans and AI assistants
- @mention assistants to trigger context-rich responses
- AI assistants can see channel conversation history (last 15 messages)

### Message Counting
- Only human→AI messages count toward 150/month limit
- Human-to-human chat is unlimited
- Clear visibility of remaining messages

### Model Selection
Each assistant can use different LLM providers:
- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-4o Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google**: Gemini 1.5 Pro, Gemini 2.0 Flash

### Conversation Memory
- First 10 turns: Full context
- After turn 10: Summarize old turns, keep recent 10 in full
- Maintains long-term coherence without token bloat

### Conflict Resolution
- Most recent knowledge wins automatically
- Recency boost in retrieval ranking
- No explicit conflict detection needed

## 🚀 Deployment to Vercel

### 1. Set Up Supabase First

Before deploying, you need a Supabase project. **See [supabase/README.md](supabase/README.md) for complete setup guide.**

Quick steps:
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Copy your project URL and API keys
4. Configure storage buckets

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Providers (add when ready)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
COHERE_API_KEY=...
```

4. Deploy!

### 3. Verify Deployment

- ✅ App loads at your-project.vercel.app
- ✅ Auth works (can sign up/sign in)
- ✅ Database queries work
- ✅ Real-time updates working

### Common Deployment Issues

**Build Error: Tailwind PostCSS**
- Fixed in this repo (using Tailwind v3.4.1)
- PostCSS configured correctly in `postcss.config.mjs`

**Environment Variables Not Found**
- Make sure all `NEXT_PUBLIC_*` vars are set
- Redeploy after adding env vars

**Supabase Connection Fails**
- Verify URL and keys are correct
- Check Supabase project is not paused

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase keys
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Design Principles

**Avoid "AI Slop" Aesthetic:**
- ❌ Generic Inter/Roboto fonts
- ❌ Purple gradients on white
- ❌ Cookie-cutter layouts
- ✅ Distinctive monospace chat interface
- ✅ Warm, rich color palette
- ✅ Thoughtful typography hierarchy
- ✅ Atmospheric depth and texture

**Motion & Delight:**
- Staggered entrance animations create sense of orchestration
- Subtle AI glow effects reinforce AI identity
- Smooth transitions (never jarring)
- High-impact moments over scattered micro-interactions

## 📊 Cost Model

Per query costs (with GPT-4o):
```
Embedding:           $0.00001
Vector search:       $0.00005
Reranking:           $0.001
LLM input (2.3k):    $0.0115
LLM output (2k):     $0.030
──────────────────────────────
Total:               $0.043/query
```

At $199/seat for 150 messages = $1.33/message revenue vs $0.043 cost = **97% gross margin**

## 🔮 Next Steps

### Immediate (Core Functionality)
- [ ] Real-time messaging (Socket.io or Supabase Realtime)
- [ ] Vector database integration (Pinecone/Weaviate)
- [ ] Context retrieval pipeline
- [ ] Multi-model LLM integration
- [ ] User authentication (Clerk/NextAuth)

### Phase 2 (Platform Features)
- [ ] CompanyOS upload & processing
- [ ] Assistant creation flow
- [ ] Playbook management
- [ ] Workspace management (multi-tenant)
- [ ] Billing integration (Stripe)
- [ ] Message limit tracking

### Phase 3 (Advanced)
- [ ] Role-based permissions
- [ ] Promotion to assistant_creator
- [ ] Analytics dashboard
- [ ] Context confidence scoring
- [ ] Thread support
- [ ] File sharing

## 🎯 Vision

This isn't just another chat tool. It's a **knowledge orchestration platform** where:
- CompanyOS provides the foundation
- Assistants are specialized knowledge interfaces
- Playbooks capture team learning
- Context retrieval is the magic that makes it all work

The interface should feel **warm, intelligent, and distinctively crafted** - not generic SaaS.

---

Built with care to avoid the "AI slop" aesthetic. Every design choice is intentional.
