import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDailyRequestLimit } from "@/lib/plans";

type SuccessfulAuth = {
  apiKey: any;
  rateLimit: {
    limit: number | null;
    remaining: number | null;
    reset: number;
  };
};

function getStartOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStartOfTomorrow() {
  const tomorrow = getStartOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

async function findApiKey(keyHash: string) {
  return prisma.apiKey.findUnique({
    where: {
      keyHash,
    },
    include: {
      user: true,
    },
  });
}

export function hashApiKey(apiKey: string) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function generateApiKey() {
  return `iv_test_${crypto.randomBytes(24).toString("hex")}`;
}

export async function requireApiKey(request: NextRequest, endpoint: string) {
  const rawApiKey =
    request.headers.get("x-api-key") ??
    request.nextUrl.searchParams.get("api_key");

  // 🔥 BYPASS: if no API key → allow request
  if (!rawApiKey) {
    return {
      apiKey: null,
      rateLimit: {
        limit: null,
        remaining: null,
        reset: Math.floor(Date.now() / 1000),
      },
    };
  }

  const keyHash = hashApiKey(rawApiKey);
  const apiKey = await findApiKey(keyHash);

  // 🔥 BYPASS: invalid key → still allow
  if (!apiKey || !apiKey.isActive) {
    return {
      apiKey: null,
      rateLimit: {
        limit: null,
        remaining: null,
        reset: Math.floor(Date.now() / 1000),
      },
    };
  }

  const startOfToday = getStartOfToday();
  const resetAt = getStartOfTomorrow();
  const reset = Math.floor(resetAt.getTime() / 1000);
  const dailyLimit = getDailyRequestLimit(apiKey.user.plan);

  const usedToday = await prisma.usageLog.count({
    where: {
      apiKeyId: apiKey.id,
      createdAt: {
        gte: startOfToday,
      },
    },
  });

  if (dailyLimit !== null && usedToday >= dailyLimit) {
    return {
      response: NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Daily request limit exceeded for your current plan.",
          },
        },
        {
          status: 429,
        }
      ),
    };
  }

  await prisma.$transaction([
    prisma.apiKey.update({
      where: {
        id: apiKey.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    }),
    prisma.usageLog.create({
      data: {
        apiKeyId: apiKey.id,
        endpoint,
        status: 200,
      },
    }),
  ]);

  return {
    apiKey,
    rateLimit: {
      limit: dailyLimit,
      remaining:
        dailyLimit === null ? null : Math.max(dailyLimit - usedToday - 1, 0),
      reset,
    },
  };
}

export function addRateLimitHeaders(response: NextResponse, auth: any) {
  // 🔥 SAFE GUARD (avoid crash if auth missing)
  if (!auth || !auth.rateLimit) return response;

  response.headers.set(
    "x-ratelimit-limit",
    auth.rateLimit.limit === null
      ? "unlimited"
      : String(auth.rateLimit.limit)
  );
  response.headers.set(
    "x-ratelimit-remaining",
    auth.rateLimit.remaining === null
      ? "unlimited"
      : String(auth.rateLimit.remaining)
  );
  response.headers.set(
    "x-ratelimit-reset",
    String(auth.rateLimit.reset)
  );

  return response;
}