import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [collectionsCount, projectsCount, correctionsCount] = await Promise.all(
    [
      prisma.collection.count({ where: { userId: session.user.id } }),
      prisma.project.count({ where: { userId: session.user.id } }),
      prisma.correction.count({ where: { userId: session.user.id } }),
    ],
  );

  return NextResponse.json({
    savedGraphs: projectsCount,
    savedGraphsChange: "+0 this week", // TODO: calculate change
    collections: collectionsCount,
    edgesCorrected: correctionsCount,
    edgesCorrectedChange: "+0%", // TODO: calculate change
  });
}
