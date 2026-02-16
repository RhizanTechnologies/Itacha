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

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      graphCount: 1, // Currently 1 graph per project model
      collectionCount: 0, // Placeholder
      lastModified: p.updatedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }), // "Just now" or date
      isFavorite: p.isFavorite,
      color: "bg-blue-500", // Placeholder
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, nodes, edges, metadata } = body;

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      title,
      description,
      nodes: nodes || [], // Store graph usage
      edges: edges || [],
      metadata: metadata || {},
    },
  });

  return NextResponse.json({
    id: project.id,
    title: project.title,
    description: project.description,
    graphCount: 1,
    collectionCount: 0,
    lastModified: "Just now",
    isFavorite: false,
    color: "bg-blue-500",
  });
}
