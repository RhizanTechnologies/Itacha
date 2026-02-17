/**
 * Dashboard API Service
 *
 * Handles all dashboard-related data fetching.
 * Currently uses mock data, structured for easy API integration.
 *
 * TODO: Replace mock implementations with actual API calls when backend is ready.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
  institution?: string;
  badges: string[];
  memberSince: string;
}

export interface DashboardStats {
  savedGraphs: number;
  savedGraphsChange?: string;
  collections: number;
  edgesCorrected: number;
  edgesCorrectedChange?: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  type: "graph" | "collection" | "correction";
  updated: string;
  tags: string[];
  nodeCount?: number;
  paperCount?: number;
  imageUrl?: string;
}

export interface Correction {
  id: string;
  sourceNode: string;
  targetNode: string;
  voteType: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

export interface Collection {
  id: string;
  projectId?: string; // Updated to be optional and linkable
  title: string;
  paperCount: number;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  graphCount: number;
  collectionCount: number;
  lastModified: string;
  isFavorite: boolean;
  color: string;
}

export interface SavedGraph {
  id: string;
  title: string;
  nodeCount: number;
  updated: string;
  projectId?: string;
  collectionId?: string;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_USER: UserProfile = {
  id: "user-1",
  name: "Dr. Elena Rossi",
  email: "elena.rossi@stanford.edu",
  department: "Department of Computer Science",
  institution: "Stanford University",
  badges: ["Active Researcher"],
  memberSince: "2021",
};

const MOCK_STATS: DashboardStats = {
  savedGraphs: 12,
  savedGraphsChange: "+2 this week",
  collections: 8,
  edgesCorrected: 154,
  edgesCorrectedChange: "+15%",
};

const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: "1",
    title: "Citation Network: Neural Fields",
    type: "graph",
    updated: "2 hours ago",
    tags: ["Computer Vision", "Graph"],
    nodeCount: 245,
  },
  {
    id: "2",
    title: "Early Modern History",
    type: "graph",
    updated: "yesterday",
    tags: ["History", "Graph"],
    nodeCount: 89,
  },
  {
    id: "3",
    title: "Thesis References",
    type: "collection",
    updated: "3 days ago",
    tags: ["Research"],
    paperCount: 24,
  },
];

const MOCK_CORRECTIONS: Correction[] = [
  {
    id: "1",
    sourceNode: "Attention Is All You Need",
    targetNode: "BERT: Pre-training of Deep...",
    voteType: "Confirmed",
    status: "approved",
    date: "Oct 24, 2023",
  },
  {
    id: "2",
    sourceNode: "GPT-4 Technical Report",
    targetNode: "Chain-of-Thought Prompting",
    voteType: "Contested",
    status: "pending",
    date: "Oct 22, 2023",
  },
];

const MOCK_COLLECTIONS: Collection[] = [
  {
    id: "1",
    title: "Thesis References",
    paperCount: 24,
    createdAt: "Sep 2023",
  },
  { id: "2", title: "ML Fundamentals", paperCount: 45, createdAt: "Aug 2023" },
  { id: "3", title: "NLP Papers", paperCount: 67, createdAt: "Jul 2023" },
];

// =============================================================================
// API SERVICE
// =============================================================================

// Storage Keys
// Storage Keys
const STORAGE_KEYS = {
  PROFILE: "ithaca_dashboard_profile",
  STATS: "ithaca_dashboard_stats", // derived, not stored directly usually, but we can cache
  ACTIVITY: "ithaca_dashboard_activity", // derived
  COLLECTIONS: "ithaca_dashboard_collections",
  CORRECTIONS: "ithaca_dashboard_corrections",
  PROJECTS: "ithaca_dashboard_projects",
  GRAPHS: "ithaca_dashboard_graphs",
};

// =============================================================================
// API SERVICE
// =============================================================================

class DashboardAPIService {
  private async delay(ms: number = 200): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- Helpers ---

  private getList<T>(key: string): T[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  private setList<T>(key: string, list: T[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(list));
  }

  // --- Profile ---

  async getUserProfile(sessionUser?: {
    name: string;
    email: string;
    image?: string;
  }): Promise<UserProfile> {
    await this.delay();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) return JSON.parse(stored);
    }

    const initialProfile: UserProfile = {
      ...MOCK_USER,
      name: sessionUser?.name || MOCK_USER.name,
      email: sessionUser?.email || MOCK_USER.email,
      avatar: sessionUser?.image || MOCK_USER.avatar,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.PROFILE,
        JSON.stringify(initialProfile),
      );
    }
    return initialProfile;
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await this.delay(300);
    const current = await this.getUserProfile();
    const updated = { ...current, ...data };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    }
    return updated;
  }

  // --- Projects ---

  async getProjects(): Promise<Project[]> {
    await this.delay();
    return this.getList<Project>(STORAGE_KEYS.PROJECTS);
  }

  async createProject(
    data: Omit<
      Project,
      "id" | "graphCount" | "collectionCount" | "lastModified" | "isFavorite"
    >,
  ): Promise<Project> {
    await this.delay();
    const projects = this.getList<Project>(STORAGE_KEYS.PROJECTS);
    const newProject: Project = {
      ...data,
      id: crypto.randomUUID(),
      graphCount: 0,
      collectionCount: 0,
      lastModified: "Just now",
      isFavorite: false,
    };
    this.setList(STORAGE_KEYS.PROJECTS, [newProject, ...projects]);
    return newProject;
  }

  async deleteProject(id: string): Promise<void> {
    await this.delay();
    const projects = this.getList<Project>(STORAGE_KEYS.PROJECTS);
    this.setList(
      STORAGE_KEYS.PROJECTS,
      projects.filter((p) => p.id !== id),
    );
  }

  async toggleProjectFavorite(id: string): Promise<void> {
    await this.delay();
    const projects = this.getList<Project>(STORAGE_KEYS.PROJECTS);
    this.setList(
      STORAGE_KEYS.PROJECTS,
      projects.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p,
      ),
    );
  }

  // --- Collections ---

  async getCollections(projectId?: string): Promise<Collection[]> {
    await this.delay();
    const all = this.getList<Collection & { projectId?: string }>(
      STORAGE_KEYS.COLLECTIONS,
    );
    if (projectId) {
      return all.filter((c) => c.projectId === projectId);
    }
    return all;
  }

  async createCollection(data: {
    title: string;
    projectId?: string;
  }): Promise<Collection> {
    await this.delay();
    const collections = this.getList<Collection & { projectId?: string }>(
      STORAGE_KEYS.COLLECTIONS,
    );
    const newCollection = {
      id: crypto.randomUUID(),
      title: data.title,
      projectId: data.projectId,
      paperCount: 0,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    };
    this.setList(STORAGE_KEYS.COLLECTIONS, [newCollection, ...collections]);

    // Update project count
    if (data.projectId) {
      const projects = this.getList<Project>(STORAGE_KEYS.PROJECTS);
      this.setList(
        STORAGE_KEYS.PROJECTS,
        projects.map((p) =>
          p.id === data.projectId
            ? { ...p, collectionCount: (p.collectionCount || 0) + 1 }
            : p,
        ),
      );
    }

    return newCollection;
  }

  // --- Stats & Derived Data ---

  async getStats(): Promise<DashboardStats> {
    await this.delay();
    const projects = this.getList<Project>(STORAGE_KEYS.PROJECTS);
    const collections = this.getList<Collection>(STORAGE_KEYS.COLLECTIONS);
    // For now, mock edges corrected or store if needed

    return {
      savedGraphs: 0, // Implement saved graphs logic similar to projects if needed
      collections: collections.length,
      edgesCorrected: 154, // Keep static or implement separate storage
      savedGraphsChange: "+0 this week",
      edgesCorrectedChange: "+15%",
    };
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    await this.delay();
    const projects = this.getList<Project>(STORAGE_KEYS.PROJECTS);
    const collections = this.getList<Collection>(STORAGE_KEYS.COLLECTIONS);

    // Convert to RecentActivity format
    const projectActivities: RecentActivity[] = projects.map((p) => ({
      id: p.id,
      title: `Project: ${p.title}`,
      type: "collection", // reusing type
      updated: p.lastModified,
      tags: ["Project"],
      paperCount: p.collectionCount, // heuristic
    }));

    const collectionActivities: RecentActivity[] = collections.map((c) => ({
      id: c.id,
      title: `Collection: ${c.title}`,
      type: "collection",
      updated: c.createdAt,
      tags: ["Collection"],
      paperCount: c.paperCount,
    }));

    // Merge and simple sort (in real app, use timestamps)
    return [...projectActivities, ...collectionActivities].slice(0, 10);
  }

  async getCorrections(): Promise<Correction[]> {
    await this.delay();
    return MOCK_CORRECTIONS;
  }
}

// Singleton instance
export const dashboardAPI = new DashboardAPIService();
