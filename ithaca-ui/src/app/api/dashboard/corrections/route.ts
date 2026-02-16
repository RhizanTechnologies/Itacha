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

  const corrections = await prisma.correction.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    corrections.map((c) => ({
      id: c.id,
      sourceNode: c.sourceNode,
      targetNode: c.targetNode,
      voteType: c.voteType,
      status: c.status,
      date: c.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    })),
  );
}
