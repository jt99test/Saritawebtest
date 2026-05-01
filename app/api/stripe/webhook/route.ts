import { createElement } from "react";
import Stripe from "stripe";

import CancellationEmail, { subject as cancellationSubject } from "@/emails/cancellation";
import LavadoReceiptEmail, { subject as lavadoReceiptSubject } from "@/emails/lavado-receipt";
import PaymentFailedEmail, { subject as paymentFailedSubject } from "@/emails/payment-failed";
import PlanUpgradeEmail, { subject as planUpgradeSubject } from "@/emails/plan-upgrade";
import PurchaseReceiptEmail, { subject as purchaseReceiptSubject } from "@/emails/purchase-receipt";
import RenewalReminderEmail, { subject as renewalReminderSubject } from "@/emails/renewal-reminder";
import { sendEmail } from "@/lib/email";
import { planFromPriceId, stripe, type PaidPlan } from "@/lib/stripe";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProfileEmail = {
  email: string | null;
};

type PreviousSubscriptionAttributes = {
  items?: {
    data?: Array<{
      price?: {
        id?: string | null;
      };
    }>;
  };
};

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function getSubscriptionUserId(subscription: Stripe.Subscription) {
  return subscription.metadata.supabase_user_id || null;
}

function getPlanDisplayName(plan: PaidPlan | "free" | null | undefined) {
  if (plan === "pro") {
    return "Pro";
  }

  if (plan === "avanzado") {
    return "Avanzado";
  }

  return "Gratis";
}

function formatDate(unixTimestamp: number | null | undefined) {
  if (!unixTimestamp) {
    return "fecha no disponible";
  }

  return new Date(unixTimestamp * 1000).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEurosFromCents(cents: number | null | undefined) {
  const amount = (cents ?? 0) / 100;
  return `€${amount.toFixed(2)}`;
}

function formatEurosFromDecimal(decimal: unknown) {
  const numeric = typeof decimal === "number" ? decimal : Number(decimal ?? 0);
  return `€${numeric.toFixed(2)}`;
}

function getSubscriptionAmount(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;

  if (price?.unit_amount_decimal) {
    return formatEurosFromDecimal(price.unit_amount_decimal);
  }

  return formatEurosFromCents(price?.unit_amount);
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.current_period_end ?? null;
}

function getCustomerId(customer: Stripe.Invoice["customer"]) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

function getPriceIdFromInvoice(invoice: Stripe.Invoice) {
  const price = invoice.lines.data[0]?.pricing?.price_details?.price;

  if (!price) {
    return null;
  }

  return typeof price === "string" ? price : price.id;
}

function getPlanFromInvoice(invoice: Stripe.Invoice) {
  const metadata = invoice.parent?.subscription_details?.metadata;
  const priceKey = metadata?.price_key;

  if (priceKey === "pro_monthly" || priceKey === "pro_yearly") {
    return "pro";
  }

  if (priceKey === "avanzado_monthly" || priceKey === "avanzado_yearly") {
    return "avanzado";
  }

  const priceId = getPriceIdFromInvoice(invoice);
  return priceId ? planFromPriceId(priceId)?.plan ?? null : null;
}

function getPlanRank(plan: PaidPlan | "free" | null | undefined) {
  if (plan === "avanzado") {
    return 2;
  }

  if (plan === "pro") {
    return 1;
  }

  return 0;
}

async function getProfileEmailByUserId(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle<ProfileEmail>();
  return data?.email ?? null;
}

async function getProfileEmailByCustomerId(customerId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<ProfileEmail>();
  return data?.email ?? null;
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

async function sendLavadoReceipt(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== "lavado" || !session.metadata.supabase_user_id) {
    return;
  }

  const email = await getProfileEmailByUserId(session.metadata.supabase_user_id);

  if (!email) {
    return;
  }

  await sendEmail({
    to: email,
    subject: lavadoReceiptSubject,
    react: createElement(LavadoReceiptEmail, { amount: "€49.99" }),
  });
}

async function sendPurchaseReceipt(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== "subscription" || !session.metadata.supabase_user_id) {
    return;
  }

  const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["subscription"],
  });
  const subscription =
    expandedSession.subscription && typeof expandedSession.subscription !== "string"
      ? expandedSession.subscription
      : null;
  const priceId = subscription ? getSubscriptionPriceId(subscription) : null;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const email = await getProfileEmailByUserId(session.metadata.supabase_user_id);

  if (!subscription || !plan || !email) {
    return;
  }

  const planName = getPlanDisplayName(plan.plan);
  await sendEmail({
    to: email,
    subject: purchaseReceiptSubject({ planName }),
    react: createElement(PurchaseReceiptEmail, {
      planName,
      billingPeriod: plan.billing_period,
      amount: getSubscriptionAmount(subscription),
      nextBillingDate: formatDate(getSubscriptionPeriodEnd(subscription)),
    }),
  });
}

async function sendCancellationEmail(subscription: Stripe.Subscription) {
  const userId = getSubscriptionUserId(subscription);

  if (!userId) {
    return;
  }

  const priceId = getSubscriptionPriceId(subscription);
  const plan = priceId ? planFromPriceId(priceId)?.plan ?? null : null;
  const email = await getProfileEmailByUserId(userId);

  if (!email) {
    return;
  }

  await sendEmail({
    to: email,
    subject: cancellationSubject,
    react: createElement(CancellationEmail, {
      planName: getPlanDisplayName(plan),
      accessUntil: formatDate(getSubscriptionPeriodEnd(subscription)),
    }),
  });
}

async function sendPlanUpgradeEmail(subscription: Stripe.Subscription, previousAttributes: unknown) {
  const previous = previousAttributes as PreviousSubscriptionAttributes | undefined;

  if (!previous?.items) {
    return;
  }

  const oldPriceId = previous.items.data?.[0]?.price?.id ?? null;
  const newPriceId = getSubscriptionPriceId(subscription);
  const oldPlan = oldPriceId ? planFromPriceId(oldPriceId)?.plan ?? "free" : "free";
  const newPlan = newPriceId ? planFromPriceId(newPriceId)?.plan ?? null : null;

  if (!newPlan || getPlanRank(newPlan) <= getPlanRank(oldPlan)) {
    return;
  }

  const userId = getSubscriptionUserId(subscription);
  const email = userId ? await getProfileEmailByUserId(userId) : null;

  if (!email) {
    return;
  }

  const newPlanName = getPlanDisplayName(newPlan);
  await sendEmail({
    to: email,
    subject: planUpgradeSubject({ newPlan: newPlanName }),
    react: createElement(PlanUpgradeEmail, {
      oldPlan: getPlanDisplayName(oldPlan),
      newPlan: newPlanName,
      amount: getSubscriptionAmount(subscription),
    }),
  });
}

async function sendPaymentFailedEmail(invoice: Stripe.Invoice) {
  const customerId = getCustomerId(invoice.customer);

  if (!customerId) {
    return;
  }

  const email = await getProfileEmailByCustomerId(customerId);
  const plan = getPlanFromInvoice(invoice);

  if (!email) {
    return;
  }

  await sendEmail({
    to: email,
    subject: paymentFailedSubject,
    react: createElement(PaymentFailedEmail, {
      planName: getPlanDisplayName(plan),
      amount: formatEurosFromCents(invoice.amount_due),
      retryDate: formatDate(invoice.next_payment_attempt),
    }),
  });
}

async function maybeDowngradeAfterFailedPayment(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle" || invoice.attempt_count < 3) {
    return;
  }

  const customerId = getCustomerId(invoice.customer);

  if (!customerId) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  await supabase
    .from("profiles")
    .update({ plan: "free", billing_period: null, stripe_subscription_id: null })
    .eq("stripe_customer_id", customerId);
}

async function sendRenewalReminderEmail(invoice: Stripe.Invoice) {
  const customerId = getCustomerId(invoice.customer);

  if (!customerId) {
    return;
  }

  const email = await getProfileEmailByCustomerId(customerId);
  const plan = getPlanFromInvoice(invoice);

  if (!email) {
    return;
  }

  await sendEmail({
    to: email,
    subject: renewalReminderSubject,
    react: createElement(RenewalReminderEmail, {
      planName: getPlanDisplayName(plan),
      amount: formatEurosFromCents(invoice.amount_due),
      renewalDate: formatDate(invoice.period_end),
    }),
  });
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

  if (event.type === "customer.subscription.updated") {
    await sendPlanUpgradeEmail(event.data.object, event.data.previous_attributes);
  }

  if (event.type === "customer.subscription.deleted") {
    await clearSubscriptionProfile(event.data.object);
    await sendCancellationEmail(event.data.object);
  }

  if (event.type === "checkout.session.completed") {
    await markLavadoPurchased(event.data.object);
    await sendLavadoReceipt(event.data.object);
    await sendPurchaseReceipt(event.data.object);
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    await sendPaymentFailedEmail(invoice);
    await maybeDowngradeAfterFailedPayment(invoice);
  }

  if (event.type === "invoice.upcoming") {
    const invoice = event.data.object as Stripe.Invoice;
    await sendRenewalReminderEmail(invoice);
  }

  return Response.json({ received: true });
}
