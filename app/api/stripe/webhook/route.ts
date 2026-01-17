import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events
 *
 * IMPORTANT: Set up webhook in Stripe Dashboard:
 * 1. Go to https://dashboard.stripe.com/webhooks
 * 2. Add endpoint: https://yourdomain.com/api/stripe/webhook
 * 3. Select events to listen for (see below)
 * 4. Copy webhook secret to .env.local as STRIPE_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout completed:", session.id);

  const userId = session.client_reference_id || session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error("No userId found in checkout session");
    return;
  }

  // TODO: Update user in database
  // Example:
  // await db.users.update({
  //   where: { id: userId },
  //   data: {
  //     stripeCustomerId: customerId,
  //     stripeSubscriptionId: subscriptionId,
  //     tier: 'pro',
  //     subscriptionStatus: 'active',
  //   },
  // });

  console.log(`User ${userId} upgraded to Pro`);

  // TODO: Send welcome email
  // await sendEmail({
  //   to: session.customer_email,
  //   subject: "Welcome to Continuum Pro!",
  //   template: "welcome-pro",
  // });
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);

  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    console.error("No userId found in subscription");
    return;
  }

  // TODO: Update user subscription status in database
  console.log(`Subscription ${subscription.id} created for user ${userId}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  const userId = subscription.metadata?.userId;
  const status = subscription.status;

  if (!userId) {
    console.error("No userId found in subscription");
    return;
  }

  // TODO: Update user subscription status in database
  // Handle status changes: active, past_due, canceled, etc.
  console.log(`Subscription ${subscription.id} status: ${status}`);
}

/**
 * Handle subscription deleted (canceled)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("No userId found in subscription");
    return;
  }

  // TODO: Downgrade user to free tier
  // await db.users.update({
  //   where: { id: userId },
  //   data: {
  //     tier: 'free',
  //     subscriptionStatus: 'canceled',
  //   },
  // });

  console.log(`User ${userId} downgraded to Free`);

  // TODO: Send cancellation email
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Payment succeeded:", invoice.id);

  const subscriptionId = (invoice as any).subscription as string;
  const customerId = (invoice as any).customer as string;

  // TODO: Log payment in database
  console.log(`Payment received for subscription ${subscriptionId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Payment failed:", invoice.id);

  const subscriptionId = (invoice as any).subscription as string;
  const customerId = (invoice as any).customer as string;

  // TODO: Send payment failed email
  // TODO: Update subscription status
  console.log(`Payment failed for subscription ${subscriptionId}`);
}
