import { isPriceKey } from "@/lib/billing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWhopClient, getWhopProductForPriceKey, whopPurchaseUrl } from "@/lib/whop";

export const runtime = "nodejs";

function getOrigin(request: Request) {
  return request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";
}

async function getCurrentWhopMembershipId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("whop_membership_id")
    .eq("id", userId)
    .maybeSingle();

  return profile?.whop_membership_id ?? null;
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
    return new Response("Unknown Whop product", { status: 400 });
  }

  const whop = getWhopClient();
  const productId = getWhopProductForPriceKey(priceKey);
  const previousWhopMembershipId = priceKey === "lavado" ? null : await getCurrentWhopMembershipId(supabase, user.id);

  try {
    const product = await whop.products.retrieve(productId);
    const plans = await whop.plans.list({
      company_id: product.company.id,
      product_ids: [productId],
      first: 1,
    });
    const plan = plans.getPaginatedItems()[0];

    if (!plan) {
      return new Response("No Whop plan found for product", { status: 500 });
    }

    const origin = getOrigin(request);
    const checkoutConfiguration = await whop.checkoutConfigurations.create({
      plan_id: plan.id,
      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
        product_id: productId,
        previous_whop_membership_id: previousWhopMembershipId,
        type: priceKey === "lavado" ? "lavado" : "subscription",
        provider: "whop",
      },
      redirect_url: `${origin}/resultado?checkout=success`,
      source_url: priceKey === "lavado" ? `${origin}/yoga-astral/kriyas/lavado-intestinal` : `${origin}/precios`,
    });

    return Response.json({ url: whopPurchaseUrl(checkoutConfiguration.purchase_url) });
  } catch (error) {
    console.error("Whop checkout error", error);
    return new Response("Whop checkout is not configured correctly", { status: 500 });
  }
}
