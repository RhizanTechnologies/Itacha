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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      // Custom fields would be here if extended in schema
      // department: true,
      // institution: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Format response to match UserProfile interface
  const profile = {
    id: user.id,
    name: user.name || "",
    email: user.email,
    avatar: user.image || undefined,
    department: "Department of Computer Science", // Placeholder until added to schema
    institution: "Stanford University", // Placeholder until added to schema
    badges: ["Active Researcher"], // Placeholder
    memberSince: user.createdAt.getFullYear().toString(),
  };

  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, department, institution } = body;

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      // department, // Add to schema if needed
      // institution, // Add to schema if needed
    },
  });

  return NextResponse.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.image,
    department: department || "Department of Computer Science",
    institution: institution || "Stanford University",
    badges: ["Active Researcher"],
    memberSince: updatedUser.createdAt.getFullYear().toString(),
  });
}
