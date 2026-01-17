# Continuum Monetization Guide

This document explains Continuum's business model, pricing tiers, and how to enable paid features.

## Business Model

Continuum uses a **freemium SaaS** model:
- **Free tier**: Core product (unlimited exports) to drive adoption
- **Pro tier**: $12/mo for cloud backup, sync, and advanced features
- **Teams tier**: $39/user/mo for enterprise features

## Pricing Tiers

### Free (Forever)
**Price**: $0

**Features**:
- ✅ Unlimited exports
- ✅ ChatGPT, Claude, Gemini support
- ✅ Local encryption
- ✅ Download export files
- ✅ Community support

**Limitations**:
- ❌ No cloud backup
- ❌ No sync across devices
- ❌ No browser extension
- ❌ No version history
- ❌ No API access

**Target**: Individual users trying the product

---

### Pro - $12/month or $99/year
**Price**: $12/mo or $99/yr (17% savings)

**Features**:
- ✅ Everything in Free, plus:
- ✅ ☁️ Cloud backup (encrypted)
- ✅ 🔄 Sync across devices
- ✅ 🔌 Browser extension
- ✅ 📊 Version history
- ✅ 🚀 Advanced export formats
- ✅ 🔑 API access
- ✅ ⚡ Priority support
- ✅ 🆕 Early access to new LLMs

**Target**: Power users, professionals, consultants, researchers

**Why users upgrade**:
1. "I switched laptops and lost my profile" → Cloud backup
2. "I want my memory in sync everywhere" → Auto-sync
3. "I want to integrate this into my workflow" → API access
4. "New LLM launched, want early support" → Early access

---

### Teams - $39/user/month or $390/user/year
**Price**: $39/user/mo or $390/user/yr (17% savings)

**Features**:
- ✅ Everything in Pro, plus:
- ✅ 👥 Team memory profiles
- ✅ 📊 Admin dashboard
- ✅ 🔐 SSO/SAML
- ✅ 🔧 Custom LLM integrations
- ✅ 📞 Dedicated support
- ✅ 📈 Usage analytics
- ✅ ✅ SLA guarantees
- ✅ 🎯 Custom onboarding

**Target**: Companies, sales teams, support teams, agencies

**Why companies buy**:
1. Standardize AI interactions across team
2. Maintain consistent customer context
3. Compliance and audit requirements
4. Custom integrations with internal tools

---

## Revenue Projections

### Conservative Estimates

**Year 1** (1,000 free users)
- Free: 1,000 users
- Pro: 20 users (2% conversion) @ $12/mo = $240/mo
- Teams: 1 company (5 seats) @ $39/mo = $195/mo
- **MRR**: $435/mo
- **ARR**: ~$5,200

**Year 2** (10,000 free users)
- Free: 10,000 users
- Pro: 300 users (3% conversion) @ $12/mo = $3,600/mo
- Teams: 5 companies (avg 10 seats) @ $39/mo = $1,950/mo
- **MRR**: $5,550/mo
- **ARR**: ~$66,600

**Year 3** (100,000 free users)
- Free: 100,000 users
- Pro: 3,000 users (3% conversion) @ $12/mo = $36,000/mo
- Teams: 20 companies (avg 15 seats) @ $39/mo = $11,700/mo
- **MRR**: $47,700/mo
- **ARR**: ~$572,400

### Optimistic Estimates (4% conversion, higher team adoption)

**Year 3**
- Pro: 4,000 users @ $12/mo = $48,000/mo
- Teams: 50 companies (avg 20 seats) @ $39/mo = $39,000/mo
- **MRR**: $87,000/mo
- **ARR**: ~$1.04M

---

## How to Enable Monetization

### Current Status

**Monetization is HIDDEN** by default. The pricing page and Stripe integration are built but not visible to users.

### Step 1: Enable Pricing Page

Edit `lib/featureFlags.ts`:

```typescript
export const featureFlags = {
  SHOW_PRICING: true,  // Show pricing page
  ENABLE_STRIPE: false, // Keep disabled until Stripe is set up
  // ...
}
```

Now users can visit `/pricing` to see tiers.

### Step 2: Set Up Stripe

Follow the full guide in `STRIPE_SETUP.md`:

1. Create Stripe account
2. Get API keys
3. Create products (Pro Monthly, Pro Annual, Teams Monthly, Teams Annual)
4. Set up webhooks
5. Add keys to `.env.local`

### Step 3: Enable Stripe Payments

After Stripe is configured, edit `lib/featureFlags.ts`:

```typescript
export const featureFlags = {
  SHOW_PRICING: true,
  ENABLE_STRIPE: true,  // Enable payments
  // ...
}
```

### Step 4: Test the Flow

1. Visit `http://localhost:3000/pricing`
2. Click "Start Pro Trial"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify redirect to `/success`
6. Check Stripe Dashboard for subscription

### Step 5: Add Pricing Link to Homepage

When ready to promote, add a link to the pricing page in the header:

```tsx
<a href="/pricing" className="...">
  Pricing
</a>
```

---

## Feature Gating

To restrict features to Pro users, use this pattern:

```typescript
import { TIER_FEATURES } from "@/lib/stripe/config";

function CloudBackupButton({ userTier }: { userTier: "free" | "pro" | "teams" }) {
  const hasAccess = TIER_FEATURES[userTier].cloudBackup;

  if (!hasAccess) {
    return (
      <div>
        <button disabled>Cloud Backup (Pro only)</button>
        <a href="/pricing">Upgrade to Pro</a>
      </div>
    );
  }

  return <button onClick={saveToCloud}>Save to Cloud</button>;
}
```

---

## Conversion Optimization

### Key Metrics to Track

1. **Free → Pro conversion rate** (target: 3%)
2. **Churn rate** (target: <5%/month)
3. **Lifetime value (LTV)**: ~$144 (12 months * $12)
4. **Customer acquisition cost (CAC)**: <$50 (3:1 LTV:CAC ratio)

### Conversion Tactics

**1. In-App Prompts**
Show "Upgrade to Pro" when users:
- Export for the 5th time (pattern established)
- Try to access cloud backup
- Export from a second device (need sync)

**2. Email Drip Campaign**
- Day 1: Welcome + How It Works
- Day 3: Case study (how someone uses Pro)
- Day 7: Feature highlight (cloud backup)
- Day 14: Limited-time discount (20% off first month)

**3. Social Proof**
Add testimonials to pricing page:
> "Continuum saved me hours of re-training Claude. Worth every penny." - Sarah, Product Designer

**4. Risk Reversal**
- 14-day money-back guarantee
- Free trial (first month)
- Cancel anytime

**5. Scarcity/Urgency**
- "Limited: 50% off for early adopters"
- "Only 10 Pro spots left this month"

---

## Competitor Pricing Analysis

| Product | Free Tier | Paid Tier | Our Advantage |
|---------|-----------|-----------|---------------|
| **1Password** | ❌ No free | $3/mo | We offer free tier |
| **Grammarly** | ✅ Basic | $12/mo | Same price, unique value prop |
| **Notion** | ✅ Yes | $10/mo | Comparable |
| **ChatGPT Plus** | ✅ Free | $20/mo | We're cheaper |
| **Claude Pro** | ✅ Free | $20/mo | We're cheaper |

**Positioning**: "Cheaper than ChatGPT Plus, more valuable than password managers."

---

## Pricing Psychology

### Why $12/month Works

1. **Below $15 threshold**: Impulse purchase range
2. **Comparable to competitors**: Similar to Grammarly ($12), Notion ($10)
3. **Cheaper than AI subscriptions**: Less than ChatGPT Plus ($20)
4. **Annual discount**: $99/yr = $8.25/mo (attractive savings)

### Alternative Pricing (if $12 doesn't convert)

**Option A: Lower barrier**
- Free: $0
- Starter: $5/mo (cloud backup only)
- Pro: $15/mo (all features)

**Option B: Higher value**
- Free: $0
- Pro: $19/mo (match ChatGPT Plus)
- Teams: $49/user/mo (premium positioning)

**Option C: Usage-based**
- Free: 10 exports/mo
- Pro: Unlimited exports + cloud for $9/mo

---

## Upsell Paths

### Free → Pro Triggers

1. **Milestone**: After 5 exports → "Save time with cloud sync"
2. **Pain point**: Lose device → "Never lose your memory again"
3. **New device**: Second login → "Sync across devices"
4. **API interest**: Developer asks → "Get API access with Pro"

### Pro → Teams Triggers

1. **Multiple users**: 3+ Pro users from same company → Reach out with team discount
2. **Feature request**: SSO, admin dashboard → "That's in Teams"
3. **Usage**: Heavy Pro user → "Your team might benefit"

---

## Launch Strategy

### Phase 1: Soft Launch (Month 1-2)
- Launch with Free tier only
- Get to 1,000 users
- Gather feedback
- Pricing page hidden

### Phase 2: Private Beta (Month 3)
- Enable pricing page (set `SHOW_PRICING: true`)
- Invite 50 power users to try Pro
- Offer 50% lifetime discount
- Collect testimonials

### Phase 3: Public Launch (Month 4)
- Enable Stripe (set `ENABLE_STRIPE: true`)
- Launch on Product Hunt
- Add pricing link to homepage
- Email existing users

### Phase 4: Scale (Month 5+)
- Add Teams tier
- Implement feature gating
- Build billing portal
- Add browser extension (Pro feature)

---

## Legal & Compliance

### Required Pages (create these before launch)

1. **Terms of Service** (`/terms`)
2. **Privacy Policy** (`/privacy`)
3. **Refund Policy** (14-day money-back guarantee)
4. **Acceptable Use Policy**

### Tax Compliance

- Stripe handles sales tax calculation
- You're responsible for income tax
- Consult a tax professional

### GDPR Compliance

- Users can export their data (already supported!)
- Users can delete their data
- Privacy policy explains data usage
- Cookie consent banner

---

## Support & Refunds

### Refund Policy

**14-day money-back guarantee**
- Full refund if canceled within 14 days
- No questions asked
- Process via Stripe Dashboard

### Support Channels

**Free users**:
- Community Discord
- Email support (48hr response)

**Pro users**:
- Priority email (24hr response)
- Live chat (coming soon)

**Teams**:
- Dedicated Slack channel
- Video onboarding
- Account manager

---

## Next Steps

1. ✅ Review pricing tiers (this document)
2. ⬜ Follow Stripe setup guide (`STRIPE_SETUP.md`)
3. ⬜ Enable pricing page (`SHOW_PRICING: true`)
4. ⬜ Test checkout flow with Stripe test mode
5. ⬜ Create Terms of Service and Privacy Policy
6. ⬜ Enable Stripe payments (`ENABLE_STRIPE: true`)
7. ⬜ Launch soft beta with 50 users
8. ⬜ Collect feedback and iterate
9. ⬜ Public launch!

---

**Questions?** Check `STRIPE_SETUP.md` for technical details or reach out in Discord.

Ready to make money? Let's go! 🚀💰
