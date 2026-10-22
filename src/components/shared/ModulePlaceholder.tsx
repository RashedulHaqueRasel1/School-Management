"use client";

import { usePathname } from "next/navigation";
import { Download, LayoutGrid, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { findNavItem } from "@/lib/navigation";

import { PageHeader } from "./PageHeader";

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

/** Temporary page body for modules whose UI hasn't been built yet. */
export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  const Icon = findNavItem(usePathname())?.icon ?? LayoutGrid;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button disabled>
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </>
        }
      />

      <Card className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="relative flex flex-col items-center px-6 py-20 text-center sm:py-24">
          <div className="relative mb-6">
            <div aria-hidden className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
              <Icon className="h-7 w-7" />
            </div>
          </div>
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">
            <Sparkles className="h-3.5 w-3.5" />
            Coming soon
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-fg">
            {title} is being crafted
          </h2>
          <p className="mt-2 max-w-md text-sm text-fg-muted">
            The layout is ready. This module&apos;s screens will be designed next
            and connected to the backend once the API is available.
          </p>

          {/* Skeleton preview of the future table */}
          <div className="mt-10 w-full max-w-2xl space-y-2.5">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface/80 px-4 py-3"
                style={{ opacity: 1 - row * 0.28 }}
              >
                <div className="h-8 w-8 rounded-full bg-soft" />
                <div className="h-2.5 w-32 rounded-full bg-soft" />
                <div className="ml-auto hidden h-2.5 w-20 rounded-full bg-soft sm:block" />
                <div className="h-5 w-16 rounded-full bg-indigo-50" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}
