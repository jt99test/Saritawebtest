import { createElement } from "react";

import LavadoReceiptEmail, { subject as lavadoReceiptSubject } from "@/emails/lavado-receipt";
import { isPriceKey } from "@/lib/billing";
import { sendEmail } from "@/lib/email";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  dateFromWhopTimestamp,
  getWhopClient,
  planFromWhopProductId,
  priceKeyFromWhopProductId,
} from "@/lib/whop";

export const runtime = "nodejs";

type WhopMetadata = {
  supabase_user_id?: unknown;
  price_key?: unknown;
  product_id?: unknown;
  type?: unknown;
};

function metadataValue(metadata: WhopMetadata | null | undefined, key: keyof WhopMetadata) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function productIdFromEventData(data: Record<string, unknown>) {
  const product = data.product;
  if (product && typeof product === "object" && "id" in product && typeof product.id === "string") {
    return product.id;
  }

  return null;
}

function membershipIdFromEventData(data: Record<string, unknown>) {
  if (typeof data.id === "string" && data.id.startsWith("mem_")) return data.id;
  const membership = data.membership;
  if (membership && typeof membership === "object" && "id" in membership && typeof membership.id === "string") {
    return membership.id;
  }

  return typeof data.membership_id === "string" ? data.membership_id : null;
}

function paymentIdFromEventData(data: Record<string, unknown>) {
  return typeof data.id === "string" && data.id.startsWith("pay_") ? data.id : null;
}

function whopUserIdFromEventData(data: Record<string, unknown>) {
  const user = data.user;
  if (user && typeof user === "object" && "id" in user && typeof user.id === "string") return user.id;
  const member = data.member;
  if (member && typeof member === "object" && "user" in member) {
    const memberUser = member.user;
    if (memberUser && typeof memberUser === "object" && "id" in memberUser && typeof memberUser.id === "string") {
      return memberUser.id;
    }
  }

  return null;
}

function priceKeyFromMetadataOrProduct(metadata: WhopMetadata | null | undefined, productId: string | null) {
  const metadataPriceKey = metadataValue(metadata, "price_key");
  if (isPriceKey(metadataPriceKey)) return metadataPriceKey;
  return priceKeyFromWhopProductId(productId);
}

function amountFromEventData(data: Record<string, unknown>) {
  const value = data.final_amount ?? data.amount ?? data.total ?? data.subtotal;
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return `EUR ${(value / 100).toFixed(2)}`;
  return "EUR 49.99";
}

async function metadataForEventData(data: Record<string, unknown>) {
  const metadata = data.metadata && typeof data.metadata === "object" ? data.metadata as WhopMetadata : null;
  if (metadataValue(metadata, "supabase_user_id")) return metadata;

  const checkoutConfigurationId = typeof data.checkout_configuration_id === "string" ? data.checkout_configuration_id : null;
  if (!checkoutConfigurationId) return metadata;

  try {
    const checkoutConfiguration = await getWhopClient().checkoutConfigurations.retrieve(checkoutConfigurationId);
    return checkoutConfiguration.metadata as WhopMetadata | null;
  } catch {
    return metadata;
  }
}

async function recordWebhookEvent(eventId: string, eventType: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("whop_webhook_events").insert({
    id: eventId,
    event_type: eventType,
  });

  return !error;
}

async function getProfileEmailByUserId(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle<{ email: string | null }>();
  return data?.email ?? null;
}

async function sendLavadoReceipt(userId: string, amount: string) {
  const email = await getProfileEmailByUserId(userId);

  if (!email) {
    return;
  }

  await sendEmail({
    to: email,
    subject: lavadoReceiptSubject,
    react: createElement(LavadoReceiptEmail, { amount }),
  });
}

async function activateProfile(eventType: string, data: Record<string, unknown>, metadata: WhopMetadata | null | undefined) {
  const userId = metadataValue(metadata, "supabase_user_id");
  const metadataProductId = metadataValue(metadata, "product_id");
  const productId = metadataProductId ?? productIdFromEventData(data);
  const priceKey = priceKeyFromMetadataOrProduct(metadata, productId);

  if (userId && priceKey === "lavado") {
    const supabase = createServiceSupabaseClient();
    await supabase.from("profiles").update({ lavado_purchased: true }).eq("id", userId);
    if (eventType === "payment.succeeded") {
      await sendLavadoReceipt(userId, amountFromEventData(data));
    }
    return;
  }

  const plan = planFromWhopProductId(productId);

  if (!userId || !plan) {
    return;
  }

  const supabase = createServiceSupabaseClient();
  await supabase
    .from("profiles")
    .update({
      plan: plan.plan,
      billing_period: plan.billing_period,
      whop_user_id: whopUserIdFromEventData(data),
      whop_product_id: productId,
      whop_membership_id: membershipIdFromEventData(data),
      whop_payment_id: paymentIdFromEventData(data),
      whop_status: typeof data.status === "string" ? data.status : "active",
      whop_current_period_end: dateFromWhopTimestamp(
        typeof data.renewal_period_end === "string" || typeof data.renewal_period_end === "number"
          ? data.renewal_period_end
          : null,
      ),
    })
    .eq("id", userId);
}

async function deactivateProfile(data: Record<string, unknown>, metadata: WhopMetadata | null | undefined) {
  const userId = metadataValue(metadata, "supabase_user_id");
  const membershipId = membershipIdFromEventData(data);
  const productId = metadataValue(metadata, "product_id") ?? productIdFromEventData(data);
  const priceKey = priceKeyFromMetadataOrProduct(metadata, productId);
  const supabase = createServiceSupabaseClient();

  if (priceKey === "lavado") {
    if (userId) {
      await supabase.from("profiles").update({ lavado_purchased: false }).eq("id", userId);
    }
    return;
  }

  const update = {
    plan: "free",
    billing_period: null,
    whop_status: typeof data.status === "string" ? data.status : "inactive",
    whop_current_period_end: null,
  };

  if (userId) {
    await supabase.from("profiles").update(update).eq("id", userId);
    return;
  }

  if (membershipId) {
    await supabase.from("profiles").update(update).eq("whop_membership_id", membershipId);
    return;
  }

  if (priceKey && productId) {
    await supabase.from("profiles").update(update).eq("whop_product_id", productId);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  let event: { id: string; type: string; data: unknown };

  try {
    event = getWhopClient().webhooks.unwrap(body, {
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const isNewEvent = await recordWebhookEvent(event.id, event.type);
  if (!isNewEvent) {
    return Response.json({ received: true, duplicate: true });
  }

  const data = event.data as Record<string, unknown>;
  const metadata = await metadataForEventData(data);

  if (event.type === "payment.succeeded" || event.type === "membership.activated") {
    await activateProfile(event.type, data, metadata);
  }

  if (event.type === "payment.failed" || event.type === "membership.deactivated" || event.type === "refund.created") {
    await deactivateProfile(data, metadata);
  }

  return Response.json({ received: true });
}
