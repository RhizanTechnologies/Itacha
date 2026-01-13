"use client";

import { useState } from "react";
import { Mail, IdCard, Globe, Loader2, Eye, EyeOff, Lock, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Password strength checker
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
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
  const router = useRouter();
  
  // Form state
  const [mode, setMode] = useState<"oauth" | "email">("oauth");
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

  // Email/Password signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Better Auth email signup
      await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/explore",
      });
      
      setSuccess(true);
      // Redirect after brief success message
      setTimeout(() => router.push("/explore"), 1500);
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth signup
  const handleOAuthSignUp = async (provider: "google" | "orcid") => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: provider,
        callbackURL: "/explore",
      });
    } catch (err) {
      console.error(`${provider} sign-up error:`, err);
      setError(`Failed to sign up with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
          <p className="text-muted-foreground">Redirecting to your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="size-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold">Ithaca</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground">
            Join the research community exploring citation networks
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
            <div className="flex flex-col gap-4">
              {/* ORCID Button */}
              <Button
                variant="outline"
                className="relative h-12 justify-center bg-muted hover:bg-orcid/10 hover:border-orcid transition-all"
                onClick={() => handleOAuthSignUp("orcid")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
                ) : (
                  <IdCard className="absolute left-4 h-5 w-5 text-orcid" />
                )}
                <span className="font-bold">Sign up with ORCID</span>
                <span className="absolute right-3 bg-orcid text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Recommended
                </span>
              </Button>

              {/* Google Button */}
              <Button
                variant="outline"
                className="relative h-12 justify-center"
                onClick={() => handleOAuthSignUp("google")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
                ) : (
                  <Globe className="absolute left-4 h-5 w-5" />
                )}
                <span className="font-semibold">Sign up with Google</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
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
                <label className="text-xs font-semibold text-muted-foreground uppercase">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                            level <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
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
                  <p className="text-xs text-destructive flex items-center gap-1">
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
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            By creating an account, you agree to Ithaca's{" "}
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
