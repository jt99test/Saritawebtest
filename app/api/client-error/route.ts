export const runtime = "nodejs";

type ClientErrorPayload = {
  message?: string;
  digest?: string;
  stack?: string;
  path?: string;
  userAgent?: string;
  locale?: string;
  timestamp?: string;
};

export async function POST(request: Request) {
  let payload: ClientErrorPayload = {};

  try {
    payload = await request.json() as ClientErrorPayload;
  } catch {
    payload = {};
  }

  console.error("Client error boundary report:", {
    message: payload.message,
    digest: payload.digest,
    stack: payload.stack,
    path: payload.path,
    userAgent: payload.userAgent,
    locale: payload.locale,
    timestamp: payload.timestamp,
  });

  return Response.json({ ok: true });
}
