"use client";

import { Suspense, useState, useEffect } from "react";
import { Globe, Loader2, Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/explore";
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(callbackUrl);
    }
  }, [session, isPending, router, callbackUrl]);

  const [mode, setMode] = useState<"oauth" | "email">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending || session?.user) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleEmailSignIn = async (
    event?: React.FormEvent,
    overrideEmail?: string,
    overridePass?: string,
  ) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);

    const targetEmail = (overrideEmail ?? email).trim();
    const targetPassword = (overridePass ?? password).trim();

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: targetEmail,
        password: targetPassword,
        callbackURL: callbackUrl,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password.");
        return;
      }

      router.push(callbackUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <img src="/logo.svg" alt="Ithaca" className="size-10" />
            <span className="text-2xl font-bold">Ithaca</span>
          </Link>
          <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to access your research workspace
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-card border-border rounded-xl border p-6 shadow-lg">
          <div className="mb-6 flex gap-2">
            <Button
              variant={mode === "email" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("email")}
            >
              Email & Password
            </Button>
            <Button
              variant={mode === "oauth" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("oauth")}
            >
              Google
            </Button>
          </div>

          {mode === "oauth" ? (
            <Button
              variant="outline"
              className="relative h-12 w-full justify-center"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
              ) : (
                <Globe className="absolute left-4 h-5 w-5" />
              )}
              <span className="font-semibold">Sign in with Google</span>
            </Button>
          ) : (
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-muted-foreground text-xs font-semibold uppercase">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="researcher@university.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-muted-foreground text-xs font-semibold uppercase">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-primary text-xs hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
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

          {/* Quick Demo Access Buttons */}
          <div className="border-border mt-6 border-t pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                ⚡ Demo Quick Sign-In
              </span>
              <span className="text-muted-foreground text-[11px]">
                Click to auto-fill & login
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setEmail("pilot-owner@ithaca.test");
                  setPassword("PilotPass123!");
                  handleEmailSignIn(
                    undefined,
                    "pilot-owner@ithaca.test",
                    "PilotPass123!",
                  );
                }}
                className="border-border/80 bg-muted/40 hover:bg-muted hover:border-primary/50 flex cursor-pointer flex-col items-start rounded-lg border p-2.5 text-left transition disabled:opacity-50"
              >
                <span className="text-foreground text-xs font-semibold">
                  👑 Pilot Owner
                </span>
                <span className="text-muted-foreground text-[10px]">
                  PI / Full Lab Admin
                </span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setEmail("pilot-viewer@ithaca.test");
                  setPassword("PilotPass123!");
                  handleEmailSignIn(
                    undefined,
                    "pilot-viewer@ithaca.test",
                    "PilotPass123!",
                  );
                }}
                className="border-border/80 bg-muted/40 hover:bg-muted hover:border-primary/50 flex cursor-pointer flex-col items-start rounded-lg border p-2.5 text-left transition disabled:opacity-50"
              >
                <span className="text-foreground text-xs font-semibold">
                  👁️ Pilot Viewer
                </span>
                <span className="text-muted-foreground text-[10px]">
                  Read-Only Researcher
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${callbackUrl !== "/explore" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
