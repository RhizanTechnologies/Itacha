import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latencyMs?: number;
  description: string;
}

export async function GET() {
  const services: ServiceStatus[] = [];

  // Check database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.push({
      name: "Database (Postgres)",
      status: "operational",
      latencyMs: Date.now() - dbStart,
      description: "Primary data store",
    });
  } catch {
    services.push({
      name: "Database (Postgres)",
      status: "down",
      latencyMs: Date.now() - dbStart,
      description: "Primary data store",
    });
  }

  // Check OpenAlex API reachability
  const oaStart = Date.now();
  try {
    const res = await fetch("https://api.openalex.org/works?per_page=1", {
      signal: AbortSignal.timeout(5000),
    });
    services.push({
      name: "OpenAlex API",
      status: res.ok ? "operational" : "degraded",
      latencyMs: Date.now() - oaStart,
      description: "Academic paper data source",
    });
  } catch {
    services.push({
      name: "OpenAlex API",
      status: "down",
      latencyMs: Date.now() - oaStart,
      description: "Academic paper data source",
    });
  }

  // Web Interface is inherently operational if this response is served
  services.push({
    name: "Web Interface",
    status: "operational",
    description: "Next.js application",
  });

  const allOperational = services.every((s) => s.status === "operational");

  return NextResponse.json({
    status: allOperational ? "operational" : "degraded",
    services,
    checkedAt: new Date().toISOString(),
  });
}
