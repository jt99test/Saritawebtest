import { isAdminEmail } from "@/lib/admin";
import type { PaidPlan } from "@/lib/billing";

export type EffectivePlan = "free" | PaidPlan;

export type PlanAccessProfile = {
  plan?: string | null;
  advanced_access_until?: string | null;
};

export type PlanAccessUser = {
  email?: string | null;
  app_metadata?: unknown;
};

export function normalizePlan(plan: string | null | undefined): EffectivePlan {
  return plan === "pro" || plan === "avanzado" ? plan : "free";
}

function advancedAccessUntilFromUser(user: PlanAccessUser | string | null | undefined) {
  if (!user || typeof user === "string") return null;
  if (!user.app_metadata || typeof user.app_metadata !== "object") return null;

  const advancedAccessUntil = (user.app_metadata as Record<string, unknown>).advanced_access_until;
  return typeof advancedAccessUntil === "string"
    ? advancedAccessUntil
    : null;
}

function emailFromUser(user: PlanAccessUser | string | null | undefined) {
  return typeof user === "string" ? user : user?.email;
}

export function hasActiveAdvancedAccess(
  profile: PlanAccessProfile | null | undefined,
  user?: PlanAccessUser | string | null,
  now = new Date(),
) {
  const advancedAccessUntil = profile?.advanced_access_until ?? advancedAccessUntilFromUser(user);
  if (!advancedAccessUntil) return false;

  const expiresAt = new Date(advancedAccessUntil).getTime();
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

export function getEffectivePlan(
  profile: PlanAccessProfile | null | undefined,
  user?: PlanAccessUser | string | null,
): EffectivePlan {
  if (isAdminEmail(emailFromUser(user))) return "avanzado";
  if (hasActiveAdvancedAccess(profile, user)) return "avanzado";
  return normalizePlan(profile?.plan);
}
