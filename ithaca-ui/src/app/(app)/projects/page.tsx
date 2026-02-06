"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Clock,
  Share2,
  Trash2,
  Edit,
  Star,
  StarOff,
  Loader2,
  BookOpen,
  GitBranch,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

// Types
import { dashboardAPI, Project, Collection } from "@/lib/api/dashboard-api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  const handleCreateProject = async (data: {
    title: string;
    description: string;
    color: string;
  }) => {
    try {
      const newProject = await dashboardAPI.createProject(data);
      setProjects([newProject, ...projects]);
    } catch (e) {
      console.error("Failed to create project", e);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedProjects, loadedCollections] = await Promise.all([
        dashboardAPI.getProjects(),
        dashboardAPI.getCollections(),
      ]);
      setProjects(loadedProjects);
      setCollections(loadedCollections);
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Filter projects by search
  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get collections for selected project
  const projectCollections = selectedProject
    ? collections.filter((c: any) => c.projectId === selectedProject.id)
    : [];

  const toggleFavorite = async (projectId: string) => {
    await dashboardAPI.toggleProjectFavorite(projectId);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p,
      ),
    );
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this project? This action cannot be undone.");
    if (!confirmed) return;
    await dashboardAPI.deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProject?.id === projectId) setSelectedProject(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30 pb-10">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-primary" />
                Projects
              </h1>
              <p className="text-muted-foreground text-sm">
                Organize your research into projects and collections
              </p>
            </div>
            <Button className="gap-2" onClick={() => setIsNewProjectOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Projects Grid/List */}
          <div className="flex-1">
            {/* Favorites Section */}
            {filteredProjects.some((p) => p.isFavorite) && (
              <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Favorites
                </h2>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : "space-y-2"
                  }
                >
                  {filteredProjects
                    .filter((p) => p.isFavorite)
                    .map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewMode={viewMode}
                        isSelected={selectedProject?.id === project.id}
                        onSelect={() => setSelectedProject(project)}
                        onToggleFavorite={() => toggleFavorite(project.id)}
                        onDelete={() => handleDeleteProject(project.id)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Projects */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                All Projects ({filteredProjects.length})
              </h2>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-2"
                }
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode={viewMode}
                    isSelected={selectedProject?.id === project.id}
                    onSelect={() => setSelectedProject(project)}
                    onToggleFavorite={() => toggleFavorite(project.id)}
                    onDelete={() => handleDeleteProject(project.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Collections Shelf */}
          {selectedProject && (
            <div className="w-80 shrink-0">
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedProject.color }}
                      />
                      {selectedProject.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedProject(null)}
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedProject.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedProject.graphCount} graphs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedProject.collectionCount} collections</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Collections
                  </h4>

                  {projectCollections.length > 0 ? (
                    <div className="space-y-2">
                      {projectCollections.map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/explore?collection=${collection.id}`}
                          className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="font-medium text-sm">
                            {collection.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {collection.paperCount} papers •{" "}
                            {collection.createdAt}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No collections yet
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Collection
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  viewMode,
  isSelected,
  onSelect,
  onToggleFavorite,
  onDelete,
}: {
  project: Project;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  if (viewMode === "list") {
    return (
      <div
        onClick={onSelect}
        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? "bg-primary/5 border-primary/30"
            : "bg-card hover:bg-muted/50 border-border"
        }`}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: project.color + "20" }}
        >
          <FolderOpen className="h-5 w-5" style={{ color: project.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{project.title}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {project.description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{project.graphCount} graphs</Badge>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {project.lastModified}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {project.isFavorite ? (
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer transition-all overflow-hidden ${
        isSelected ? "ring-2 ring-primary" : "hover:shadow-md"
      }`}
    >
      <div className="h-2" style={{ backgroundColor: project.color }} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color + "20" }}
          >
            <FolderOpen className="h-5 w-5" style={{ color: project.color }} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleFavorite}>
                {project.isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-medium mt-3">{project.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {project.description}
        </p>

        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {project.graphCount}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {project.collectionCount}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {project.lastModified}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
