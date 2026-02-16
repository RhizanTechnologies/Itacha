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

  // Fetch recent projects and collections
  const [projects, collections, corrections] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.collection.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.correction.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  // Combine and sort
  const activities = [
    ...projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: "graph",
      updated: p.updatedAt,
      tags: ["Project"], // TODO: store tags
      nodeCount: 0, // p.nodes ? (p.nodes as any[]).length : 0
    })),
    ...collections.map((c) => ({
      id: c.id,
      title: c.title,
      type: "collection",
      updated: c.updatedAt,
      tags: ["Collection"],
      paperCount: c.paperIds.length,
    })),
    ...corrections.map((c) => ({
      id: c.id,
      title: `Correction: ${c.sourceNode} -> ${c.targetNode}`,
      type: "correction",
      updated: c.updatedAt,
      tags: ["Correction"],
      paperCount: 0,
    })),
  ]
    .sort((a, b) => b.updated.getTime() - a.updated.getTime())
    .slice(0, 10)
    .map((a) => ({
      ...a,
      updated: a.updated.toLocaleString(), // Format date
    }));

  return NextResponse.json(activities);
}
