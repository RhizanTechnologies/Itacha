"use client";

import * as React from "react";
import { useState } from "react";
import { Mail, IdCard, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement magic link with Better Auth
      console.log("Sending magic link to:", email);
      setEmailSent(true);
    } catch (error) {
      console.error("Magic link error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "orcid") => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: provider,
        callbackURL: "/explore", // or wherever you successfully redirect
      });
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            Sign in to your workspace
          </DialogTitle>
          <DialogDescription>
            Access citation graphs, research networks, and collaborative tools.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-4">
          {/* ORCID Button (Primary for Researchers) */}
          <Button
            variant="outline"
            className="relative h-12 justify-center bg-muted hover:bg-orcid/10 hover:border-orcid transition-all"
            onClick={() => handleOAuthSignIn("orcid")}
            disabled={isLoading}
          >
            <IdCard className="absolute left-4 h-5 w-5 text-orcid" />
            <span className="font-bold">Sign in with ORCID</span>
            <span className="absolute right-3 bg-orcid text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Recommended
            </span>
          </Button>

          {/* Google Button */}
          <Button
            variant="outline"
            className="relative h-12 justify-center"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isLoading}
          >
            <Globe className="absolute left-4 h-5 w-5" />
            <span className="font-semibold">Sign in with Google</span>
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-border" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Or via email
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Magic Link Form */}
          {!emailSent ? (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="researcher@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="h-11 font-bold tracking-wide"
                disabled={isLoading}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? "Sending..." : "Send Magic Link"}
              </Button>
            </form>
          ) : (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm mb-1">Check your email!</p>
              <p className="text-xs text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setEmailSent(false)}
              >
                Use a different email
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="bg-muted/50 -mx-6 -mb-6 px-6 py-4 mt-4 text-center border-t">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to Ithaca's{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
