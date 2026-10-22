"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    // TODO (backend phase): replace with NextAuth `signIn("credentials", {...})`
    // and show an error message on failure.
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-[400px] animate-fade-up">
      <Logo subtitle="School Admin" className="mb-10 lg:hidden" />

      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Portal
        </span>
        <h1 className="mt-5 text-[28px] font-bold tracking-tight text-fg">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Sign in to your administrator account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@school.edu"
            required
            leftIcon={<Mail />}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="mb-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            leftIcon={<Lock />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle transition hover:bg-soft hover:text-fg-secondary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-fg-secondary">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-fg-subtle/50 accent-indigo-600"
          />
          Keep me signed in for 30 days
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="text-xs leading-relaxed text-fg-muted">
          This area is restricted to authorised school administrators. All
          sign-in activity is monitored and logged.
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-fg-subtle">
        Having trouble signing in?{" "}
        <a href="mailto:support@school.edu" className="font-semibold text-fg-secondary hover:text-fg">
          Contact IT support
        </a>
      </p>
    </div>
  );
}
