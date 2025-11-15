# Context Injection Strategy: Making AI Responses Brilliant

## 🎯 Core Philosophy

**Context is King.** The difference between a generic chatbot and an AI that truly understands your company is sophisticated, multi-tier context injection.

When a user asks: `@business_analyst how do we increase margins`

The AI should respond like an **insider who deeply knows the company**, not a robot citing sources.

---

## 📊 The 3-Tier Knowledge Hierarchy

### Tier 1: CompanyOS (Foundation - ALWAYS Use This)
- **Purpose**: Core strategic and brand knowledge
- **Content**: Brand guide, product strategy, pricing philosophy, company values
- **Priority**: HIGHEST - Every response must reflect these principles
- **Usage Rate Target**: >90%

### Tier 2: Agent-Specific Docs
- **Purpose**: Specialized knowledge for each AI assistant role
- **Content**: Role-specific playbooks, frameworks, methodologies
- **Priority**: MEDIUM - Ensures expertise in the agent's domain
- **Usage Rate Target**: >70%

### Tier 3: Playbooks (Team Intelligence)
- **Purpose**: Recent insights and lessons learned from real humans
- **Content**: Experiments, analyses, field intelligence from employees
- **Priority**: DYNAMIC - Fresh, actionable intel
- **Usage Rate Target**: >50%

---

## 🔄 The Context Retrieval Pipeline

### Step 1: Query Understanding (200ms)
```
User Query: "how do we increase margins"
       ↓
Query Expansion (GPT-3.5):
- "how do we increase margins"
- "improve profit margins"
- "increase profitability"
- "reduce costs increase revenue"
- "margin expansion strategies"
- "pricing optimization profit"
```

**Why?** Cast a wide semantic net - don't just match exact phrases.

### Step 2: Parallel Multi-Tier Search (~800ms)
```
5 SIMULTANEOUS SEARCHES:
├─ CompanyOS Vector Search (250ms)
├─ Agent Docs Vector Search (200ms)
├─ Playbooks Vector Search (150ms)
├─ Keyword/Full-Text Search (100ms)
└─ Structured Data Query (100ms)
```

**Why?** Speed + comprehensive coverage - no single search method is perfect.

### Step 3: Intelligent Reranking (100ms)
```
All Retrieved Chunks (15-20 total)
       ↓
Cohere Rerank API
       ↓
Top 8 Most Relevant (scored 0.96 → 0.85)
```

**Why?** Precision - ensure the most contextually relevant chunks rise to the top.

### Step 4: Hierarchical Prompt Assembly
```
SYSTEM PROMPT STRUCTURE:

# YOU ARE: [Agent Name]
[Agent description and role]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## YOUR COMPANY CONTEXT (CRITICAL)

### TIER 1: CompanyOS (Foundation)
[3 most relevant CompanyOS chunks with metadata]

### TIER 2: Your Specialized Knowledge
[2 most relevant agent doc chunks with metadata]

### TIER 3: Team-Contributed Knowledge
[2 most relevant playbook chunks with metadata]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## YOUR TASK
The user asked: "[query]"

Using the context above, provide a response that:
1. Directly answers with specific, actionable recommendations
2. References specific data points from context (numbers, examples)
3. Stays true to company strategy (CompanyOS principles)
4. Speaks naturally (e.g., "Our pricing philosophy shows...")

Begin your response:
```

**CRITICAL**: NO visible citations. NO "According to document X". The AI should sound like an insider who just **knows** this information.

---

## 🎯 What Makes Responses Brilliant (Without Citations)

### 1. Context Saturation
- References specific numbers naturally (23%, $2M, 48% vs 35-40%)
- Mentions actual people casually ("Sarah's Q4 analysis", "Mike's feedback")
- Speaks about company strategy as shared knowledge

### 2. Strategic Alignment
- Stays true to core principles ("compete on value, not price")
- Follows documented priorities (2025 margin expansion strategy)
- Respects historical evidence (2023 pricing success)

### 3. Natural Language
❌ **Don't say**: "According to the Brand Guide, page 34..."
✅ **Do say**: "Our pricing philosophy is clear: we compete on value..."

❌ **Don't say**: "Based on document X, we should..."
✅ **Do say**: "When we raised pricing 23% in 2023, we saw..."

### 4. Actionability
- Prioritized by impact
- Phased implementation
- Quantified outcomes
- Specific next steps

---

## 🔬 Technical Implementation

### Database Schema
```sql
-- Tier 1: CompanyOS
CREATE TABLE company_os_documents (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id),
  filename text,
  extracted_text text,
  status text, -- 'processing', 'ready', 'error'
  metadata jsonb
);

-- Unified embeddings table (all tiers)
CREATE TABLE embeddings (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id),
  content text,
  embedding vector(1536),
  source_type text, -- 'company_os', 'agent_doc', 'playbook'
  metadata jsonb,
  assistant_id uuid, -- NULL for company_os
  created_at timestamptz
);

-- Vector similarity search function
CREATE FUNCTION search_embeddings(
  query_embedding vector(1536),
  workspace_uuid uuid,
  match_threshold float,
  match_count int,
  filter_source_type text,
  filter_assistant_id uuid
) RETURNS TABLE(...);
```

### Context Retrieval Flow (Edge Function)
```typescript
// supabase/functions/ai-respond/index.ts

async function retrieveContext(
  supabaseClient: any,
  workspaceId: string,
  userQuery: string,
  assistantId: string
): Promise<ContextChunk[]> {

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(userQuery);

  // 2. Search CompanyOS (ALWAYS)
  const companyOSChunks = await supabaseClient.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    workspace_uuid: workspaceId,
    match_threshold: 0.7,
    match_count: 3,
    filter_source_type: 'company_os',
    filter_assistant_id: null
  });

  // 3. Search agent-specific docs
  const agentDocsChunks = await supabaseClient.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    workspace_uuid: workspaceId,
    match_threshold: 0.7,
    match_count: 2,
    filter_source_type: 'agent_doc',
    filter_assistant_id: assistantId
  });

  // 4. Search playbooks
  const playbooksChunks = await supabaseClient.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    workspace_uuid: workspaceId,
    match_threshold: 0.7,
    match_count: 2,
    filter_source_type: 'playbook',
    filter_assistant_id: assistantId
  });

  // 5. Combine and deduplicate
  return [...companyOSChunks, ...agentDocsChunks, ...playbooksChunks];
}

function buildContextualPrompt(
  baseSystemPrompt: string,
  assistantName: string,
  contextChunks: ContextChunk[]
): string {

  // Separate by tier
  const tier1 = contextChunks.filter(c => c.source_type === 'company_os');
  const tier2 = contextChunks.filter(c => c.source_type === 'agent_doc');
  const tier3 = contextChunks.filter(c => c.source_type === 'playbook');

  // Build hierarchical prompt
  return `# YOU ARE: ${assistantName}

${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## COMPANY CONTEXT (CRITICAL - USE THIS INFORMATION)

### TIER 1: CompanyOS (Foundation - Always Reference)

${tier1.map((chunk, idx) => `
**${chunk.metadata?.source || 'Company Knowledge'}** ${chunk.metadata?.page ? `(p.${chunk.metadata.page})` : ''}
${chunk.content}
`).join('\n\n')}

### TIER 2: Your Specialized Knowledge

${tier2.map((chunk, idx) => `
**${chunk.metadata?.source || 'Specialized Knowledge'}**
${chunk.content}
`).join('\n\n')}

### TIER 3: Team Intelligence

${tier3.map((chunk, idx) => `
**${chunk.metadata?.source || 'Team Insight'}** ${chunk.metadata?.added_by ? `(from ${chunk.metadata.added_by})` : ''}
${chunk.content}
`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now respond to the user's question using the context above. Reference the information
naturally (e.g., "Our strategy shows...", "Based on our Q4 analysis...") without
explicitly citing sources.`;
}
```

---

## 📈 Context Quality Metrics (For Superadmin Dashboard)

### Retrieval Performance
- **Avg Retrieval Time**: <1000ms (target)
- **Avg Chunks Retrieved**: 5-8 (sweet spot)
- **Avg Relevance Score**: >0.85 (quality threshold)

### Usage Rates
- **CompanyOS Usage**: >90% (foundation knowledge)
- **Agent Docs Usage**: >70% (specialized knowledge)
- **Playbooks Usage**: >50% (recent intel)

### Quality Indicators
- **Response Rating**: User thumbs up/down
- **Follow-Up Rate**: Lower = better first answer
- **Low Confidence Queries**: Flag for missing context
- **Missing Topics**: Gaps in knowledge base

### Dashboard View
```
┌─────────────────────────────────────────────────────────┐
│  🔒 Context Performance - Last 100 Messages            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Average response quality:  87% ████████▓░              │
│  CompanyOS usage:          94% █████████▓               │
│  Average retrieval time:    0.8s                        │
│                                                         │
│  ⚠️ Areas to Improve (2)                                │
│  • "Return policy" - Low confidence (62%)               │
│    → Add returns_policy.pdf to CompanyOS                │
│                                                         │
│  • "International shipping" - No context found          │
│    → Add shipping docs to Support Agent                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Checklist

### ✅ Database Level
- [ ] 3-tier document storage (company_os_documents, embeddings with source_type)
- [ ] pgvector with proper indexes
- [ ] search_embeddings() RPC function with filtering
- [ ] Metadata JSONB for rich context

### ✅ Retrieval Level
- [ ] Query embedding generation (OpenAI ada-002)
- [ ] Parallel multi-tier search (CompanyOS + Agent Docs + Playbooks)
- [ ] Top-k retrieval (3+2+2 = 7-8 chunks)
- [ ] Context deduplication

### ✅ Prompt Level
- [ ] Hierarchical structure (Tier 1 → Tier 2 → Tier 3)
- [ ] Natural language instructions (no "cite your sources")
- [ ] Clear instructions to weave in context naturally
- [ ] Metadata display (source, page, author)

### ✅ Response Level
- [ ] No visible citations or footnotes in UI
- [ ] Optional simple context indicator ("Used 6 sources")
- [ ] Confidence scoring (backend only)
- [ ] Quality monitoring for superadmin

---

## 💡 Key Principles to Remember

### 1. Context Over Cleverness
A well-contextualized GPT-3.5 response beats a generic GPT-4 response.

### 2. Hierarchy Matters
CompanyOS > Agent Docs > Playbooks. Always include Tier 1.

### 3. Natural Integration
The AI should sound like an insider, not a research assistant citing papers.

### 4. Measure Quality
Track retrieval time, relevance scores, and usage rates. Optimize continuously.

### 5. Superadmin Visibility
Give platform admins (joe@upupdndn.ai) deep context quality metrics.

---

## 🎯 Success Criteria

### A brilliant response:
✅ References specific company data naturally (numbers, percentages, examples)
✅ Mentions people/teams casually ("Sarah's analysis", "Mike's feedback")
✅ Aligns with documented strategy and principles
✅ Prioritizes by impact with quantified outcomes
✅ Sounds like it came from someone who deeply knows the company

### Not this:
❌ "According to document X on page Y..."
❌ Generic advice that could apply to any company
❌ Missing key context that exists in the knowledge base
❌ Contradicting established company principles

---

## 📝 Example: Context Injection in Action

**User Query**: "@business_analyst how do we increase margins"

**Retrieved Context** (behind the scenes):
- CompanyOS: Pricing philosophy, 2025 strategy, unit economics
- Agent Docs: Financial analysis framework
- Playbooks: Q4 pricing experiments, sales discount feedback

**AI Response** (what user sees):
```
**Executive Summary**
We can expand gross margins from 68% to 75%+ through pricing
optimization (highest impact), S&M efficiency (biggest cost drain),
and product mix shifts. Based on our 2025 strategy and recent
experiments, prioritizing usage-based pricing could add 8 margin
points with minimal risk.

**Analysis**
Our pricing philosophy is clear: "compete on value, not price."
When we raised enterprise pricing 23% in 2023, we lost <5% of
deals but gained 18 margin points. Sarah's Q4 experiments validate
this—87% of customers accepted a 15% increase.

Our cost structure shows the opportunity: we're spending 48% of
ACV on S&M versus industry benchmark of 35-40%. That's our biggest
margin leak...

[Continues with specific, actionable recommendations grounded in
company knowledge, speaking naturally about data as if it's
obvious shared knowledge]
```

**No citations. No "According to...". Just brilliant, contextualized advice.**

---

This is the difference between a generic chatbot and an AI that **truly knows your company**.
