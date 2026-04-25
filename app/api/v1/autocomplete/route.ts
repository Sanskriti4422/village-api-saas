import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addRateLimitHeaders, requireApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";

function toPositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, "/api/v1/autocomplete");

  if (auth.response) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = toPositiveInt(searchParams.get("limit"), 10, 50);

  if (query.length < 2) {
    return addRateLimitHeaders(
      NextResponse.json({
        data: [],
        meta: {
          query,
          limit,
          message: "Please provide at least 2 characters.",
        },
      }),
      auth
    );
  }

  const villageIncludes = {
    subDistrict: {
      include: {
        district: {
          include: {
            state: true,
          },
        },
      },
    },
  };

  const nameMatches = await prisma.village.findMany({
    where: {
      name: {
        contains: query,
      },
    },
    take: limit,
    orderBy: [{ name: "asc" }],
    include: villageIncludes,
  });

  let villages = nameMatches;

  if (nameMatches.length < limit) {
    const fallbackMatches = await prisma.village.findMany({
      where: {
        id: {
          notIn: nameMatches.map((village) => village.id),
        },
        searchText: {
          contains: query,
        },
      },
      take: limit - nameMatches.length,
      orderBy: [{ name: "asc" }],
      include: villageIncludes,
    });

    villages = [...nameMatches, ...fallbackMatches];
  }

  return addRateLimitHeaders(
    NextResponse.json({
      data: villages.map((village) => ({
        id: village.id,
        name: village.name,
        display_name: village.displayName,
        village_code: village.code,
        sub_district: {
          id: village.subDistrict.id,
          name: village.subDistrict.name,
        },
        district: {
          id: village.subDistrict.district.id,
          name: village.subDistrict.district.name,
        },
        state: {
          id: village.subDistrict.district.state.id,
          name: village.subDistrict.district.state.name,
        },
        country: "India",
      })),
      meta: {
        query,
        limit,
        count: villages.length,
      },
    }),
    auth
  );
}
