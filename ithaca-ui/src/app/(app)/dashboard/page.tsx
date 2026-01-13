"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  dashboardAPI, 
  UserProfile, 
  DashboardStats, 
  RecentActivity, 
  Correction,
  Collection 
} from "@/lib/api/dashboard-api";
import { ProfileSettings } from "@/components/dashboard/profile-settings";

// Stats Icon Map
const STAT_ICONS = {
  savedGraphs: Share2,
  collections: FolderOpen,
  edgesCorrected: GitBranch,
};



export default function DashboardPage() {
  const searchParams = useSearchParams();
  // Get active tab from URL or default to overview
  const activeTab = searchParams.get("tab") || "overview";
  
  // State from API
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      
      try {
        const [profileData, statsData, activityData, correctionsData, collectionsData] = 
          await Promise.all([
            dashboardAPI.getUserProfile(),
            dashboardAPI.getStats(),
            dashboardAPI.getRecentActivity(),
            dashboardAPI.getCorrections(),
            dashboardAPI.getCollections(),
          ]);

        setProfile(profileData);
        setStats(statsData);
        setActivities(activityData);
        setCorrections(correctionsData);
        setCollections(collectionsData);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();

  }, []);

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setCurrentTab(tab);
    }
  }, [searchParams]);

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
                    {profile.department}{profile.institution && `, ${profile.institution}`}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {profile.badges.map((badge) => (
                      <Badge key={badge} className="bg-primary/10 text-primary">
                        {badge}
                      </Badge>
                    ))}
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
            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </h2>
                <Button variant="link" size="sm">
                  View all →
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative">
                      <Badge className="absolute top-2 right-2 bg-card/80 text-xs">
                        {activity.nodeCount ? `${activity.nodeCount} Nodes` : `${activity.paperCount} Papers`}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate">{activity.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Updated {activity.updated}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {activity.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Latest Corrections */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <GitBranch className="h-5 w-5 text-primary" />
                Latest Corrections
              </h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground uppercase">
                        <th className="text-left p-4 font-medium">Source Node</th>
                        <th className="text-left p-4 font-medium">Target Node</th>
                        <th className="text-left p-4 font-medium">Vote Type</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corrections.map((correction) => (
                        <tr key={correction.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 text-sm">{correction.sourceNode}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {correction.targetNode}
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{correction.voteType}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge 
                              className={
                                correction.status === "approved" 
                                  ? "bg-supports/10 text-supports gap-1" 
                                  : correction.status === "rejected"
                                  ? "bg-contradicts/10 text-contradicts gap-1"
                                  : "bg-extends/10 text-extends gap-1"
                              }
                            >
                              {correction.status === "approved" && <Check className="h-3 w-3" />}
                              {correction.status.charAt(0).toUpperCase() + correction.status.slice(1)}
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
            </div>
          </TabsContent>

          {/* Graphs Tab */}
          <TabsContent value="graphs" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activities.filter(a => a.type === "graph").map((graph) => (
                <Card key={graph.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative">
                    <Badge className="absolute top-2 right-2 bg-card/80 text-xs">
                      {graph.nodeCount} Nodes
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium">{graph.title}</h3>
                    <p className="text-xs text-muted-foreground">Updated {graph.updated}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{collection.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {collection.paperCount} Papers • Created {collection.createdAt}
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
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase">
                      <th className="text-left p-4 font-medium">Source Node</th>
                      <th className="text-left p-4 font-medium">Target Node</th>
                      <th className="text-left p-4 font-medium">Vote Type</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((correction) => (
                      <tr key={correction.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4 text-sm">{correction.sourceNode}</td>
                        <td className="p-4 text-sm text-muted-foreground">{correction.targetNode}</td>
                        <td className="p-4"><Badge variant="secondary">{correction.voteType}</Badge></td>
                        <td className="p-4">
                          <Badge className={correction.status === "approved" ? "bg-supports/10 text-supports" : "bg-extends/10 text-extends"}>
                            {correction.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{correction.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>


          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <ProfileSettings profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change 
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
