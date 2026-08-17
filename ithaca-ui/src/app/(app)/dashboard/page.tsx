"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  FolderOpen,
  GitBranch,
  Settings,
  Edit,
  Activity,
  BookOpen,
  History,
  MoreHorizontal,
  TrendingUp,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getUserProfile,
  getStats,
  getRecentActivity,
  getCorrections,
  getCollections,
  getSavedGraphs,
  deleteSavedGraph,
  getCalibrationStats,
  type UserProfile,
  type DashboardStats,
  type CalibrationStats,
  type RecentActivity,
  type CorrectionData,
  type CollectionData,
  type SavedGraphData,
} from "./actions";
import { ProfileSettings } from "@/components/dashboard/profile-settings";
import { PrivacySettings } from "@/components/dashboard/privacy-settings";

export default function DashboardPage() {
  const [currentTab, setCurrentTab] = useState("overview");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setCurrentTab(tab);
    }
  }, []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calibration, setCalibration] = useState<CalibrationStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [corrections, setCorrections] = useState<CorrectionData[]>([]);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [savedGraphs, setSavedGraphs] = useState<SavedGraphData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          profileData,
          statsData,
          calibrationData,
          activityData,
          correctionsData,
          collectionsData,
          savedGraphsData,
        ] = await Promise.all([
          getUserProfile(),
          getStats(),
          getCalibrationStats(),
          getRecentActivity(),
          getCorrections(),
          getCollections(),
          getSavedGraphs(),
        ]);

        setProfile(profileData);
        setStats(statsData);
        setCalibration(calibrationData);
        setActivities(activityData);
        setCorrections(correctionsData);
        setCollections(collectionsData);
        setSavedGraphs(savedGraphsData);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleProfileUpdate = async () => {
    const updatedProfile = await getUserProfile();
    setProfile(updatedProfile);
  };

  if (isLoading) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-2 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !stats) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error || "Failed to load"}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-full pb-10">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <Avatar className="border-primary/20 h-20 w-20 border-4">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="bg-primary/10 text-xl font-bold">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">
                    {profile.department}
                    {profile.institution && `, ${profile.institution}`}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className="text-muted-foreground text-xs">
                      Member since {profile.memberSince}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setCurrentTab("settings")}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={Share2}
            label="Saved Graphs"
            value={stats.savedGraphs}
            change={stats.savedGraphsChange}
          />
          <StatCard
            icon={FolderOpen}
            label="Collections"
            value={stats.collections}
          />
          <StatCard
            icon={GitBranch}
            label="Edges Corrected"
            value={stats.edgesCorrected}
            change={stats.edgesCorrectedChange}
          />
        </div>

        {calibration && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    AI trust calibration
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    How often your lab corrects the model, and how many
                    low-confidence edges remain unresolved.
                  </p>
                </div>
                <Badge variant="secondary">
                  {calibration.totalClassifications} classified
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-muted/40 rounded-lg p-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Correction rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {(calibration.correctionRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Agreement proxy
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {(calibration.agreementProxy * 100).toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    High-confidence edges left untouched
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Unresolved low confidence
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {calibration.lowConfidenceUnresolved}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="graphs" className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              My Saved Graphs
            </TabsTrigger>
            <TabsTrigger value="collections" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              My Collections
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Correction History
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="text-primary h-5 w-5" />
                  Recent Activity
                </h2>
              </div>
              {activities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {activities.map((activity) => (
                    <Card
                      key={activity.id}
                      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                    >
                      <div className="from-primary/10 to-primary/5 relative h-32 bg-gradient-to-br">
                        <Badge className="bg-card/80 absolute top-2 right-2 text-xs">
                          {activity.nodeCount
                            ? `${activity.nodeCount} Nodes`
                            : `${activity.paperCount} Papers`}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="truncate font-medium">
                          {activity.title}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          Updated {activity.updated}
                        </p>
                        <div className="mt-2 flex gap-1">
                          {activity.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-muted-foreground p-8 text-center">
                    <p>
                      No recent activity yet. Start by exploring a research
                      topic!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Latest Corrections */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <GitBranch className="text-primary h-5 w-5" />
                Latest Corrections
              </h2>
              {corrections.length > 0 ? (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-muted-foreground border-b text-xs uppercase">
                          <th className="p-4 text-left font-medium">
                            Citing Paper
                          </th>
                          <th className="p-4 text-left font-medium">
                            Cited Paper
                          </th>
                          <th className="p-4 text-left font-medium">
                            Edge Type
                          </th>
                          <th className="p-4 text-left font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {corrections.slice(0, 5).map((correction) => (
                          <tr
                            key={correction.id}
                            className="hover:bg-muted/50 border-b last:border-0"
                          >
                            <td className="p-4 font-mono text-sm text-xs">
                              {correction.citingId}
                            </td>
                            <td className="text-muted-foreground p-4 font-mono text-sm text-xs">
                              {correction.citedId}
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">
                                {correction.edgeType}
                              </Badge>
                            </td>
                            <td className="text-muted-foreground p-4 text-sm">
                              {correction.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-muted-foreground p-8 text-center">
                    <p>
                      No corrections yet. Correct an edge in the graph explorer
                      to see it here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Graphs Tab */}
          <TabsContent value="graphs" className="mt-6">
            {savedGraphs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {savedGraphs.map((graph) => (
                  <Card
                    key={graph.id}
                    className="group overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <div className="from-primary/10 to-primary/5 relative h-32 bg-gradient-to-br">
                      <Badge className="bg-card/80 absolute top-2 right-2 text-xs">
                        {graph.nodeCount} nodes &bull; {graph.edgeCount} edges
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-card/80 hover:bg-destructive/10 hover:text-destructive absolute top-2 left-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={async () => {
                          if (!confirm("Delete this saved graph?")) return;
                          await deleteSavedGraph(graph.id);
                          setSavedGraphs((prev) =>
                            prev.filter((g) => g.id !== graph.id),
                          );
                        }}
                      >
                        <span className="text-xs">✕</span>
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <Link
                        href={`/explore?graph=${graph.id}`}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        {graph.title}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {graph.query !== graph.title && (
                          <span className="mb-0.5 block truncate">
                            Query: {graph.query}
                          </span>
                        )}
                        {graph.projectTitle && (
                          <span className="text-primary">
                            {graph.projectTitle} &bull;{" "}
                          </span>
                        )}
                        Saved {graph.createdAt}
                      </p>
                      <Link
                        href={`/explore?graph=${graph.id}`}
                        className="text-primary mt-2 inline-block text-xs font-medium"
                      >
                        Open debate map →
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-muted-foreground flex flex-col items-center gap-4 p-8 text-center">
                  <p>
                    No saved debate maps yet. Explore a topic, then freeze a
                    shareable map for your lab.
                  </p>
                  <Button asChild>
                    <Link href="/explore">Open Explore</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-6">
            {collections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {collections.map((collection) => (
                  <Card
                    key={collection.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{collection.title}</h3>
                          <p className="text-muted-foreground text-xs">
                            {collection.paperCount} Papers &bull; Created{" "}
                            {collection.createdAt}
                            {collection.watchEnabled && " · Watching weekly"}
                          </p>
                          <Link
                            href={`/explore?collection=${collection.id}`}
                            className="text-primary mt-2 inline-block text-xs font-medium"
                          >
                            Open debate map →
                          </Link>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/explore?collection=${collection.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-muted-foreground flex flex-col items-center gap-4 p-8 text-center">
                  <p>
                    No collections yet. Create a project collection, import
                    seeds, then explore the debate map.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/projects">Go to Projects</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            {corrections.length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-muted-foreground border-b text-xs uppercase">
                        <th className="p-4 text-left font-medium">
                          Citing Paper
                        </th>
                        <th className="p-4 text-left font-medium">
                          Cited Paper
                        </th>
                        <th className="p-4 text-left font-medium">Edge Type</th>
                        <th className="p-4 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corrections.map((correction) => (
                        <tr
                          key={correction.id}
                          className="hover:bg-muted/50 border-b last:border-0"
                        >
                          <td className="p-4 font-mono text-sm text-xs">
                            {correction.citingId}
                          </td>
                          <td className="text-muted-foreground p-4 font-mono text-sm text-xs">
                            {correction.citedId}
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              {correction.edgeType}
                            </Badge>
                          </td>
                          <td className="text-muted-foreground p-4 text-sm">
                            {correction.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-muted-foreground p-8 text-center">
                  <p>No correction history yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <ProfileSettings profile={profile} onUpdate={handleProfileUpdate} />
            <PrivacySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  change?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon className="text-muted-foreground/50 h-8 w-8" />
          {change && (
            <span className="text-primary flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              {change}
            </span>
          )}
        </div>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        <p className="text-muted-foreground text-sm">{label}</p>
      </CardContent>
    </Card>
  );
}
