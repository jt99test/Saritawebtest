import type { NatalChartData } from "@/lib/chart";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chart } = (await request.json()) as { chart?: NatalChartData };

  if (!chart) {
    return new Response("Missing chart", { status: 400 });
  }

  const writer = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceSupabaseClient()
    : supabase;

  const { data, error } = await writer
    .from("shared_charts")
    .insert({ chart_data: chart })
    .select("id")
    .single();

  if (error || !data?.id) {
    return new Response(error?.message ?? "Could not share chart", { status: 500 });
  }

  return Response.json({ id: data.id });
}
