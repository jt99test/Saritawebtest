import Stripe from "stripe";

import { planFromPriceId, stripe } from "@/lib/stripe";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function getSubscriptionUserId(subscription: Stripe.Subscription) {
  return subscription.metadata.supabase_user_id || null;
}

async function updateSubscriptionProfile(subscription: Stripe.Subscription) {
  const priceId = getSubscriptionPriceId(subscription);
  const userId = getSubscriptionUserId(subscription);
  const plan = priceId ? planFromPriceId(priceId) : null;

  if (!userId || !plan) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  await supabase
    .from("profiles")
    .update({
      plan: plan.plan,
      billing_period: plan.billing_period,
      stripe_subscription_id: subscription.id,
    })
    .eq("id", userId);
}

async function clearSubscriptionProfile(subscription: Stripe.Subscription) {
  const userId = getSubscriptionUserId(subscription);

  if (!userId) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  await supabase
    .from("profiles")
    .update({
      plan: "free",
      billing_period: null,
      stripe_subscription_id: null,
    })
    .eq("id", userId);
}

async function markLavadoPurchased(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== "lavado") {
    return;
  }

  const userId = session.metadata.supabase_user_id;

  if (!userId) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  await supabase.from("profiles").update({ lavado_purchased: true }).eq("id", userId);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return new Response(message, { status: 400 });
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    await updateSubscriptionProfile(event.data.object);
  }

  if (event.type === "customer.subscription.deleted") {
    await clearSubscriptionProfile(event.data.object);
  }

  if (event.type === "checkout.session.completed") {
    await markLavadoPurchased(event.data.object);
  }

  return Response.json({ received: true });
}
