/**
 * Stripe Configuration for Continuum
 *
 * IMPORTANT: Before enabling Stripe:
 * 1. Create a Stripe account at https://stripe.com
 * 2. Get your API keys from https://dashboard.stripe.com/apikeys
 * 3. Add to .env.local:
 *    STRIPE_SECRET_KEY=sk_test_...
 *    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
 *    STRIPE_WEBHOOK_SECRET=whsec_... (from webhook setup)
 * 4. Create products in Stripe Dashboard matching these IDs
 */

import Stripe from "stripe";

// Initialize Stripe (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover" as any,
  typescript: true,
});

/**
 * Product and Price IDs
 * Create these products in your Stripe Dashboard first!
 */
export const STRIPE_PRODUCTS = {
  PRO_MONTHLY: {
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_xxx", // Replace with real ID
    price: 12,
    interval: "month" as const,
    name: "Pro Monthly",
  },
  PRO_ANNUAL: {
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_xxx", // Replace with real ID
    price: 99,
    interval: "year" as const,
    name: "Pro Annual",
  },
  TEAMS_MONTHLY: {
    priceId: process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || "price_xxx", // Replace with real ID
    price: 39,
    interval: "month" as const,
    name: "Teams Monthly",
  },
  TEAMS_ANNUAL: {
    priceId: process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || "price_xxx", // Replace with real ID
    price: 390,
    interval: "year" as const,
    name: "Teams Annual",
  },
} as const;

/**
 * Feature flags for each tier
 */
export const TIER_FEATURES = {
  free: {
    cloudBackup: false,
    syncDevices: false,
    browserExtension: false,
    versionHistory: false,
    apiAccess: false,
    prioritySupport: false,
    earlyAccess: false,
    teamFeatures: false,
  },
  pro: {
    cloudBackup: true,
    syncDevices: true,
    browserExtension: true,
    versionHistory: true,
    apiAccess: true,
    prioritySupport: true,
    earlyAccess: true,
    teamFeatures: false,
  },
  teams: {
    cloudBackup: true,
    syncDevices: true,
    browserExtension: true,
    versionHistory: true,
    apiAccess: true,
    prioritySupport: true,
    earlyAccess: true,
    teamFeatures: true,
  },
} as const;

/**
 * Stripe configuration options
 */
export const STRIPE_CONFIG = {
  // Success and cancel URLs (update these to your domain)
  successUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`
    : "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    : "http://localhost:3000/pricing",

  // Billing portal URL
  billingPortalUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/account/billing`
    : "http://localhost:3000/account/billing",
} as const;

/**
 * Create a checkout session
 */
export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    success_url: params.successUrl || STRIPE_CONFIG.successUrl,
    cancel_url: params.cancelUrl || STRIPE_CONFIG.cancelUrl,
    metadata: {
      userId: params.userId,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
      },
    },
  });

  return session;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: STRIPE_CONFIG.billingPortalUrl,
  });

  return session;
}

/**
 * Get subscription status for a user
 */
export async function getUserSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}
