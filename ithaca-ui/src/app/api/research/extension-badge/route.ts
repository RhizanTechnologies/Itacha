import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  createApiContext,
} from "@/lib/api/api-contracts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  const context = createApiContext(request);
  const { searchParams } = new URL(request.url);
  const doi = searchParams.get("doi")?.trim();
  const title = searchParams.get("title")?.trim();

  if (!doi && !title) {
    return apiError(
      "INVALID_REQUEST",
      "Either doi or title parameter is required",
      context,
      {
        headers: CORS_HEADERS,
      },
    );
  }

  try {
    // 1. Locate paper in database by DOI or title
    let paperRecord = null;
    if (doi) {
      paperRecord = await prisma.paperRecord.findFirst({
        where: {
          doi: { equals: doi, mode: "insensitive" },
        },
      });
    }

    if (!paperRecord && title) {
      paperRecord = await prisma.paperRecord.findFirst({
        where: {
          title: { contains: title, mode: "insensitive" },
        },
      });
    }

    // 2. Resolve target IDs for citation stance lookup
    const targetIds: string[] = [];
    if (paperRecord?.openAlexId) targetIds.push(paperRecord.openAlexId);
    if (paperRecord?.id) targetIds.push(paperRecord.id);
    if (doi) targetIds.push(doi);

    let citations: { edgeType: string }[] = [];
    if (targetIds.length > 0) {
      citations = await prisma.citationCache.findMany({
        where: {
          OR: [{ citedId: { in: targetIds } }, { citingId: { in: targetIds } }],
        },
        select: { edgeType: true },
      });
    }

    // 3. Aggregate stance counts
    const supports = citations.filter((c) => c.edgeType === "supports").length;
    const contradicts = citations.filter(
      (c) => c.edgeType === "contradicts",
    ).length;
    const extendsCount = citations.filter(
      (c) => c.edgeType === "extends",
    ).length;
    const cites = citations.filter((c) => c.edgeType === "cites").length;
    const total = supports + contradicts + extendsCount + cites;

    const effectiveDoi = paperRecord?.doi ?? doi;
    const canonicalUrl = effectiveDoi
      ? `/explore?doi=${encodeURIComponent(effectiveDoi)}`
      : `/explore?q=${encodeURIComponent(title || "")}`;

    return apiSuccess(
      {
        found: Boolean(paperRecord || total > 0),
        doi: paperRecord?.doi ?? doi ?? null,
        title: paperRecord?.title ?? title ?? null,
        supports,
        contradicts,
        extends: extendsCount,
        cites,
        total,
        isSovereignIndex: paperRecord?.isSovereignIndex ?? false,
        canonicalUrl,
      },
      context,
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[research/extension-badge]", error);
    return apiError(
      "INTERNAL_ERROR",
      "Failed to resolve extension badge data",
      context,
      {
        headers: CORS_HEADERS,
      },
    );
  }
}
