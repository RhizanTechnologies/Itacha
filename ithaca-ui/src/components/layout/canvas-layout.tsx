"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Network, 
  Search, 
  FolderOpen, 
  Settings, 
  Menu, 
  Plus,
  ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { UserButton } from "@/components/auth/user-button";

interface CanvasLayoutProps {
  children: React.ReactNode;
}

export default function CanvasLayout({ children }: CanvasLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`border-r border-border bg-muted/10 transition-all duration-300 flex flex-col ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between">
          {!collapsed && (
             <div className="flex items-center gap-2 font-bold text-lg">
                <div className="bg-primary/10 p-1 rounded">
                  <Network className="h-5 w-5 text-primary" />
                </div>
                Ithaca
             </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className={collapsed ? "mx-auto" : ""}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* New Project Button */}
        <div className="p-4">
           {collapsed ? (
             <Button size="icon" className="w-full">
               <Plus className="h-4 w-4" />
             </Button>
           ) : (
             <Button className="w-full gap-2">
               <Plus className="h-4 w-4" />
               New Project
             </Button>
           )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          <Link href="/explore">
            <Button 
              variant={pathname?.startsWith("/explore") ? "secondary" : "ghost"} 
              className={`w-full justify-start ${collapsed ? "px-2" : ""}`}
            >
              <Search className="h-4 w-4 mr-2" />
              {!collapsed && "Explore"}
            </Button>
          </Link>
          <Link href="/projects">
            <Button 
              variant={pathname?.startsWith("/projects") ? "secondary" : "ghost"}
              className={`w-full justify-start ${collapsed ? "px-2" : ""}`}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
               {!collapsed && "Projects"}
            </Button>
          </Link>
        </nav>

        {/* Footer Actions */}
        <div className="p-2 border-t border-border space-y-1">
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${collapsed ? "px-2" : ""}`}
            onClick={() => {}} // TODO: Settings modal
          >
            <Settings className="h-4 w-4 mr-2" />
            {!collapsed && "Settings"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
           <div className="w-full max-w-xl">
             {/* Global Search / Command Bar Placeholder */}
             <div className="relative">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <input 
                  type="text"
                  placeholder="Search papers, authors, or topics..." 
                  className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
               />
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             <ThemeToggle />
             <div className="w-px h-6 bg-border mx-2" />
             <UserButton />
           </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 relative overflow-hidden bg-muted/5">
          {children}
        </main>
      </div>
    </div>
  );
}
