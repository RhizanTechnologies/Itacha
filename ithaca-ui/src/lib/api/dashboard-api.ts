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

// =============================================================================
// API SERVICE
// =============================================================================

class DashboardAPIService {
  // --- Profile ---

  async getUserProfile(sessionUser?: {
    name: string;
    email: string;
    image?: string;
  }): Promise<UserProfile> {
    if (typeof window === "undefined") {
      // Server-side default
      return {
        id: "",
        name: sessionUser?.name || "",
        email: sessionUser?.email || "",
        avatar: sessionUser?.image,
        badges: [],
        memberSince: new Date().getFullYear().toString(),
      };
    }

    try {
      const res = await fetch("/api/dashboard/profile");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }

    // Fallback if API fails or auth not ready
    return {
      ...MOCK_USER,
      name: sessionUser?.name || MOCK_USER.name,
      email: sessionUser?.email || MOCK_USER.email,
      avatar: sessionUser?.image || MOCK_USER.avatar,
    };
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update profile");
    return await res.json();
  }

  // --- Projects ---

  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch("/api/dashboard/projects");
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Failed to fetch projects", e);
    }
    return [];
  }

  async createProject(
    data: Omit<
      Project,
      "id" | "graphCount" | "collectionCount" | "lastModified" | "isFavorite"
    >,
  ): Promise<Project> {
    const res = await fetch("/api/dashboard/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return await res.json();
  }

  async deleteProject(id: string): Promise<void> {
    // TODO: Add DELETE endpoint
    await fetch(`/api/dashboard/projects?id=${id}`, { method: "DELETE" });
  }

  async toggleProjectFavorite(id: string): Promise<void> {
    // TODO: Add PATCH endpoint
    await fetch(`/api/dashboard/projects?id=${id}&action=toggle-favorite`, {
      method: "PATCH",
    });
  }

  // --- Collections ---

  async getCollections(projectId?: string): Promise<Collection[]> {
    try {
      const res = await fetch("/api/dashboard/collections");
      if (res.ok) {
        const data = await res.json();
        // Client-side filter if needed (though API should handle query params ideally)
        if (projectId)
          return data.filter((c: any) => c.projectId === projectId);
        return data;
      }
    } catch (e) {
      console.error("Failed to fetch collections", e);
    }
    return MOCK_COLLECTIONS;
  }

  async createCollection(data: {
    title: string;
    projectId?: string;
  }): Promise<Collection> {
    const res = await fetch("/api/dashboard/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create collection");
    return await res.json();
  }

  // --- Stats & Derived Data ---

  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
    return MOCK_STATS;
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const res = await fetch("/api/dashboard/activity");
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Failed to fetch activity", e);
    }
    return MOCK_ACTIVITIES;
  }

  async getCorrections(): Promise<Correction[]> {
    try {
      const res = await fetch("/api/dashboard/corrections");
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Failed to fetch corrections", e);
    }
    return MOCK_CORRECTIONS;
  }
}

// Singleton instance
export const dashboardAPI = new DashboardAPIService();
