import type { Metadata } from "next";

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Admin Sign in" };

export default function LoginPage() {
  return (
    <>
      <AuthShowcase />
      <div className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div aria-hidden className="absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_60%)]" />
        <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />
        <div className="relative w-full max-w-[400px]">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
