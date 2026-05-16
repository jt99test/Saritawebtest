import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWhopClient } from "@/lib/whop";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("whop_membership_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.whop_membership_id) {
    try {
      const membership = await getWhopClient().memberships.retrieve(profile.whop_membership_id);
      if (membership.manage_url) {
        return Response.json({ url: membership.manage_url });
      }
    } catch {
      // Fall through to Whop's account membership page.
    }
  }

  return Response.json({ url: "https://whop.com/profile/memberships" });
}
