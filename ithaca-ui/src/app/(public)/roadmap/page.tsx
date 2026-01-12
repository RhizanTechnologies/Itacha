import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoadmapPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Public Roadmap</h1>
        <p className="text-xl text-muted-foreground">
          What we're building next.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Now */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
             <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
             <h2 className="text-lg font-bold uppercase tracking-wider">In Progress</h2>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <Badge className="w-fit mb-2">Core Canvas</Badge>
              <CardTitle className="text-base">M3: WebGL Graph Rendering</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Migrating from text-based lists to full force-directed graph visualization using Sigma.js.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Badge className="w-fit mb-2">Performance</Badge>
              <CardTitle className="text-base">M4: 10k Node Support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Optimizing data loading and layout algorithms for large-scale citation networks.
            </CardContent>
          </Card>
        </div>

        {/* Next */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-4">
             <div className="h-3 w-3 rounded-full bg-blue-500" />
             <h2 className="text-lg font-bold uppercase tracking-wider">Up Next</h2>
          </div>

          <Card className="opacity-80">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit mb-2">UX</Badge>
              <CardTitle className="text-base">M5: Inspector Panel</CardTitle>
            </CardHeader>
             <CardContent className="text-sm text-muted-foreground">
              Detailed view for papers comprising abstract, key claims, and evidence snippets.
            </CardContent>
          </Card>

          <Card className="opacity-80">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit mb-2">Filters</Badge>
              <CardTitle className="text-base">M6: Time Slider</CardTitle>
            </CardHeader>
             <CardContent className="text-sm text-muted-foreground">
              Dynamic filtering of graphs by publication year range.
            </CardContent>
          </Card>
        </div>

        {/* Later */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-4">
             <div className="h-3 w-3 rounded-full bg-muted-foreground" />
             <h2 className="text-lg font-bold uppercase tracking-wider">Future</h2>
          </div>

          <Card className="opacity-60 border-dashed">
            <CardHeader className="pb-2">
              <Badge variant="secondary" className="w-fit mb-2">Social</Badge>
              <CardTitle className="text-base">M9: Collaborative Collections</CardTitle>
            </CardHeader>
             <CardContent className="text-sm text-muted-foreground">
              Shared workspaces for research teams to curate paper lists together.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
