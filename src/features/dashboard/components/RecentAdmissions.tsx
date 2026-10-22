import Link from "next/link";
import { ArrowRight, MoreHorizontal } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Admission } from "../types/types";

export function RecentAdmissions({ admissions }: { admissions: Admission[] }) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Recent Admissions</CardTitle>
          <CardDescription>Latest applications submitted this week</CardDescription>
        </div>
        <Link
          href="/admissions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px] whitespace-nowrap text-sm">
          <thead>
            <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              <th className="px-6 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="hidden px-4 py-3 2xl:table-cell">Guardian</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {admissions.map((a) => (
              <tr key={a.id} className="transition hover:bg-subtle/70">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.name} />
                    <div>
                      <p className="font-semibold text-fg">{a.name}</p>
                      <p className="text-xs text-fg-subtle">{a.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-fg-secondary">{a.className}</td>
                <td className="hidden px-4 py-3.5 text-fg-muted 2xl:table-cell">{a.guardian}</td>
                <td className="px-4 py-3.5 text-fg-muted">{a.date}</td>
                <td className="px-4 py-3.5">
                  <Badge tone={a.status.tone} dot>
                    {a.status.label}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    aria-label={`Actions for ${a.name}`}
                    className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-soft hover:text-fg-secondary"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
