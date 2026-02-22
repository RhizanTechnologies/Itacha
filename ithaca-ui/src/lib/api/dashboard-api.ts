/**
 * Dashboard API Types
 *
 * Re-exports types from the server actions module.
 * All data operations are handled by server actions in
 * src/app/(app)/dashboard/actions.ts
 */

export type {
  UserProfile,
  DashboardStats,
  RecentActivity,
  CorrectionData as Correction,
  CollectionData as Collection,
  ProjectData as Project,
} from "@/app/(app)/dashboard/actions";
