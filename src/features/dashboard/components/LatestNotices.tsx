import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Notice } from "../types/types";

export function LatestNotices({ notices }: { notices: Notice[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Notice Board</CardTitle>
          <CardDescription>Recently published announcements</CardDescription>
        </div>
        <Link
          href="/notices"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5 border-l border-line pl-5">
          {notices.map((n) => (
            <li key={n.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-indigo-500 ring-4 ring-indigo-50" />
              <div className="flex items-start justify-between gap-3">
                {n.href ? (
                  <Link href={n.href} className="text-sm font-semibold leading-snug text-fg hover:text-indigo-600">
                    {n.title}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold leading-snug text-fg">{n.title}</p>
                )}
                <Badge tone={n.category.tone} className="shrink-0">
                  {n.category.label}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {n.audience} · {n.postedAt}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
