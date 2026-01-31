"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  IdCard,
  Globe,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect authenticated users to explore
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/explore");
    }
  }, [session, isPending, router]);

  // Form state
  const [mode, setMode] = useState<"oauth" | "email">("oauth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If user is logged in, don't render the form (redirect will happen)
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Email/Password signin
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/explore",
      });
      router.push("/explore");
    } catch (err) {
      console.error("Signin error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth signin
  const handleOAuthSignIn = async (provider: "google" | "orcid") => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: provider,
        callbackURL: "/explore",
      });
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src="/logo.svg"
              alt="Ithaca"
              className="size-10"
            />
            <span className="text-2xl font-bold">Ithaca</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to access your research workspace
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === "oauth" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("oauth")}
            >
              Quick Sign In
            </Button>
            <Button
              variant={mode === "email" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("email")}
            >
              Email & Password
            </Button>
          </div>

          {mode === "oauth" ? (
            <div className="flex flex-col gap-4">
              {/* ORCID Button */}
              <Button
                variant="outline"
                className="relative h-12 justify-center bg-muted hover:bg-orcid/10 hover:border-orcid transition-all"
                onClick={() => handleOAuthSignIn("orcid")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
                ) : (
                  <IdCard className="absolute left-4 h-5 w-5 text-orcid" />
                )}
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
                {isLoading ? (
                  <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
                ) : (
                  <Globe className="absolute left-4 h-5 w-5" />
                )}
                <span className="font-semibold">Sign in with Google</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
              {/* Email */}
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

              {/* Password */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 font-bold tracking-wide"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            By continuing, you agree to Ithaca's{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
