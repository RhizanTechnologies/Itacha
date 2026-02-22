"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id ?? null;
}

// =============================================================================
// PROFILE
// =============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
  institution?: string;
  memberSince: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      department: true,
      institution: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name || "Researcher",
    email: user.email,
    avatar: user.image || undefined,
    department: user.department || undefined,
    institution: user.institution || undefined,
    memberSince: user.createdAt.getFullYear().toString(),
  };
}

export async function updateProfile(data: {
  name?: string;
  department?: string;
  institution?: string;
}): Promise<UserProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      department: data.department,
      institution: data.institution,
    },
  });

  return getUserProfile();
}

// =============================================================================
// PROJECTS
// =============================================================================

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  graphCount: number;
  collectionCount: number;
  lastModified: string;
  isFavorite: boolean;
  color: string;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getProjects(): Promise<ProjectData[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const projects = await prisma.project.findMany({
    where: { userId },
    include: {
      _count: { select: { collections: true, savedGraphs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    graphCount: p._count.savedGraphs,
    collectionCount: p._count.collections,
    lastModified: formatRelativeDate(p.updatedAt),
    isFavorite: p.isFavorite,
    color: p.color,
  }));
}

export async function createProject(data: {
  title: string;
  description: string;
  color: string;
}): Promise<ProjectData> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Not authenticated");

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      color: data.color,
      userId,
    },
    include: {
      _count: { select: { collections: true, savedGraphs: true } },
    },
  });

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    graphCount: project._count.savedGraphs,
    collectionCount: project._count.collections,
    lastModified: "Just now",
    isFavorite: project.isFavorite,
    color: project.color,
  };
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Not authenticated");

  await prisma.project.delete({
    where: { id, userId },
  });
}

export async function toggleProjectFavorite(id: string): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Not authenticated");

  const project = await prisma.project.findUnique({
    where: { id, userId },
    select: { isFavorite: true },
  });
  if (!project) return;

  await prisma.project.update({
    where: { id, userId },
    data: { isFavorite: !project.isFavorite },
  });
}

// =============================================================================
// COLLECTIONS
// =============================================================================

export interface CollectionData {
  id: string;
  projectId?: string;
  title: string;
  paperCount: number;
  createdAt: string;
}

export async function getCollections(
  projectId?: string,
): Promise<CollectionData[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const collections = await prisma.collection.findMany({
    where: { userId, ...(projectId ? { projectId } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return collections.map((c) => ({
    id: c.id,
    projectId: c.projectId || undefined,
    title: c.title,
    paperCount: c.paperIds.length,
    createdAt: c.createdAt.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
  }));
}

export async function createCollection(data: {
  title: string;
  projectId?: string;
}): Promise<CollectionData> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Not authenticated");

  const collection = await prisma.collection.create({
    data: {
      title: data.title,
      projectId: data.projectId,
      userId,
    },
  });

  return {
    id: collection.id,
    projectId: collection.projectId || undefined,
    title: collection.title,
    paperCount: 0,
    createdAt: collection.createdAt.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
  };
}

export async function addPaperToCollection(
  collectionId: string,
  paperId: string,
): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Not authenticated");

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, userId },
    select: { paperIds: true },
  });
  if (!collection) return;
  if (collection.paperIds.includes(paperId)) return;

  await prisma.collection.update({
    where: { id: collectionId },
    data: { paperIds: { push: paperId } },
  });
}

// =============================================================================
// STATS
// =============================================================================

export interface DashboardStats {
  savedGraphs: number;
  savedGraphsChange?: string;
  collections: number;
  edgesCorrected: number;
  edgesCorrectedChange?: string;
}

export async function getStats(): Promise<DashboardStats> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { savedGraphs: 0, collections: 0, edgesCorrected: 0 };
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [graphCount, collectionCount, correctionCount, newGraphsThisWeek] =
    await Promise.all([
      prisma.savedGraph.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
      prisma.citationCache.count({ where: { provider: "user-correction" } }),
      prisma.savedGraph.count({
        where: { userId, createdAt: { gte: weekAgo } },
      }),
    ]);

  return {
    savedGraphs: graphCount,
    savedGraphsChange:
      newGraphsThisWeek > 0 ? `+${newGraphsThisWeek} this week` : undefined,
    collections: collectionCount,
    edgesCorrected: correctionCount,
  };
}

// =============================================================================
// RECENT ACTIVITY
// =============================================================================

export interface RecentActivity {
  id: string;
  title: string;
  type: "graph" | "collection" | "correction";
  updated: string;
  tags: string[];
  nodeCount?: number;
  paperCount?: number;
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const [recentGraphs, recentCollections] = await Promise.all([
    prisma.savedGraph.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        nodeCount: true,
        updatedAt: true,
        query: true,
      },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        paperIds: true,
        updatedAt: true,
      },
    }),
  ]);

  const items: RecentActivity[] = [
    ...recentGraphs.map((g) => ({
      id: g.id,
      title: g.title,
      type: "graph" as const,
      updated: formatRelativeDate(g.updatedAt),
      tags: ["Graph"],
      nodeCount: g.nodeCount,
    })),
    ...recentCollections.map((c) => ({
      id: c.id,
      title: c.title,
      type: "collection" as const,
      updated: formatRelativeDate(c.updatedAt),
      tags: ["Collection"],
      paperCount: c.paperIds.length,
    })),
  ];

  items.sort((a, b) => {
    const timeA = parseRelativeTime(a.updated);
    const timeB = parseRelativeTime(b.updated);
    return timeA - timeB;
  });

  return items.slice(0, 10);
}

function parseRelativeTime(s: string): number {
  if (s === "Just now") return 0;
  const match = s.match(/^(\d+)(m|h|d)/);
  if (!match) return Infinity;
  const n = parseInt(match[1]);
  switch (match[2]) {
    case "m":
      return n;
    case "h":
      return n * 60;
    case "d":
      return n * 1440;
    default:
      return Infinity;
  }
}

// =============================================================================
// CORRECTIONS (from CitationCache)
// =============================================================================

export interface CorrectionData {
  id: string;
  citingId: string;
  citedId: string;
  edgeType: string;
  date: string;
}

export async function getCorrections(): Promise<CorrectionData[]> {
  const corrections = await prisma.citationCache.findMany({
    where: { provider: "user-correction" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      citingId: true,
      citedId: true,
      edgeType: true,
      createdAt: true,
    },
  });

  return corrections.map((c) => ({
    id: c.id,
    citingId: c.citingId,
    citedId: c.citedId,
    edgeType: c.edgeType,
    date: c.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));
}
