import type { Plan } from "@prisma/client";

export function getDailyRequestLimit(plan: Plan) {
  const limits: Record<Plan, number | null> = {
    FREE: 1000,
    PREMIUM: 50000,
    PRO: 500000,
    UNLIMITED: null,
  };

  return limits[plan];
}

export function formatQuota(limit: number | null) {
  return limit === null ? "Unlimited" : limit.toLocaleString("en-IN");
}
