import SwissEph from "swisseph-wasm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  try {
    const se = new SwissEph();
    await se.initSwissEph();
    const jd = se.julday(2001, 10, 23, 11);
    const sun = se.calc_ut(jd, 0, 260) as Float64Array;
    return Response.json({ ok: true, sunLon: sun[0], msg: "swisseph-wasm initialized correctly" });
  } catch (err) {
    return Response.json({ ok: false, error: String(err), stack: err instanceof Error ? err.stack : undefined }, { status: 500 });
  }
}
