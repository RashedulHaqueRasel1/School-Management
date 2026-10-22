"use client";

import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate } from "@/features/admissions/utils";

import type { Student } from "../types/types";
import { FeeBadge, NewAdmissionBadge } from "./StudentBadges";

export function StudentsTable({ rows, onOpen }: { rows: Student[]; onOpen: (student: Student) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] whitespace-nowrap text-sm">
        <thead>
          <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            <th className="py-3 pl-5 pr-3 sm:pl-6">Student</th>
            <th className="px-3 py-3">Class</th>
            <th className="px-3 py-3 text-center">Roll</th>
            <th className="px-3 py-3">Guardian</th>
            <th className="px-3 py-3">Enrolled</th>
            <th className="py-3 pl-3 pr-5 sm:pr-6">Admission fee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((s) => (
            <tr key={s.id} onClick={() => onOpen(s)} className="cursor-pointer transition-colors hover:bg-subtle/70">
              <td className="py-3.5 pl-5 pr-3 sm:pl-6">
                <div className="flex items-center gap-3">
                  <StudentAvatar name={s.name} photo={s.photo} />
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-fg">
                      {s.name}
                      <NewAdmissionBadge student={s} />
                    </p>
                    <p className="font-mono text-xs text-fg-subtle">{s.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <span className="rounded-lg bg-soft px-2 py-1 text-xs font-semibold text-fg-secondary">
                  {s.className} · {s.section}
                </span>
              </td>
              <td className="px-3 py-3.5 text-center font-semibold tabular-nums text-fg">{s.roll}</td>
              <td className="px-3 py-3.5">
                <p className="font-medium text-fg-secondary">
                  {s.guardianName} <span className="text-xs font-normal text-fg-subtle">({s.guardianRelation})</span>
                </p>
                <p className="text-xs text-fg-subtle">{s.phone}</p>
              </td>
              <td className="px-3 py-3.5 text-fg-muted">{formatDate(s.enrolledOn)}</td>
              <td className="py-3.5 pl-3 pr-5 sm:pr-6">
                <FeeBadge student={s} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
