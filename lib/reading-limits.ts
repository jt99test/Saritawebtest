export const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  basico: 5,
  completo: 20,
  pro: 5,
  avanzado: 20,
};

export function getPlanReadingLimit(plan: string | null | undefined) {
  return PLAN_LIMITS[plan ?? "free"] ?? PLAN_LIMITS.free;
}
