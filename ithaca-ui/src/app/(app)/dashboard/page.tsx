"use client";

import { useEffect, useState } from "react";
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
  type UserProfile,
  type DashboardStats,
  type RecentActivity,
  type CorrectionData,
  type CollectionData,
  type SavedGraphData,
} from "./actions";
import { ProfileSettings } from "@/components/dashboard/profile-settings";

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
          activityData,
          correctionsData,
          collectionsData,
          savedGraphsData,
        ] = await Promise.all([
          getUserProfile(),
          getStats(),
          getRecentActivity(),
          getCorrections(),
          getCollections(),
          getSavedGraphs(),
        ]);

        setProfile(profileData);
        setStats(statsData);
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="text-destructive mb-2">{error || "Failed to load"}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30 pb-10">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-xl font-bold bg-primary/10">
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
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </h2>
              </div>
              {activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activities.map((activity) => (
                    <Card
                      key={activity.id}
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative">
                        <Badge className="absolute top-2 right-2 bg-card/80 text-xs">
                          {activity.nodeCount
                            ? `${activity.nodeCount} Nodes`
                            : `${activity.paperCount} Papers`}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">
                          {activity.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Updated {activity.updated}
                        </p>
                        <div className="flex gap-1 mt-2">
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
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No recent activity yet. Start by exploring a research topic!</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Latest Corrections */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <GitBranch className="h-5 w-5 text-primary" />
                Latest Corrections
              </h2>
              {corrections.length > 0 ? (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground uppercase">
                          <th className="text-left p-4 font-medium">
                            Citing Paper
                          </th>
                          <th className="text-left p-4 font-medium">
                            Cited Paper
                          </th>
                          <th className="text-left p-4 font-medium">
                            Edge Type
                          </th>
                          <th className="text-left p-4 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {corrections.slice(0, 5).map((correction) => (
                          <tr
                            key={correction.id}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="p-4 text-sm font-mono text-xs">
                              {correction.citingId}
                            </td>
                            <td className="p-4 text-sm font-mono text-xs text-muted-foreground">
                              {correction.citedId}
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">
                                {correction.edgeType}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
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
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No corrections yet. Correct an edge in the graph explorer to see it here.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Graphs Tab */}
          <TabsContent value="graphs" className="mt-6">
            {savedGraphs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedGraphs.map((graph) => (
                  <Card
                    key={graph.id}
                    className="overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative">
                      <Badge className="absolute top-2 right-2 bg-card/80 text-xs">
                        {graph.nodeCount} nodes &bull; {graph.edgeCount} edges
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 hover:bg-destructive/10 hover:text-destructive"
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
                      <h3 className="font-medium">{graph.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {graph.query !== graph.title && (
                          <span className="block truncate mb-0.5">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>
                    No saved graphs yet. Save a graph from the explorer to see
                    it here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-6">
            {collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <Card
                    key={collection.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{collection.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {collection.paperCount} Papers &bull; Created{" "}
                            {collection.createdAt}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No collections yet. Create one from the Projects page.</p>
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
                      <tr className="border-b text-xs text-muted-foreground uppercase">
                        <th className="text-left p-4 font-medium">
                          Citing Paper
                        </th>
                        <th className="text-left p-4 font-medium">
                          Cited Paper
                        </th>
                        <th className="text-left p-4 font-medium">
                          Edge Type
                        </th>
                        <th className="text-left p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corrections.map((correction) => (
                        <tr
                          key={correction.id}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="p-4 text-sm font-mono text-xs">
                            {correction.citingId}
                          </td>
                          <td className="p-4 text-sm font-mono text-xs text-muted-foreground">
                            {correction.citedId}
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              {correction.edgeType}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
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
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No correction history yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <ProfileSettings
              profile={profile}
              onUpdate={handleProfileUpdate}
            />
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
          <Icon className="h-8 w-8 text-muted-foreground/50" />
          {change && (
            <span className="text-xs text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {change}
            </span>
          )}
        </div>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
