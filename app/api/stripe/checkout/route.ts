import { PRICE_MAP, type PriceKey, stripe } from "@/lib/stripe";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getOrigin(request: Request) {
  return request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";
}

function isPriceKey(value: unknown): value is PriceKey {
  return typeof value === "string" && value in PRICE_MAP;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { priceKey } = (await request.json()) as { priceKey?: unknown };

  if (!isPriceKey(priceKey)) {
    return new Response("Unknown price", { status: 400 });
  }

  const price = PRICE_MAP[priceKey];

  if (!price) {
    return new Response("Stripe price is not configured", { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await createServiceSupabaseClient()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const origin = getOrigin(request);
  const isLavado = priceKey === "lavado";
  const session = await stripe.checkout.sessions.create({
    mode: isLavado ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/resultado?checkout=success`,
    cancel_url: `${origin}/resultado?checkout=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      type: isLavado ? "lavado" : "subscription",
      price_key: priceKey,
    },
    subscription_data: isLavado
      ? undefined
      : {
          metadata: {
            supabase_user_id: user.id,
            price_key: priceKey,
          },
        },
  });

  return Response.json({ url: session.url });
}
