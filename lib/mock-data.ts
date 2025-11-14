import { User, Assistant, Channel, Message, Workspace } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah@acmecorp.com',
    role: 'admin',
  },
  {
    id: 'u2',
    name: 'Mike Rodriguez',
    email: 'mike@acmecorp.com',
    role: 'member',
  },
  {
    id: 'u3',
    name: 'Jennifer Park',
    email: 'jennifer@acmecorp.com',
    role: 'member',
  },
];

export const mockAssistants: Assistant[] = [
  {
    id: 'a1',
    name: 'Business Analyst',
    role: 'Financial analysis and strategic planning',
    model: {
      provider: 'anthropic',
      name: 'Claude 3.5 Sonnet',
    },
    status: 'online',
  },
  {
    id: 'a2',
    name: 'Sales Assistant',
    role: 'Sales strategy and customer engagement',
    model: {
      provider: 'openai',
      name: 'GPT-4o',
    },
    status: 'online',
  },
  {
    id: 'a3',
    name: 'Marketing Assistant',
    role: 'Brand strategy and content creation',
    model: {
      provider: 'google',
      name: 'Gemini 2.0 Flash',
    },
    status: 'online',
  },
];

export const mockChannels: Channel[] = [
  {
    id: 'c1',
    name: 'product-launch',
    description: 'Q1 2025 Product Launch Planning',
    members: [mockUsers[0], mockUsers[1], mockUsers[2]],
    assistants: [mockAssistants[0], mockAssistants[1], mockAssistants[2]],
    isPrivate: false,
    unreadCount: 3,
  },
  {
    id: 'c2',
    name: 'exec-planning',
    description: 'Executive strategic planning',
    members: [mockUsers[0]],
    assistants: [mockAssistants[0]],
    isPrivate: true,
  },
  {
    id: 'c3',
    name: 'general',
    description: 'General team discussions',
    members: mockUsers,
    assistants: [mockAssistants[0]],
    isPrivate: false,
  },
];

export const mockMessages: Message[] = [
  {
    id: 'm1',
    channelId: 'c1',
    authorId: 'u1',
    authorType: 'human',
    author: mockUsers[0],
    content:
      '@business_analyst how do we increase margins on this product launch?',
    mentions: ['a1'],
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    countsTowardLimit: true,
  },
  {
    id: 'm2',
    channelId: 'c1',
    authorId: 'a1',
    authorType: 'assistant',
    author: mockAssistants[0],
    content: `**Executive Summary**

Acme can expand gross margins from 68% to 75%+ through three lever pulls: pricing optimization (highest impact), S&M efficiency (biggest cost drain), and product mix shifts. Based on our 2025 strategy and recent experiments, prioritizing usage-based pricing could add 8 margin points with minimal risk.

**Analysis**

Our current margin structure reveals clear opportunities:

1. **Pricing Power**: According to our pricing philosophy, we "compete on value, not price." Historical data validates this—when we raised enterprise pricing 23% in 2023, we lost <5% of deals but gained 18 margin points.

2. **Cost Structure Imbalance**: We're spending 48% of ACV on S&M versus industry benchmark of 35-40%. That's our biggest margin leak.

3. **Proven Success Path**: Q4 analysis showed usage-based pricing achieved 8-point margin lift while reducing churn 3%. Customers prefer the transparency.

**Recommendations**

**Phase 1: Pricing** (90-day implementation)
→ Roll out usage-based pricing for compute-heavy features
→ Cap discounting at 10% maximum
→ Create "Premium" tier at +40% price point
→ Expected impact: +12-15 margin points, $14M EBITDA improvement

Should I model out the financial scenarios in more detail?`,
    mentions: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 13),
    countsTowardLimit: false,
  },
  {
    id: 'm3',
    channelId: 'c1',
    authorId: 'u2',
    authorType: 'human',
    author: mockUsers[1],
    content:
      "I've been giving 20-30% discounts to close deals faster. Didn't realize we were that far above benchmark on S&M costs.",
    mentions: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    countsTowardLimit: false,
  },
  {
    id: 'm4',
    channelId: 'c1',
    authorId: 'a2',
    authorType: 'assistant',
    author: mockAssistants[1],
    content: `Mike - that's valuable context. Those discounts are impacting our margin targets significantly.

According to our sales playbook and recent pricing analysis:

• **Current discount range**: 20-30% (your typical range)
• **Recommended max**: 10%
• **Margin impact**: Each 10% discount = ~7 points off gross margin

**What this means for you:**

If you close a $100k deal at 25% discount:
→ Revenue: $75k
→ Effective margin: ~43% (vs. target 68%)

Same deal at 10% discount:
→ Revenue: $90k
→ Effective margin: ~61%

**Suggestion**: Let's restructure your comp plan to reward margin, not just closed revenue. I can help you negotiate value-based pricing with prospects rather than leading with discounts.

Want to role-play a pricing conversation for your next deal?`,
    mentions: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    countsTowardLimit: false,
  },
  {
    id: 'm5',
    channelId: 'c1',
    authorId: 'u3',
    authorType: 'human',
    author: mockUsers[2],
    content:
      '@marketing_assistant should we create premium tier messaging for the launch?',
    mentions: ['a3'],
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    countsTowardLimit: true,
  },
  {
    id: 'm6',
    channelId: 'c1',
    authorId: 'a3',
    authorType: 'assistant',
    author: mockAssistants[2],
    content: `Absolutely, Jennifer. A premium tier aligns perfectly with our brand positioning.

**Premium Tier Messaging Framework:**

**Positioning**: "Enterprise-grade power for teams who can't afford downtime"

**Key differentiators**:
✦ Priority support (response SLA: <2 hours)
✦ Dedicated success manager
✦ Advanced security features (SSO, audit logs)
✦ Custom integrations
✦ 99.99% uptime SLA

**Pricing psychology**:
Instead of "$12k/year" → "Enterprise: Starting at $15k/year"
The "starting at" gives you room for expansion revenue

**Launch creative direction**:
Dark, sophisticated aesthetic. Think less "friendly SaaS" and more "mission-critical infrastructure." Similar to how Stripe positions for developers, but for enterprise buyers.

Want me to draft the landing page copy?`,
    mentions: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    countsTowardLimit: false,
  },
];

export const mockWorkspace: Workspace = {
  id: 'w1',
  name: 'Acme Corp',
  channels: mockChannels,
  users: mockUsers,
  assistants: mockAssistants,
};
