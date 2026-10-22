import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { QuickAction } from "../types/types";

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Shortcuts to everyday tasks</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-subtle/50 px-2 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-card-hover"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                  action.accent,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-fg-secondary">{action.label}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
