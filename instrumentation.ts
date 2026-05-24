import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  const digest = typeof error === "object" && error && "digest" in error
    ? String(error.digest)
    : undefined;

  console.error("Next request error:", {
    message: normalizedError.message,
    digest,
    stack: normalizedError.stack,
    path: request.path,
    method: request.method,
    userAgent: request.headers["user-agent"],
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
  });
};
