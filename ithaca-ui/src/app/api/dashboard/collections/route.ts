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

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    collections.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      paperCount: c.paperIds.length,
      createdAt: c.createdAt.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
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
  const { title, description } = body;

  const collection = await prisma.collection.create({
    data: {
      userId: session.user.id,
      title,
      description,
      paperIds: [],
    },
  });

  return NextResponse.json({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    paperCount: 0,
    createdAt: collection.createdAt.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
  });
}
