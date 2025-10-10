# AI-Powered Features: Chatbot & Voice Agent

## 🎯 Overview

Two premium AI services to dramatically improve user experience and provide verifiable, real-time data:

1. **AI Care Navigator Chatbot** - Guides families through decision-making process
2. **Voice Agent Bed Verification** - Calls facilities to verify availability in real-time

---

## 🤖 AI Care Navigator Chatbot

### Purpose
Help overwhelmed families understand what to ask, what to check, and how to make informed decisions about care facilities.

### User Pain Points Addressed
- "I don't know what questions to ask"
- "What should I look for during a tour?"
- "Is this a red flag or normal?"
- "How do I compare costs fairly?"
- "What documents do I need?"

### Feature Design

#### 1. Always-Visible Chat Widget
```
Position: Bottom-right corner (desktop), bottom-center (mobile)
Size: Collapsed = 60px circle, Expanded = 400x600px
States: Minimized, Open, Full-screen (mobile)
```

**Visual Design:**
- Purple gradient bubble with white chat icon
- Notification badge when user idles >30 seconds
- Smooth slide-up animation
- Semi-transparent backdrop on mobile

#### 2. Conversation Flows

**Flow A: Initial Research Phase**
```
Bot: "Hi! I'm your care navigator. Are you:
     [🔍 Researching options] [📞 Ready to call] [🏥 Touring soon] [❓ Not sure where to start]"

User selects: "Not sure where to start"

Bot: "No problem! Let's figure out what you need. First, tell me:
     What's your main concern right now?
     [Medical needs] [Budget] [Location] [Urgency] [Quality/safety]"

User: "Quality and safety"

Bot: "Great! Here's what to focus on:

     ✅ CHECK THESE:
     • Inspection reports (I can pull these for you)
     • Staff-to-resident ratio
     • RN availability (24/7 vs. scheduled)
     • Complaint history

     🚩 RED FLAGS:
     • Strong odors (urine, bleach overuse)
     • Residents unattended in common areas
     • Staff unable to answer basic questions
     • Evasive about costs or policies

     📋 QUESTIONS TO ASK:
     1. 'What's your staff turnover rate?'
     2. 'Can I see your most recent inspection report?'
     3. 'What's your protocol for emergencies?'

     Would you like me to add these to a checklist you can print?"
```

**Flow B: Facility Comparison Help**
```
Bot: "I see you've added [Facility A] and [Facility B] to compare.
     Want help understanding the differences?

     [Compare now] [Add more context first]"

User: "Compare now"

Bot: "Here's what stands out:

     🏆 FACILITY A WINS:
     • 1.2 miles closer ($500/yr in gas savings)
     • 5-star rating vs. 3-star
     • RN on-site 24/7

     🏆 FACILITY B WINS:
     • $800/month cheaper
     • Private rooms available
     • Memory care specialist

     ⚖️ CONSIDERATIONS:
     • Facility B's lower cost may reflect fewer services
     • Facility A has 20% higher staff retention

     💡 RECOMMENDATION:
     Tour both, but prioritize Facility A if medical needs are complex.
     Ask Facility B why costs are lower—could be meals, activities, or care levels.

     Want me to generate tour questions specific to these two?"
```

**Flow C: Pre-Tour Preparation**
```
Bot: "Touring [Facility Name] soon?

     📋 BRING THESE:
     • List of medications
     • Insurance cards
     • Medical history summary
     • POA/healthcare proxy documents

     👀 OBSERVE:
     ✓ Residents: Are they engaged or isolated?
     ✓ Staff: Do they greet residents by name?
     ✓ Meals: Ask to see/taste a sample
     ✓ Activities: Check the calendar—is it varied?

     ❓ ASK THESE:
     1. 'Can I drop by unannounced after moving in?'
     2. 'What happens if care needs increase?'
     3. 'What's included vs. à la carte?'
     4. 'How do you handle family concerns?'

     [💾 Save as PDF] [📧 Email me this] [✅ Done]"
```

**Flow D: Red Flag Detection**
```
User: "The facility seemed nice but the director avoided my cost question"

Bot: "🚩 That's a significant red flag. Cost transparency is legally required.

     HERE'S WHY IT MATTERS:
     • Hidden fees are the #1 complaint in elder care
     • Evasiveness often indicates pricing instability
     • You deserve a detailed cost breakdown upfront

     WHAT TO DO:
     1. Email them: 'Please send itemized monthly costs'
     2. If they stall, check state licensing complaints
     3. Compare 3+ facilities to spot outliers

     Would you like me to:
     [📧 Draft that email] [🔍 Check complaints] [💰 Explain typical costs]"
```

#### 3. Contextual Triggers

**Trigger Points:**
- User views facility for >30 seconds → "Want help understanding this facility's ratings?"
- User adds 3rd facility to comparison → "Comparing 3 facilities? I can highlight what matters most"
- User clicks "Request Info" → "Before you reach out, make sure you know these 5 things..."
- User returns after 24 hours → "Welcome back! Any new questions since last time?"
- User hovers over "1-star rating" → "Low ratings often mean [common issues]. Want to know what to ask?"

#### 4. Smart Features

**Learning Mode:**
- Tracks which questions user asks most
- Suggests related resources
- Remembers user's priorities (cost vs. location vs. quality)

**Checklist Builder:**
- Generates PDF checklists from conversations
- Includes facility-specific questions
- Printable or email-able

**Document Helper:**
- "What documents do I need for Medicaid application?"
- Links to state-specific forms
- Step-by-step application guidance

**Cost Calculator:**
- "If mom lives 7 years, what's the total cost difference?"
- Factors in care level increases
- Compares private pay vs. insurance coverage

### Technical Architecture

```typescript
// Chat Component Structure
/src/components/ai-chat/
├── chat-widget.tsx           // Main widget (minimize/expand)
├── chat-window.tsx           // Conversation UI
├── message-bubble.tsx        // Individual messages
├── suggested-actions.tsx     // Quick-reply buttons
├── typing-indicator.tsx      // "AI is thinking..."
└── chat-context.tsx          // State management

// API Routes
/src/app/api/chat/
├── route.ts                  // Main chat endpoint
├── stream.ts                 // Streaming responses
├── generate-checklist.ts     // PDF generation
└── analyze-facility.ts       // Facility-specific insights

// Prompt Engineering
/src/lib/prompts/
├── system-prompt.ts          // Base AI instructions
├── flow-templates.ts         // Conversation flows
├── red-flags.ts              // Warning triggers
└── suggestions.ts            // Contextual tips
```

**AI Provider Options:**
1. **OpenAI GPT-4** - Best quality, $0.03/1K tokens (~$0.10 per conversation)
2. **Anthropic Claude** - Great for long context, ethical guardrails
3. **OpenRouter** - Flexible routing, cost optimization

**Context Window Strategy:**
```typescript
const conversationContext = {
  userIntent: "researching", // researching | comparing | touring | urgent
  facilities: selectedFacilities, // From comparison context
  priorities: ["safety", "cost"], // Derived from questions
  sessionHistory: last10Messages,
  facilityData: relevantFacilityDetails,
};

// Token management: Keep context under 4K tokens
// Full conversation history stored in database
// AI only sees summarized context + recent messages
```

### Pricing Model

**Free Tier:**
- 10 messages per session
- Basic guidance
- Checklist generation

**Premium Chat ($9.99/month or $4.99 per conversation):**
- Unlimited messages
- PDF export of full conversation
- Email follow-ups
- Priority response time
- Facility-specific deep dives

**Revenue Projection:**
- Conservative: 50 users/month × $4.99 = $249/month
- Optimistic: 200 users/month × $9.99 = $1,998/month
- Cost: ~$50-100/month in API fees (GPT-4 tokens)
- **Net margin: 75-80%**

---

## 📞 Voice Agent Bed Verification Service

### Purpose
Solve the #1 frustration: "Website says beds available, but when I call, there's a 6-month waitlist"

### How It Works

```
1. USER SELECTS FACILITIES
   User: "Verify bed availability for these 5 facilities"

2. VOICE AGENT CALLS (ASYNCHRONOUSLY)
   → Calls each facility during business hours
   → Uses natural conversation AI
   → Records and transcribes call
   → Extracts structured data

3. USER RECEIVES REPORT (15-30 MIN)
   ✅ Facility A: 2 semi-private beds, immediate (verified 2:34 PM)
   ⏳ Facility B: Waitlist, 3-4 month estimate
   ❌ Facility C: No beds, call back in 2 weeks
   📞 Facility D: No answer (will retry)

4. FOLLOW-UP ACTIONS
   → Highlights best options
   → Auto-updates database
   → Sends email/SMS summary
```

### Voice Agent Conversation Flow

```
[CALL INITIATED]

Agent: "Hi! I'm calling on behalf of a family looking for memory care placement.
        Do you have a moment to check bed availability?"

Facility: "Sure, what type of care?"

Agent: "Memory care, preferably a private room, but semi-private works too.
        What's your current availability?"

Facility: "We have one semi-private opening right now, and a private room
          opening up in about 3 weeks."

Agent: "Great! What's the typical timeline from inquiry to move-in?"

Facility: "Usually 2-3 days after the assessment. We'd need to schedule that first."

Agent: "Perfect. And is there an assessment fee?"

Facility: "No, the assessment is complimentary."

Agent: "Thank you! One last thing—what's the monthly rate for the semi-private?"

Facility: "For memory care, it's $6,800 per month, all-inclusive."

Agent: "Wonderful, I'll pass this along. Thank you so much for your time!"

[CALL ENDED - DURATION: 2:15]

EXTRACTED DATA:
✓ Beds available: 1 semi-private (now), 1 private (3 weeks)
✓ Timeline: 2-3 days post-assessment
✓ Assessment: Free
✓ Cost: $6,800/month (semi-private)
✓ Confidence: HIGH (direct confirmation)
```

### Data Extracted Per Call

```typescript
interface BedVerificationResult {
  facilityId: string;
  facilityName: string;
  callTimestamp: string;
  callDuration: number;

  status: "verified" | "no_answer" | "voicemail" | "busy" | "disconnected";

  bedAvailability: {
    immediate: number; // Count of beds now
    upcoming: { count: number; timeframe: string }[]; // "2 beds in 3 weeks"
    waitlist: boolean;
    waitlistLength?: number;
    waitlistEstimate?: string; // "3-4 months"
  };

  costs: {
    baseRate: number;
    roomType: "private" | "semi-private" | "shared";
    includedServices: string[];
    additionalFees?: string[];
  };

  moveInProcess: {
    assessmentRequired: boolean;
    assessmentFee?: number;
    timelineToMoveIn: string;
    documentsNeeded: string[];
  };

  callRecording: string; // S3 URL
  transcript: string;
  confidence: "high" | "medium" | "low"; // Based on clarity of answers

  followUpNeeded: boolean;
  notes: string; // Any special conditions mentioned
}
```

### Technical Architecture

**Voice AI Stack:**
1. **Phone System**: Twilio (programmatic calling)
2. **Voice AI**: ElevenLabs (realistic voice) + Deepgram (transcription)
3. **Conversation AI**: OpenAI GPT-4 (real-time function calling)
4. **Alternative**: Bland AI (all-in-one voice agent platform)

**Recommended: Bland AI**
- Purpose-built for phone calls
- $0.09/minute (~$0.20 per call avg)
- Built-in transcription + AI
- Handles hold music, voicemail detection, transfers
- Simple webhook integration

```typescript
// Voice Agent Implementation
/src/app/api/voice-agent/
├── initiate-calls.ts         // Start verification batch
├── webhook-handler.ts        // Receive call results
├── retry-failed.ts           // Retry no-answers
└── generate-report.ts        // Create user-facing report

// Usage:
const verification = await fetch('/api/voice-agent/initiate-calls', {
  method: 'POST',
  body: JSON.stringify({
    userId: currentUser.id,
    facilities: selectedFacilities.map(f => ({
      id: f.id,
      name: f.title,
      phone: f.contact_phone,
    })),
    priority: 'standard', // standard | urgent (urgent = immediate calling)
  })
});

// Response:
{
  jobId: 'vrfy_abc123',
  estimatedCompletion: '15-30 minutes',
  facilitiesQueued: 5,
  cost: 9.99
}
```

**Call Scheduling:**
- Respects business hours (9 AM - 5 PM facility local time)
- Retries no-answers once (30 min later)
- Leaves voicemail: "Please call back at..."
- Urgent mode: Calls immediately (premium feature)

**Quality Assurance:**
- Every call reviewed by AI for accuracy
- Low-confidence results flagged for human review
- User can listen to call recording
- Facility can opt-out (we respect their preferences)

### User Interface

**Selection Interface:**
```
[Results Page - Facility Card]

┌─────────────────────────────────────────┐
│ Sunnydale Memory Care              ⭐⭐⭐⭐⭐│
│ 📍 2.3 miles away                       │
│                                         │
│ Beds: Unknown (website may be outdated)│
│                                         │
│ [📧 Request Info] [📞 Verify Beds]     │
└─────────────────────────────────────────┘

User clicks "Verify Beds" →
Checkbox appears on card
Bottom bar shows: "Verify beds for 1 facility - $4.99"
```

**Report Interface:**
```
[Verification Report Page]

🎯 Bed Availability Report
Verified on: Jan 15, 2025 at 2:45 PM

┌────────────────────────────────────────────┐
│ ✅ AVAILABLE NOW                           │
├────────────────────────────────────────────┤
│ 1. Sunnydale Memory Care                   │
│    📍 2.3 miles away                       │
│    🛏️  2 semi-private beds available      │
│    💰 $6,800/month                         │
│    ⏱️  Move-in: 2-3 days after assessment │
│    🎧 Listen to call (2:15)                │
│    [📧 Request Info] [⭐ Save]            │
├────────────────────────────────────────────┤
│ 2. Meadowbrook Care Home                   │
│    📍 4.1 miles away                       │
│    🛏️  1 private room in 3 weeks          │
│    💰 $8,200/month                         │
│    🎧 Listen to call (3:42)                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ⏳ WAITLIST                                │
├────────────────────────────────────────────┤
│ 3. Oakridge Senior Living                  │
│    📍 3.7 miles away                       │
│    ⏳ 3-4 month waitlist                   │
│    💰 $7,500/month                         │
│    📝 Notes: Can get on priority list      │
│    🎧 Listen to call (2:58)                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ❌ NO AVAILABILITY                         │
├────────────────────────────────────────────┤
│ 4. Elmwood Care Center                     │
│    ⏳ No beds, call back in 2 weeks        │
│    🎧 Listen to call (1:22)                │
└────────────────────────────────────────────┘

🔄 COULDN'T REACH (Will retry in 30 min)
5. Riverside Manor - No answer

[📧 Email This Report] [🖨️ Print] [🔄 Verify Again ($9.99)]
```

### Pricing Model

**Per-Verification Pricing:**
- 1-2 facilities: $4.99 each
- 3-5 facilities: $14.99 total ($3/each)
- 6-10 facilities: $24.99 total ($2.50/each)
- Urgent mode (call within 1 hour): +$5

**Monthly Subscription:**
- $29.99/month: Unlimited verifications
- Best for families touring multiple facilities weekly

**Cost Structure:**
- Bland AI: $0.20 per call (avg)
- GPT-4 analysis: $0.05 per call
- Transcription storage: $0.01
- **Total cost per call: ~$0.26**
- **Margin at $4.99 pricing: ~95%**

**Revenue Projection:**
- Conservative: 30 orders/month × $14.99 avg = $450/month
- Moderate: 100 orders/month × $14.99 = $1,499/month
- Optimistic: 300 orders/month × $19.99 avg = $5,997/month
- Cost: ~$100-200/month (calls + infrastructure)
- **Net margin: 85-90%**

### Legal & Ethical Considerations

**Transparency:**
- First sentence: "I'm an AI calling on behalf of..."
- Facility can opt-out (we maintain opt-out list)
- Recordings stored securely, deleted after 90 days

**TCPA Compliance:**
- Only calling businesses (not covered by TCPA)
- Only during business hours
- Respecting do-not-call requests
- Human can take over call if needed

**Accuracy Guarantee:**
- If AI misreports data, we re-verify free
- Low-confidence calls flagged for human review
- Users can report discrepancies

**Facility Benefits:**
- Reduces repetitive calls to their staff
- More qualified leads (families know availability first)
- Helps keep their listings updated

---

## 🎨 UI/UX Integration

### Chatbot Widget Mockup

**Desktop (Bottom-right):**
```
┌────────────────────────────────────┐
│ 🤖 AI Care Navigator          [ ✕ ]│
├────────────────────────────────────┤
│                                    │
│  [BOT] Hi! I'm your care navigator.│
│       Are you:                     │
│       ┌──────────────────┐         │
│       │ 🔍 Researching   │         │
│       │ 📞 Ready to call │         │
│       │ 🏥 Touring soon  │         │
│       │ ❓ Not sure      │         │
│       └──────────────────┘         │
│                                    │
│  [YOU] Not sure where to start     │
│                                    │
│  [BOT] No problem! Let's start...  │
│                                    │
│  [Type your message...]    [Send]  │
│                                    │
│  💡 Suggested:                     │
│  • What questions should I ask?    │
│  • Compare my selected facilities  │
│  • Red flags to watch for          │
└────────────────────────────────────┘
```

**Mobile (Full-screen overlay):**
```
┌────────────────────────────────────┐
│ ← AI Care Navigator          [...]│
├────────────────────────────────────┤
│                                    │
│  [BOT] Hi! I'm your care nav...    │
│                                    │
│  [YOU] Not sure where to start     │
│                                    │
│  [BOT] Let's figure out what...    │
│                                    │
│  [Quick replies:]                  │
│  [Medical needs][Budget][Location] │
│                                    │
│                                    │
│                                    │
│                                    │
│                                    │
│                                    │
│────────────────────────────────────│
│ Type a message...          🎤 📎  │
└────────────────────────────────────┘
```

### Voice Agent Integration Points

**1. Facility Cards (Results Page):**
```diff
  <Button>📧 Request Info</Button>
  <Button>📞 Call Now</Button>
+ <Button variant="premium">🎤 Verify Beds</Button>
```

**2. Comparison Page:**
```
After comparing facilities:

"Want to verify which actually have beds available?
[🎤 Verify all 3 facilities - $14.99] [Maybe later]"
```

**3. Comparison Bar:**
```diff
  Compare (3) | Clear All
+ | [🎤 Verify Availability]
```

**4. Dedicated Verification Page:**
```
/verify-beds

Select facilities to verify:
☑ Sunnydale Memory Care ($4.99)
☑ Meadowbrook Care Home ($4.99)
☐ Oakridge Senior Living ($4.99)

Total: $9.99 (Save $5 with bundle)
[🎤 Start Verification]

What we'll check:
✓ Bed availability (immediate & upcoming)
✓ Room types & costs
✓ Move-in timeline
✓ Assessment requirements

Results in 15-30 minutes via email & SMS
```

---

## 📊 Combined Revenue Impact

### Monthly Revenue Potential

| Service | Conservative | Moderate | Optimistic |
|---------|--------------|-----------|------------|
| **AI Chatbot** | $249 | $999 | $1,998 |
| **Voice Agent** | $450 | $1,499 | $5,997 |
| **Lead Generation** | $1,500 | $3,000 | $8,000 |
| **Comparison Tool** | $200 | $500 | $999 |
| **TOTAL** | **$2,399** | **$5,998** | **$16,994** |

### Cost Structure

| Expense | Monthly Cost |
|---------|--------------|
| OpenAI API (chatbot) | $100 |
| Bland AI (voice calls) | $150 |
| Twilio (SMS/voice) | $50 |
| Hosting/infrastructure | $100 |
| **TOTAL COSTS** | **$400** |

**Net Profit: $1,999 - $16,594/month (83-97% margin)**

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (2-3 weeks)
- [ ] Build chatbot widget UI
- [ ] Integrate OpenAI GPT-4 API
- [ ] Create 5 core conversation flows
- [ ] Add chatbot to results page
- [ ] Launch free tier (10 msg limit)

### Phase 2: Voice Agent (3-4 weeks)
- [ ] Integrate Bland AI API
- [ ] Build call queue system
- [ ] Create verification report UI
- [ ] Add payment processing (Stripe)
- [ ] Test with 10 facilities

### Phase 3: Premium Features (2 weeks)
- [ ] PDF export for chat
- [ ] Call recording playback
- [ ] Email/SMS notifications
- [ ] Analytics dashboard
- [ ] A/B test pricing

### Phase 4: Scale & Optimize (Ongoing)
- [ ] Add facility opt-out system
- [ ] Human review for low-confidence calls
- [ ] Multi-language support
- [ ] Integration with CRM
- [ ] Partnership with facilities

---

## 💡 Marketing Angles

### Chatbot:
- "Talk to families who've been through this"
- "Your personal care navigator, 24/7"
- "Never forget an important question again"

### Voice Agent:
- "We call so you don't have to"
- "Real bed availability in 30 minutes"
- "Stop playing phone tag with 10 facilities"
- "Verified data you can trust"

### Combined Offering:
- "From research to move-in, we're with you"
- **Premium Plan ($49.99/month):**
  - Unlimited chatbot
  - 10 voice verifications/month
  - Priority support
  - Concierge call assistance

---

## 🎯 Success Metrics

### Chatbot KPIs:
- Conversation completion rate (target: >60%)
- Messages per session (target: 15+)
- Conversion to premium (target: 5%)
- User satisfaction (target: 4.5/5)

### Voice Agent KPIs:
- Call success rate (target: 85%+)
- Data accuracy (target: 95%+)
- Time to completion (target: <30 min)
- Repeat usage rate (target: 40%)

### Combined Impact:
- Increased time on site (target: +3 min avg)
- Higher conversion to info requests (target: +30%)
- Revenue per user (target: $15+)
- Customer LTV (target: $150+)

---

Built with ❤️ for Nonnie World
