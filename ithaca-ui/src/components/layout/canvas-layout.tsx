"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search,
  FolderOpen,
  Settings,
  Menu,
  Plus,
  ChevronLeft,
  LayoutDashboard,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { UserButton } from "@/components/auth/user-button";
import { CommandBar } from "@/components/command/command-bar";
import { useRouter } from "next/navigation";

interface CanvasLayoutProps {
  children: React.ReactNode;
}

export default function CanvasLayout({ children }: CanvasLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <CommandBar
        onSelectPaper={(id) => router.push(`/explore?nodeId=${id}`)}
        onAction={(action) => {
          if (action === "settings") router.push("/dashboard?tab=settings");
          // Add other global actions if needed
        }}
        hideTrigger
      />
      {/* Sidebar */}
      <aside
        className={`relative border-r border-border bg-muted/10 transition-[width] duration-300 ease-in-out flex flex-col ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header - Consistent with Public Layout */}
        <div className="h-14 border-b border-border flex items-center px-3 gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0"
          >
            <img
              src="/logo.svg"
              alt="Ithaca"
              className="size-8 shrink-0"
            />
            {!collapsed && (
              <span className="font-bold text-lg truncate">Ithaca</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
          >
            {collapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 pt-3">
          <Link href="/explore">
            <Button
              variant={pathname?.startsWith("/explore") ? "secondary" : "ghost"}
              className={`w-full justify-start gap-2 ${collapsed ? "px-2 justify-center" : ""}`}
            >
              <Search className="h-4 w-4 shrink-0" />
              {!collapsed && "Explore"}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant={
                pathname?.startsWith("/dashboard") ? "secondary" : "ghost"
              }
              className={`w-full justify-start gap-2 ${collapsed ? "px-2 justify-center" : ""}`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && "Dashboard"}
            </Button>
          </Link>
          <Link href="/projects">
            <Button
              variant={
                pathname?.startsWith("/projects") ? "secondary" : "ghost"
              }
              className={`w-full justify-start gap-2 ${collapsed ? "px-2 justify-center" : ""}`}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              {!collapsed && "Projects"}
            </Button>
          </Link>
          <Link href="/query">
            <Button
              variant={
                pathname?.startsWith("/query") ? "secondary" : "ghost"
              }
              className={`w-full justify-start gap-2 ${collapsed ? "px-2 justify-center" : ""}`}
            >
              <Filter className="h-4 w-4 shrink-0" />
              {!collapsed && "Query Builder"}
            </Button>
          </Link>
        </nav>
        {/* Footer Actions */}
        <div className="p-2 border-t border-border space-y-1">
          <Link href="/dashboard?tab=settings">
            <Button
              variant={
                pathname === "/dashboard" && pathname.includes("settings")
                  ? "secondary"
                  : "ghost"
              }
              className={`w-full justify-start gap-2 ${collapsed ? "px-2 justify-center" : ""}`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && "Settings"}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar - Consistent with Public Layout header height */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            {/* Global Search / Command Bar */}
            <div
              className="relative cursor-pointer"
              onClick={() =>
                window.dispatchEvent(new Event("open-command-bar"))
              }
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                readOnly
                type="text"
                placeholder="Search papers, authors, or topics... (⌘K)"
                className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-px h-6 bg-border" />
            <UserButton />
          </div>
        </header>

        {/* Viewport */}
        <main
          className={`flex-1 relative bg-muted/5 ${
            pathname?.startsWith("/explore")
              ? "overflow-hidden"
              : "overflow-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
