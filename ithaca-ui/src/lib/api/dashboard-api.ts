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
  title: string;
  paperCount: number;
  createdAt: string;
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

class DashboardAPIService {
  /**
   * Get current user profile
   * TODO: Replace with actual API call
   */
  async getUserProfile(): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_USER;
  }

  /**
   * Get dashboard stats for current user
   * TODO: Replace with actual API call
   */
  async getStats(): Promise<DashboardStats> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_STATS;
  }

  /**
   * Get recent activity for current user
   * TODO: Replace with actual API call
   */
  async getRecentActivity(): Promise<RecentActivity[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_ACTIVITIES;
  }

  /**
   * Get correction history for current user
   * TODO: Replace with actual API call
   */
  async getCorrections(): Promise<Correction[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_CORRECTIONS;
  }

  /**
   * Get collections for current user
   * TODO: Replace with actual API call
   */
  async getCollections(): Promise<Collection[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_COLLECTIONS;
  }

  /**
   * Update user profile
   * TODO: Replace with actual API call
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { ...MOCK_USER, ...data };
  }
}

// Singleton instance
export const dashboardAPI = new DashboardAPIService();
