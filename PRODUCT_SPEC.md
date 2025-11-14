# upupdnd Product Specification

## Overview

**upupdnd** is an AI-powered team collaboration platform where consultants deploy AI assistants for client companies. Think Slack, but humans and AI assistants collaborate seamlessly in the same channels.

### Core Value Proposition
- Consultants manage multiple client workspaces
- Each workspace has custom AI assistants trained on company knowledge
- Slack-like channel interface for human-AI collaboration
- Intelligent context retrieval ensures AI has relevant information for every response

---

## User Roles & Hierarchy

### Three-Tier System

1. **Consultant** (Top Level)
   - Owns the upupdnd account
   - Manages multiple client workspaces
   - Creates workspaces for each client company
   - Bills clients, pays upupdnd subscription
   - Full access to all client workspaces

2. **Admin** (Client Company Level)
   - Works at the client company
   - Can create/configure AI assistants
   - Can upload to CompanyOS knowledge base
   - Manages team members
   - Full access within their workspace

3. **Member** (Team Level)
   - Works at the client company
   - Uses AI assistants in channels
   - Cannot create assistants or upload knowledge
   - Limited to assigned channels

---

## Knowledge System Architecture

### Three-Tier Knowledge Base

#### 1. CompanyOS (Foundation Layer)
- **Purpose**: Company-wide foundational knowledge
- **Content**: Company policies, procedures, culture, org structure, product docs
- **Scope**: Available to ALL assistants in the workspace
- **Access**: Admin-only upload
- **Use Case**: "What is our vacation policy?" "How does our product work?"

#### 2. Agent-Specific Docs (Specialist Layer)
- **Purpose**: Role-specific expertise for each assistant
- **Content**: Specialized knowledge for assistant's domain
- **Scope**: Only available to the specific assistant
- **Access**: Admin configures during assistant creation
- **Use Case**: Sales assistant has CRM docs, Engineering assistant has API docs

#### 3. Playbooks (Team Knowledge Layer)
- **Purpose**: Collaborative, evolving team knowledge
- **Content**: Best practices, common solutions, tribal knowledge
- **Scope**: Shared across assistants in workspace, tied to channels/teams
- **Access**: Any team member can contribute
- **Use Case**: "How we handle customer objections" "Deploy process for staging"

---

## Context Retrieval System

### Architecture Goals
- **Target latency**: 4 seconds total (800ms search + 100ms rerank + 3s generation)
- **Cost per query**: ~$0.04
- **Approach**: Parallel searches + intelligent reranking + LLM generation

### Retrieval Flow

```
User sends message mentioning @assistant
         ↓
    [Parallel Searches - 800ms]
         ↓
    ┌────────────────────────────────┐
    │  1. CompanyOS Search           │ ← Semantic search across foundation
    │  2. Agent Docs Search          │ ← Assistant-specific knowledge
    │  3. Playbooks Search           │ ← Team knowledge relevant to channel
    └────────────────────────────────┘
         ↓
    [Combine Results]
         ↓
    [Rerank by Relevance - 100ms]
         ↓
    [Build Context Window]
    - Last 10 conversation turns (full)
    - Top reranked knowledge chunks
    - Current channel context
         ↓
    [LLM Generation - 3s]
         ↓
    Assistant responds in channel
```

### Conversation Memory Management

**Recent Conversation Context:**
- **Last 10 turns**: Full message content included
- **Turns 11+**: Summarized into brief context
- **Reset**: When topic changes significantly or user explicitly requests

**Why 10 turns?**
- Balances context window usage
- Captures immediate conversation flow
- Most conversations have topic shifts within 10-20 turns

### Conflict Resolution: Recency Wins

When knowledge sources conflict:
1. **Most recent information wins**
2. Ranking boost for newer documents
3. Timestamp-based scoring in reranker
4. CompanyOS updates override old assistant docs

**Example:**
- CompanyOS updated yesterday: "New vacation policy: unlimited PTO"
- Assistant docs from 6 months ago: "Vacation policy: 15 days/year"
- **Result**: Assistant uses unlimited PTO (recency boost)

### Search Implementation Details

**Embedding Model**: OpenAI `text-embedding-ada-002`
- Dimensions: 1536
- Cost: $0.0001 / 1K tokens
- Storage: pgvector in Supabase

**Parallel Search Strategy:**
```sql
-- Three concurrent searches
SELECT * FROM search_embeddings(
  query_embedding := $1,
  workspace_uuid := $2,
  filter_source_type := 'company_os'
) LIMIT 10;

SELECT * FROM search_embeddings(
  query_embedding := $1,
  workspace_uuid := $2,
  filter_source_type := 'agent_doc',
  filter_assistant_id := $3
) LIMIT 10;

SELECT * FROM search_embeddings(
  query_embedding := $1,
  workspace_uuid := $2,
  filter_source_type := 'playbook'
) LIMIT 10;
```

**Reranking**: Cohere Rerank API
- Cost: ~$1 per 1M tokens
- Sorts combined results by true relevance
- Considers: semantic similarity, recency, source type priority

---

## Pricing & Billing

### Subscription Model

**Price**: $199 per seat per month

**What's a seat?**
- Each human user (consultant, admin, member) = 1 seat
- AI assistants do NOT count as seats (unlimited)

**Message Limits**:
- 150 messages per seat per month
- Example: 5 seats = 750 messages/month total

### Message Counting Rules

**Messages that COUNT:**
- ✅ Human → AI (user sends message mentioning assistant)
- ✅ Only when assistant actually generates response

**Messages that DON'T count:**
- ❌ Human → Human (regular Slack-style chat)
- ❌ AI → Human (assistant responses)
- ❌ AI → AI (assistant conversations)
- ❌ System messages, notifications, etc.

**Why this model?**
- Fair: Pay for what you use (AI generation)
- Simple: Easy to understand and predict costs
- Scalable: Encourages AI usage without fear of overages

---

## AI Model Selection

### Per-Assistant Configuration

Each assistant can use a different model:

**Supported Providers:**
1. **OpenAI**: GPT-4o, GPT-4o-mini
2. **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku
3. **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash

**Configuration Options:**
- Model selection dropdown
- Temperature (0.0 - 2.0)
- Max tokens (configurable)
- System prompt (role definition)

**Use Cases:**
- **GPT-4o**: General purpose, complex reasoning
- **Claude Sonnet**: Long context, nuanced writing
- **Gemini Pro**: Multimodal, creative tasks
- **Mini/Haiku/Flash**: Fast, cost-effective for simple tasks

---

## UI/UX Design Principles

### Design Philosophy: "Magical, Not Generic"

**Avoid "AI Slop":**
- ❌ Generic gradients and blob shapes
- ❌ Overused AI terminology ("powered by AI", "intelligent", etc.)
- ❌ Predictable layouts and components
- ❌ Soulless corporate aesthetics

**Embrace Distinctive Design:**
- ✅ Warm, inviting color palette (not cold blues)
- ✅ Thoughtful typography (serif headings, mono code)
- ✅ Subtle animations that feel natural
- ✅ Unique visual language

### Color System

```css
--background: #1a1612;        /* Warm dark brown */
--foreground: #f5f1e8;        /* Warm off-white */
--accent: #f4a536;            /* Warm amber/gold */
--ai-accent: #4ecdc4;         /* Cyan for AI elements */
--border: rgba(245, 241, 232, 0.1);
```

**Design Rationale:**
- Dark background reduces eye strain
- Warm tones feel inviting (vs cold blues)
- Amber accent adds energy without aggression
- Cyan for AI creates clear visual distinction

### Typography

**Headings**: Crimson Pro (serif)
- Elegant, readable, distinctive
- Used for: Page titles, section headers, assistant names

**Body**: System font stack
- Fast loading, native feel
- Used for: Message content, UI labels

**Code/Technical**: JetBrains Mono
- Excellent for message formatting, code snippets
- Used for: Technical content, timestamps, metadata

### Component Design

**Messages:**
- Human messages: Subtle warm background, left-aligned name
- AI messages: Cyan glow border, diamond avatar, subtle pulse animation
- Clear visual distinction without being garish

**Channels:**
- Slack-like sidebar
- # prefix for channels
- Unread indicators (subtle)
- Channel descriptions on hover

**Input:**
- @mention autocomplete for assistants
- Message count remaining visible
- Send on Cmd/Ctrl+Enter
- Shift+Enter for newlines

### Animation Principles

**Purposeful Motion:**
- Entrance animations: Gentle fade + slight scale
- Loading states: Subtle pulse or rotation
- Transitions: 200-300ms for most interactions
- No gratuitous animations

**Framer Motion Usage:**
```jsx
// Subtle, purposeful
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

---

## Technical Architecture

### Stack

**Frontend:**
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS v3.4.1
- Framer Motion (animations)
- Radix UI (accessible components)

**Backend:**
- Next.js API Routes (serverless)
- Supabase (all-in-one backend)

**Database:**
- PostgreSQL (via Supabase)
- pgvector extension for embeddings
- Row Level Security (RLS) for multi-tenancy

**Authentication:**
- Supabase Auth
- Email/password (initial)
- Future: SSO, OAuth

**Storage:**
- Supabase Storage (file uploads)
- CompanyOS documents, avatars

**Real-time:**
- Supabase Realtime (WebSocket)
- Live message updates
- Typing indicators
- Presence (online/offline)

**AI/ML:**
- OpenAI API (GPT models, embeddings)
- Anthropic API (Claude models)
- Google Gemini API
- Cohere Rerank API

### Database Schema

**Core Tables:**
- `workspaces` - Client companies
- `users` - All humans (consultant, admin, member)
- `assistants` - AI assistants
- `channels` - Communication channels
- `messages` - All messages (human & AI)
- `embeddings` - Vector embeddings for knowledge
- `playbooks` - Team knowledge documents

**Multi-tenancy:**
- All tables have `workspace_id`
- RLS policies enforce workspace isolation
- Service role key bypasses RLS for setup

### Security Model

**Row Level Security (RLS):**
- Users can only access their workspace data
- Enforced at database level
- Policies check `auth.uid()` and `workspace_id`

**API Routes:**
- Authentication required for all routes
- Admin-only routes check user role
- Service role key used only for setup operations

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server-side only!
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
COHERE_API_KEY=
```

---

## Features Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] Authentication (signup, signin)
- [x] Workspace creation
- [x] User profiles
- [x] Channel structure
- [x] Basic UI/UX design
- [x] Multi-tenancy (RLS)

### 🚧 Phase 2: Core Functionality (Next)
- [ ] Real-time messaging (human-to-human)
- [ ] Message persistence
- [ ] Channel management (create, join, leave)
- [ ] User presence (online/offline)
- [ ] Basic assistant creation UI
- [ ] Simple AI responses (no context retrieval yet)

### 📋 Phase 3: AI Intelligence
- [ ] CompanyOS upload interface
- [ ] Document chunking & embedding pipeline
- [ ] Vector search implementation
- [ ] Context retrieval system
- [ ] Conversation memory
- [ ] @mention assistant triggering
- [ ] Streaming AI responses

### 📋 Phase 4: Knowledge Management
- [ ] Agent-specific docs upload
- [ ] Playbooks creation/editing
- [ ] Knowledge source management UI
- [ ] Search and discovery
- [ ] Version control for knowledge

### 📋 Phase 5: Multi-Model Support
- [ ] Model selection UI
- [ ] OpenAI integration
- [ ] Anthropic integration
- [ ] Google Gemini integration
- [ ] Cost tracking per model
- [ ] Usage analytics

### 📋 Phase 6: Advanced Features
- [ ] Message limits & billing enforcement
- [ ] Usage dashboard
- [ ] Multi-workspace for consultants
- [ ] Workspace switching
- [ ] Team management UI
- [ ] Invite system
- [ ] Permissions granularity

### 📋 Phase 7: Polish & Scale
- [ ] Onboarding flow
- [ ] Help documentation
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Keyboard shortcuts
- [ ] Search (messages, channels, knowledge)

---

## Development Guidelines

### Code Style

**TypeScript:**
- Strict mode enabled
- Explicit return types for functions
- Use `type` for objects, `interface` for extensibility
- Avoid `any` (use type assertions only when necessary)

**React:**
- Functional components only
- Server Components by default
- Client Components (`'use client'`) only when needed
- Custom hooks for shared logic

**File Organization:**
```
app/                    # Next.js App Router pages
├── api/               # API routes
├── auth/              # Auth pages
├── setup/             # Setup flow
└── page.tsx           # Main app

components/            # Reusable React components
lib/                   # Utilities, helpers
├── supabase/         # Supabase clients
└── mock-data.ts      # Dev data

types/                # TypeScript types
supabase/             # Database schema, migrations
```

### Commit Messages

Format: `<type>: <description>`

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` UI/styling changes
- `docs:` Documentation
- `chore:` Build, dependencies, config

**Examples:**
```
feat: Add real-time message updates
fix: Handle duplicate user profiles during setup
refactor: Extract context retrieval to separate service
style: Update message component with AI glow effect
```

### Testing Strategy

**Unit Tests:**
- Utility functions
- Data transformations
- Helper functions

**Integration Tests:**
- API routes
- Database operations
- Authentication flows

**E2E Tests:**
- Critical user flows
- Signup → setup → send message
- Create assistant → upload knowledge → get AI response

### Performance Targets

**Core Web Vitals:**
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

**AI Response Time:**
- Context retrieval: < 1s
- Total response: < 4s
- Streaming: Start within 500ms

**Database Queries:**
- Simple selects: < 50ms
- Vector searches: < 200ms
- Complex joins: < 500ms

---

## Open Questions / Future Decisions

1. **Assistant Creation Flow**:
   - Wizard vs single-page form?
   - Template assistants for common roles?

2. **Knowledge Upload**:
   - Supported file types (PDF, DOCX, MD, TXT)?
   - Max file size limits?
   - Chunking strategy (token count, semantic, hybrid)?

3. **Playbooks Interface**:
   - Notion-like editor?
   - Markdown-based?
   - Versioning strategy?

4. **Consultant Dashboard**:
   - How do consultants switch between client workspaces?
   - Aggregate billing across all clients?
   - Per-client analytics?

5. **Message Limits**:
   - What happens when limit reached? Hard stop or soft warning?
   - Auto-upgrade to higher tier?
   - Overage charges?

6. **Search Functionality**:
   - Full-text search for messages?
   - Semantic search for knowledge?
   - Filters (date, author, channel)?

---

## Success Metrics

### User Engagement
- Messages sent per seat per month
- Active users daily/weekly/monthly
- Assistant mentions per user
- Time saved (vs manual research)

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Churn rate
- Seats per workspace (expansion)

### Technical Metrics
- API response time (p50, p95, p99)
- Error rate
- Uptime (target: 99.9%)
- Database query performance
- AI provider costs per query

### Quality Metrics
- AI response relevance (user ratings)
- Context retrieval accuracy
- False positive @mentions
- Knowledge coverage (% queries with relevant context)

---

## Competitive Analysis

### vs Slack + ChatGPT Plugin
**Our Advantage:**
- Purpose-built for AI-human collaboration
- Custom knowledge per workspace (not just GPT training data)
- Multi-assistant support (different roles, models)
- Integrated context retrieval (not just chat history)

### vs Notion AI
**Our Advantage:**
- Real-time collaboration (not just doc editing)
- Channel-based organization
- Multiple specialized assistants
- Team communication focus

### vs Microsoft Copilot
**Our Advantage:**
- Not locked into Microsoft ecosystem
- Multi-model support (not just OpenAI)
- Consultant-friendly (multi-workspace)
- Custom knowledge architecture

---

## Brand Voice & Messaging

### Brand Personality
- **Smart but not pretentious**: We're technical but approachable
- **Confident but not arrogant**: We know we're building something great
- **Human-centric**: AI is a tool, humans are the heroes

### Messaging Guidelines

**Do:**
- "Humans and AI, working together"
- "Your team's knowledge, instantly accessible"
- "Built for teams who move fast"

**Don't:**
- "AI-powered" (overused, meaningless)
- "Revolutionary" (every startup says this)
- "Cutting-edge" (vague, dated)

### Tone
- Conversational but professional
- Technical when needed, simple by default
- Enthusiastic without hyperbole

---

## Contact & Support

**For Developers:**
- Repository: github.com/JoePa99/upupclaude
- Issues: Use GitHub Issues
- Questions: Create discussion in repo

**For Users (Future):**
- Help docs: TBD
- Email support: TBD
- In-app chat: TBD

---

*Last Updated: 2025-11-14*
*Version: 1.0*
