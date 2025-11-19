# NEXUS OS Implementation Guide

## Overview

NEXUS OS is a "Luminous Glass" workspace that combines Slack-like chat with AI teammates and an Adaptive Canvas for rich artifacts.

## ✅ Completed Components

### 1. **Design System - Luminous Glass**
- **Background**: `#F8FAFC` with animated mesh gradient (Cyan/Coral/Purple/Yellow)
- **Glass Cards**: `bg-white/65 backdrop-blur-2xl border border-white/80 rounded-[32px]`
- **Typography**: Inter (Variable) - Headings `font-extrabold tracking-tight`, Body `font-medium`
- **Palette**:
  - Text Primary: `#232323`
  - Electric Cyan: `#56E3FF`
  - Deep Purple: `#C658FF`
  - Soft Coral: `#FF5A5F`
  - Bright Yellow: `#FFC107`

### 2. **Core Components**

#### MeshGradientBackground (`components/nexus/MeshGradientBackground.tsx`)
- Breathing gradient animation with 20s duration
- Two overlapping layers for depth
- Radial gradients positioned at strategic coordinates

#### NexusSidebar (`components/nexus/NexusSidebar.tsx`)
- Detached glass panel (80w)
- Workspace header with owner info
- Projects list with active state highlighting
- Agent Dock with pulsing online indicators
- Hover animations: `scale(1.005), translateY(-2px)`

#### OmniComposer (`components/nexus/OmniComposer.tsx`)
- Floating pill input suspended 30px from bottom
- Context-aware border color based on @mentioned agent
- Auto-complete suggestions for @mentions
- Smooth color transitions when switching context
- Send button with gradient matching current agent

#### MessageStream (`components/nexus/MessageStream.tsx`)
- Human messages: Minimal glass cards
- AI messages: Super-Glass cards with:
  - Collapsible reasoning section
  - Rich markdown content
  - Action buttons for artifacts
  - Agent-specific color theming

#### AdaptiveCanvas (`components/nexus/AdaptiveCanvas.tsx`)
- Slide-out panel (40% width) from right
- Renders structured artifacts:
  - LinkedIn Post Preview (with virality score)
  - Report Viewer
  - Chart Placeholder
  - Funnel Analysis (animated bars)
- Export and Edit actions

## 🔧 Integration Points

### Google Gemini File Search Integration

The existing `ai-respond` edge function supports Google AI. To add File Search:

```typescript
// In supabase/functions/ai-respond/index.ts

async function callGeminiWithFileSearch(
  assistant: any,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt: string,
  googleCorpusId?: string
): Promise<{ content: string; metadata?: any }> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');

  const contents = conversationHistory.map((msg, idx) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: idx === 0 ? systemPrompt + '\n\n' + msg.content : msg.content }],
  }));

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  // Add File Search tool if corpus ID is provided
  if (googleCorpusId) {
    requestBody.tools = [{
      googleSearchRetrieval: {
        corpusId: googleCorpusId,
      }
    }];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${assistant.model_name}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  return { content };
}
```

### Artifact Protocol

To enable structured outputs, modify the assistant's system prompt:

```typescript
const ARTIFACT_SYSTEM_PROMPT = `
When generating artifacts (LinkedIn posts, reports, charts), respond with JSON:

{
  "content": "Your markdown response text here...",
  "artifact": {
    "artifact_type": "linkedin_post" | "report" | "chart" | "funnel_analysis",
    "content": {
      // For linkedin_post:
      "post_body": "...",
      "hashtags": ["tag1", "tag2"],
      "virality_score": 8.5,
      "recommended_image": "chart_v2"

      // For funnel_analysis:
      "stages": [
        { "name": "Awareness", "count": 10000, "conversion_rate": 100 },
        { "name": "Interest", "count": 5000, "conversion_rate": 50 }
      ]
    }
  },
  "reasoning": "Step 1: Analyzed data\\nStep 2: Generated outline\\nStep 3: Optimized for engagement"
}
`;
```

Then parse the response:

```typescript
// In ai-respond edge function
try {
  const parsedResponse = JSON.parse(aiResponse);

  if (parsedResponse.artifact) {
    // Store artifact metadata in message
    await supabaseClient
      .from('messages')
      .insert({
        channel_id: channelId,
        author_id: assistantId,
        author_type: 'assistant',
        content: parsedResponse.content,
        metadata: parsedResponse.artifact,
        // ... other fields
      });
  }
} catch {
  // Fallback for non-JSON responses
  // Store as regular message
}
```

### File Upload Flow

```typescript
// Frontend: components/nexus/OmniComposer.tsx
const handleFileUpload = async (file: File) => {
  // 1. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('workspace_files')
    .upload(`${workspaceId}/${file.name}`, file);

  // 2. Trigger edge function to sync with Gemini
  await fetch('/api/files/sync-to-gemini', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      filePath: data.path,
    }),
  });
};
```

```typescript
// Edge Function: supabase/functions/sync-file-to-gemini/index.ts
serve(async (req) => {
  const { workspaceId, filePath } = await req.json();

  // Get file from Supabase Storage
  const { data: fileData } = await supabase.storage
    .from('workspace_files')
    .download(filePath);

  // Upload to Gemini File API
  const formData = new FormData();
  formData.append('file', fileData);

  const uploadResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/files?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const { file: geminiFile } = await uploadResponse.json();

  // Link to workspace corpus
  await fetch(
    `https://generativelanguage.googleapis.com/v1beta/corpora/${corpusId}/files/${geminiFile.name}`,
    {
      method: 'POST',
      headers: { 'X-Goog-Api-Key': GOOGLE_AI_API_KEY },
    }
  );
});
```

## 📊 Database Schema Extensions

Add to existing schema:

```sql
-- Add google_corpus_id to workspaces table
ALTER TABLE workspaces ADD COLUMN google_corpus_id TEXT;

-- Add metadata column to messages table (if not exists)
ALTER TABLE messages ADD COLUMN metadata JSONB;

-- Add color_theme to assistants table
ALTER TABLE assistants ADD COLUMN color_theme TEXT CHECK (color_theme IN ('cyan', 'purple', 'coral', 'yellow'));
```

## 🎨 CSS Utilities

The Tailwind config provides custom utilities:

```jsx
<div className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous">
  Glass card with Luminous aesthetic
</div>

<div className="animate-mesh-gradient">
  Breathing gradient background
</div>

<button className="hover:shadow-luminous-hover transition-shadow">
  Hover effect
</button>
```

## 🚀 Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   GOOGLE_AI_API_KEY=your_google_ai_key
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Deploy Supabase Edge Functions**:
   ```bash
   supabase functions deploy ai-respond
   ```

## 📝 Usage Example

```typescript
// Send a message with @mention
const handleSend = async () => {
  await onSendMessage(
    "@DataAnalyst can you create a funnel analysis for our signup flow?",
    ["assistant-id-123"]
  );
};

// The AI will respond with structured JSON:
{
  "content": "I've analyzed your signup funnel. Here's what I found...",
  "artifact": {
    "artifact_type": "funnel_analysis",
    "content": {
      "stages": [...]
    }
  },
  "reasoning": "Step 1: Queried database for signup events..."
}

// Frontend automatically renders the artifact in AdaptiveCanvas
```

## 🎯 Next Steps

1. **Add TanStack Query**: Wrap API calls with `useQuery` for caching
2. **Add Zustand Store**: Global state for canvas, workspace, etc.
3. **Enhance Animations**: Add more Framer Motion variants
4. **File Upload UI**: Drag-and-drop zone in OmniComposer
5. **Real Gemini Integration**: Update edge function with File Search
6. **Chart Rendering**: Integrate Chart.js or Recharts for visualizations
7. **LinkedIn OAuth**: Enable real post publishing

## 📚 Component API Reference

### OmniComposer Props
```typescript
interface OmniComposerProps {
  assistants: Assistant[];
  onSendMessage: (content: string, mentions: string[]) => Promise<void>;
  disabled?: boolean;
}
```

### MessageStream Props
```typescript
interface MessageStreamProps {
  messages: MessageType[];
  onArtifactOpen?: (message: MessageType) => void;
}
```

### AdaptiveCanvas Props
```typescript
interface AdaptiveCanvasProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}
```

## 🎨 Design Philosophy

NEXUS OS embodies "Post-SaaS" aesthetics:
- **Airy & Expensive**: Generous whitespace, subtle shadows
- **Joyful**: Vibrant accent colors, smooth animations
- **Functional**: Every interaction is purposeful
- **Glass Morphism**: Depth through layered transparency

The design language says: "This is a professional tool that's delightful to use."
