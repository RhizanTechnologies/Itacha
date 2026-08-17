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
  ChevronLeft,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { UserButton } from "@/components/auth/user-button";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { SupportContact } from "@/components/organization/support-contact";

interface CanvasLayoutProps {
  children: React.ReactNode;
}

export default function CanvasLayout({ children }: CanvasLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`border-border bg-muted/10 relative flex flex-col border-r transition-[width] duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header - Consistent with Public Layout */}
        <div className="border-border flex h-14 items-center gap-2 border-b px-3">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src="/logo.svg" alt="Ithaca" className="size-8 shrink-0" />
            {!collapsed && (
              <span className="truncate text-lg font-bold">Ithaca</span>
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
        <nav className="flex-1 space-y-1 px-2 pt-3">
          <Link href="/explore">
            <Button
              variant={pathname?.startsWith("/explore") ? "secondary" : "ghost"}
              className={`w-full justify-start gap-2 ${collapsed ? "justify-center px-2" : ""}`}
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
              className={`w-full justify-start gap-2 ${collapsed ? "justify-center px-2" : ""}`}
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
              className={`w-full justify-start gap-2 ${collapsed ? "justify-center px-2" : ""}`}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              {!collapsed && "Projects"}
            </Button>
          </Link>
          <Link href="/admin">
            <Button
              variant={pathname?.startsWith("/admin") ? "secondary" : "ghost"}
              className={`w-full justify-start gap-2 ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {!collapsed && "Organization"}
            </Button>
          </Link>
        </nav>
        {!collapsed && <OrganizationSwitcher />}
        {/* Footer Actions */}
        <div className="border-border space-y-1 border-t p-2">
          <SupportContact collapsed={collapsed} />
          <Link href="/dashboard?tab=settings">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && "Settings"}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar - Consistent with Public Layout header height */}
        <header className="border-border bg-background/80 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            {/* Global Search / Command Bar */}
            <div
              className="relative cursor-pointer"
              onClick={() =>
                window.dispatchEvent(new Event("open-command-bar"))
              }
            >
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <input
                readOnly
                type="text"
                placeholder="Search papers, authors, or topics... (⌘K)"
                className="border-input bg-muted/50 focus:ring-ring h-9 w-full cursor-pointer rounded-md border pr-4 pl-9 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="bg-border h-6 w-px" />
            <UserButton />
          </div>
        </header>

        {/* Viewport */}
        <main
          className={`bg-muted/5 relative flex-1 ${
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
