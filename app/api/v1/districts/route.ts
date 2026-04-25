import { NextRequest, NextResponse } from "next/server";
// import { addRateLimitHeaders, requireApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {

  const stateId = request.nextUrl.searchParams.get("state_id");

  if (!stateId) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_STATE_ID",
          message: "Please provide state_id.",
        },
      },
      { status: 400 }
    );
  }

  const districts = await prisma.district.findMany({
    where: { stateId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      stateId: true,
    },
  });

  return NextResponse.json({
    data: districts,
    meta: {
      state_id: stateId,
      count: districts.length,
    },
  });
}