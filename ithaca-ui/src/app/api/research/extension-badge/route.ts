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
    // 1. Locate paper in database by DOI, arXiv ID, or title
    const arxivMatch = doi ? doi.match(/([0-9]{4}\.[0-9]{4,5})/i) : null;
    const arxivId = arxivMatch ? arxivMatch[1] : null;

    const paperRecords = await prisma.paperRecord.findMany({
      where: {
        OR: [
          ...(doi
            ? [{ doi: { equals: doi, mode: "insensitive" as const } }]
            : []),
          ...(arxivId
            ? [{ doi: { contains: arxivId, mode: "insensitive" as const } }]
            : []),
          ...(title
            ? [{ title: { contains: title, mode: "insensitive" as const } }]
            : []),
        ],
      },
    });

    const paperRecord =
      paperRecords.find((r) => Boolean(r.openAlexId)) ??
      paperRecords[0] ??
      null;

    // 2. Resolve target IDs for citation stance lookup
    const targetIdsSet = new Set<string>();
    if (doi) {
      targetIdsSet.add(doi);
      targetIdsSet.add(doi.toLowerCase());
    }
    if (arxivId) {
      targetIdsSet.add(arxivId);
      targetIdsSet.add(`arXiv.${arxivId}`);
      targetIdsSet.add(`10.48550/arXiv.${arxivId}`);
      targetIdsSet.add(`10.48550/arxiv.${arxivId}`);
    }
    for (const rec of paperRecords) {
      if (rec.id) targetIdsSet.add(rec.id);
      if (rec.openAlexId) targetIdsSet.add(rec.openAlexId);
      if (rec.doi) {
        targetIdsSet.add(rec.doi);
        targetIdsSet.add(rec.doi.toLowerCase());
      }
    }

    const targetIds = Array.from(targetIdsSet);
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
