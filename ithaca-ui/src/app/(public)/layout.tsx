"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { NavAuthButtons } from "@/components/auth/nav-auth-buttons";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <img src="/logo.svg" alt="Ithaca" className="size-8" />
            <h1 className="text-xl font-bold">Ithaca</h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              About
            </Link>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <NavAuthButtons />
            </div>
            <ThemeToggle />

            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="border-border bg-background animate-in slide-in-from-top-5 absolute right-0 left-0 border-t p-4 shadow-lg md:hidden">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/about"
                className="hover:bg-muted rounded-md px-4 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/blog"
                className="hover:bg-muted rounded-md px-4 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/docs"
                className="hover:bg-muted rounded-md px-4 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-border bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Ithaca" className="size-6" />
                <span className="font-bold">Ithaca</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Visualize the scientific conversation
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="mb-3 font-semibold">Product</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link
                    href="/explore"
                    className="hover:text-foreground transition-colors"
                  >
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="hover:text-foreground transition-colors"
                  >
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="mb-3 font-semibold">Resources</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="hover:text-foreground transition-colors"
                  >
                    API
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="hover:text-foreground transition-colors"
                  >
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="mb-3 font-semibold">Legal</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-border text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} Ithaca • Engineered by{" "}
              <Link
                href="/about"
                className="hover:text-foreground underline underline-offset-4"
              >
                Rhizan Tech
              </Link>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
