import { NextResponse } from "next/server";

import { suggestPlaces } from "@/lib/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await suggestPlaces(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Place suggestion error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}

