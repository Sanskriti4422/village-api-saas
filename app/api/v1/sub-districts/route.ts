import { NextRequest, NextResponse } from "next/server";
import { addRateLimitHeaders, requireApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, "/api/v1/sub-districts");

  if (auth.response) {
    return auth.response;
  }

  const districtId = request.nextUrl.searchParams.get("district_id");

  if (!districtId) {
    return addRateLimitHeaders(
      NextResponse.json(
        {
          error: {
            code: "MISSING_DISTRICT_ID",
            message: "Please provide district_id.",
          },
        },
        { status: 400 }
      ),
      auth
    );
  }

  const subDistricts = await prisma.subDistrict.findMany({
    where: {
      districtId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      districtId: true,
    },
  });

  return addRateLimitHeaders(
    NextResponse.json({
      data: subDistricts,
      meta: {
        district_id: districtId,
        count: subDistricts.length,
      },
    }),
    auth
  );
}
