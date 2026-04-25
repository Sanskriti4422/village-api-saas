import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addRateLimitHeaders, requireApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, "/api/v1/states");

  if (auth.response) {
    return auth.response;
  }

  const states = await prisma.state.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return addRateLimitHeaders(
    NextResponse.json({
      data: states,
      meta: {
        count: states.length,
      },
    }),
    auth
  );
}
