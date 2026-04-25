import { NextRequest, NextResponse } from "next/server";
import { addRateLimitHeaders, requireApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function toPositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, "/api/v1/villages");

  if (auth.response) {
    return auth.response;
  }

  const subDistrictId = request.nextUrl.searchParams.get("sub_district_id");
  const limit = toPositiveInt(
    request.nextUrl.searchParams.get("limit"),
    100,
    500
  );

  if (!subDistrictId) {
    return addRateLimitHeaders(
      NextResponse.json(
        {
          error: {
            code: "MISSING_SUB_DISTRICT_ID",
            message: "Please provide sub_district_id.",
          },
        },
        { status: 400 }
      ),
      auth
    );
  }

  const villages = await prisma.village.findMany({
    where: {
      subDistrictId,
    },
    take: limit,
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      displayName: true,
      subDistrictId: true,
    },
  });

  return addRateLimitHeaders(
    NextResponse.json({
      data: villages,
      meta: {
        sub_district_id: subDistrictId,
        limit,
        count: villages.length,
      },
    }),
    auth
  );
}
