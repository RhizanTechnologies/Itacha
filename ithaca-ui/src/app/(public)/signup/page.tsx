"use client";

import { Suspense, useState, useEffect } from "react";
import {
  Mail,
  Globe,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Password strength checker
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-green-600" };
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/explore";
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(callbackUrl);
    }
  }, [session, isPending, router, callbackUrl]);

  // Form state
  const [mode, setMode] = useState<"oauth" | "email">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const isFormValid = name && email && password.length >= 8 && passwordsMatch;

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is logged in, don't render the form (redirect will happen)
  if (session?.user) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Email/Password signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Better Auth email signup
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create account.");
        return;
      }

      // With requireEmailVerification: true, the user is created
      // but no session is established until they verify their email.
      // Show the "check your email" screen.
      setSuccess(true);
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (err) {
      setError("Failed to sign up with Google. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Mail className="size-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a verification link to{" "}
            <strong className="text-foreground">{email}</strong>. Click the link
            to verify your account and get started.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                try {
                  await authClient.sendVerificationEmail({
                    email,
                    callbackURL: "/verify-email",
                  });
                  setError(null);
                } catch (err) {
                  console.error("Resend verification error:", err);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Resend verification email
            </Button>
            <Link
              href="/signin"
              className="text-primary text-sm hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <img src="/logo.svg" alt="Ithaca" className="size-10" />
            <span className="text-2xl font-bold">Ithaca</span>
          </Link>
          <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">
            Join the research community exploring citation networks
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-card border-border rounded-xl border p-6 shadow-lg">
          {/* Mode Toggle */}
          <div className="mb-6 flex gap-2">
            <Button
              variant={mode === "oauth" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("oauth")}
            >
              Quick Sign Up
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
            <Button
              variant="outline"
              className="relative h-12 w-full justify-center"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
              ) : (
                <Globe className="absolute left-4 h-5 w-5" />
              )}
              <span className="font-semibold">Sign up with Google</span>
            </Button>
          ) : (
            <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-muted-foreground text-xs font-semibold uppercase">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-muted-foreground text-xs font-semibold uppercase">
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
                <label className="text-muted-foreground text-xs font-semibold uppercase">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
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

                {/* Password Strength */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Password strength:{" "}
                      <span className="font-medium">
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-muted-foreground text-xs font-semibold uppercase">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-destructive flex items-center gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 font-bold tracking-wide"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-muted-foreground mt-4 text-xs">
            By creating an account, you agree to Ithaca's{" "}
            <Link href="/terms" className="hover:text-foreground underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:text-foreground underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
