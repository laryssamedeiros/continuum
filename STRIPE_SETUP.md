# Stripe Setup Guide for Continuum

This guide walks you through setting up Stripe payments for Continuum's Pro and Teams tiers.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to your Continuum codebase
- Basic command line knowledge

## Step 1: Create Stripe Account

1. Go to https://stripe.com and click "Start now"
2. Fill in your business details
3. Verify your email address
4. Complete your profile (can skip for testing)

## Step 2: Get API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" to see your **Secret key** (starts with `sk_test_`)
4. Add both to your `.env.local` file:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

## Step 3: Create Products in Stripe

You need to create 4 products in Stripe Dashboard:

### Product 1: Continuum Pro (Monthly)
1. Go to https://dashboard.stripe.com/products
2. Click "+ Add product"
3. Fill in:
   - **Name**: Continuum Pro (Monthly)
   - **Description**: Cloud backup, sync, and advanced features
   - **Pricing**: $12.00 USD per month (recurring)
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`)
6. Add to `.env.local`:
   ```bash
   STRIPE_PRO_MONTHLY_PRICE_ID=price_your_id_here
   ```

### Product 2: Continuum Pro (Annual)
1. Click "+ Add product"
2. Fill in:
   - **Name**: Continuum Pro (Annual)
   - **Description**: Cloud backup, sync, and advanced features (save 17%)
   - **Pricing**: $99.00 USD per year (recurring)
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env.local`:
   ```bash
   STRIPE_PRO_ANNUAL_PRICE_ID=price_your_id_here
   ```

### Product 3: Continuum Teams (Monthly)
1. Click "+ Add product"
2. Fill in:
   - **Name**: Continuum Teams (Monthly)
   - **Description**: Team features, SSO, and enterprise support
   - **Pricing**: $39.00 USD per month per user (recurring)
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env.local`:
   ```bash
   STRIPE_TEAMS_MONTHLY_PRICE_ID=price_your_id_here
   ```

### Product 4: Continuum Teams (Annual)
1. Click "+ Add product"
2. Fill in:
   - **Name**: Continuum Teams (Annual)
   - **Description**: Team features, SSO, and enterprise support (save 17%)
   - **Pricing**: $390.00 USD per year per user (recurring)
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env.local`:
   ```bash
   STRIPE_TEAMS_ANNUAL_PRICE_ID=price_your_id_here
   ```

## Step 4: Set Up Webhooks

Webhooks let Stripe notify your app about subscription changes (payments, cancellations, etc.).

### Local Development (Stripe CLI)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Production (After Deployment)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** and update your production environment variables

## Step 5: Enable Stripe in Continuum

1. Open `lib/featureFlags.ts`
2. Change these flags to `true`:
   ```typescript
   SHOW_PRICING: true,
   ENABLE_STRIPE: true,
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

4. Visit http://localhost:3000/pricing to see the pricing page!

## Step 6: Test the Integration

### Test Card Numbers

Use these card numbers for testing (they won't charge real money):

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

Use any future expiry date (e.g., 12/34) and any CVC (e.g., 123).

### Test Flow

1. Go to http://localhost:3000/pricing
2. Click "Start Pro Trial" on the Pro tier
3. Enter test card: `4242 4242 4242 4242`
4. Fill in email and billing details
5. Complete checkout
6. You should be redirected to `/success`
7. Check Stripe Dashboard → Customers to see the new subscription

## Step 7: Monitor Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. You'll see all webhook events and their status
4. If an event fails, you can see the error and retry it

## Step 8: Go Live

When you're ready for real payments:

1. Complete your Stripe account activation (verify business details)
2. Switch to **live mode** in Stripe Dashboard (toggle in top right)
3. Get your **live API keys** from https://dashboard.stripe.com/apikeys
4. Create the same 4 products in **live mode**
5. Update your production `.env` with live keys:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
6. Set up production webhook endpoint
7. Test with a real card (will charge $12 - you can refund it)

## Troubleshooting

### "No such price: price_xxx"
- Make sure you created the products in Stripe Dashboard
- Check that the Price IDs in `.env.local` match Stripe
- Restart your dev server after changing `.env.local`

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` is set in `.env.local`
- If using Stripe CLI, check it's running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- For production, verify the webhook secret matches your endpoint

### "Stripe is not enabled yet"
- Check `lib/featureFlags.ts` - set `ENABLE_STRIPE: true`
- Restart your dev server

### Webhook events not working
- For local dev: Ensure `stripe listen` is running
- Check webhook endpoint URL matches your deployment
- Verify events are selected in Stripe Dashboard
- Check your server logs for errors

## Security Best Practices

1. **Never commit API keys** - use `.env.local` (already in `.gitignore`)
2. **Use test mode** for development
3. **Verify webhook signatures** (already implemented)
4. **Use HTTPS in production** (required by Stripe)
5. **Keep Stripe SDK updated**: `npm update stripe @stripe/stripe-js`

## Next Steps

After Stripe is working:

1. Add user authentication (Clerk, Auth0, or custom)
2. Store subscriptions in database (see TODOs in webhook handler)
3. Implement feature gating based on subscription tier
4. Add billing portal for users to manage subscriptions
5. Set up email notifications for payment events

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)

## Support

If you run into issues:
1. Check the Stripe Dashboard for error messages
2. Review your webhook logs
3. Verify all environment variables are set
4. Reach out in Discord or create a GitHub issue

---

**Ready to launch?** Once Stripe is working, you can start accepting real payments! 🚀
