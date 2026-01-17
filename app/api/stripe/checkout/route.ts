import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, STRIPE_PRODUCTS } from "@/lib/stripe/config";
import { featureFlags } from "@/lib/featureFlags";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe checkout session for Pro or Teams subscription
 */
export async function POST(req: NextRequest) {
  // Check if Stripe is enabled
  if (!featureFlags.ENABLE_STRIPE) {
    return NextResponse.json(
      { error: "Stripe is not enabled yet. Coming soon!" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { tier, billingPeriod, userId, userEmail } = body;

    // Validate inputs
    if (!tier || !billingPeriod || !userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: tier, billingPeriod, userId, userEmail" },
        { status: 400 }
      );
    }

    // Get the correct price ID
    let priceId: string;
    if (tier === "pro" && billingPeriod === "monthly") {
      priceId = STRIPE_PRODUCTS.PRO_MONTHLY.priceId;
    } else if (tier === "pro" && billingPeriod === "annual") {
      priceId = STRIPE_PRODUCTS.PRO_ANNUAL.priceId;
    } else if (tier === "teams" && billingPeriod === "monthly") {
      priceId = STRIPE_PRODUCTS.TEAMS_MONTHLY.priceId;
    } else if (tier === "teams" && billingPeriod === "annual") {
      priceId = STRIPE_PRODUCTS.TEAMS_ANNUAL.priceId;
    } else {
      return NextResponse.json(
        { error: "Invalid tier or billing period" },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await createCheckoutSession({
      priceId,
      userId,
      userEmail,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/checkout?tier=pro
 *
 * Simplified endpoint for direct links (e.g., from pricing page)
 */
export async function GET(req: NextRequest) {
  // Check if Stripe is enabled
  if (!featureFlags.ENABLE_STRIPE) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  const searchParams = req.nextUrl.searchParams;
  const tier = searchParams.get("tier") || "pro";
  const billingPeriod = searchParams.get("period") || "monthly";

  // For now, redirect to a sign-up page where user can create account first
  // Later, you'll integrate with your auth system
  return NextResponse.json(
    {
      message: "Please create an account first, then upgrade to Pro",
      redirectUrl: "/signup?plan=" + tier,
    },
    { status: 200 }
  );
}
