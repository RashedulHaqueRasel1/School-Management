"use client";

import { Phone } from "lucide-react";

import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";

import type { Student } from "../types/types";
import { FeeBadge, NewAdmissionBadge } from "./StudentBadges";

export function StudentGrid({ rows, onOpen }: { rows: Student[]; onOpen: (student: Student) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 border-t border-line p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 2xl:grid-cols-4">
      {rows.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s)}
          className="group relative flex flex-col items-center rounded-2xl border border-line bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
        >
          <span className="absolute right-3 top-3">
            <NewAdmissionBadge student={s} />
          </span>
          <StudentAvatar name={s.name} photo={s.photo} size="xl" className="h-20 w-20 rounded-full sm:h-20 sm:w-20 text-xl" />
          <p className="mt-3 font-semibold text-fg group-hover:text-indigo-600">{s.name}</p>
          <p className="font-mono text-xs text-fg-subtle">{s.id}</p>

          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <span className="rounded-lg bg-soft px-2 py-1 text-xs font-semibold text-fg-secondary">
              {s.className} · {s.section}
            </span>
            <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Roll {s.roll}</span>
          </div>

          <div className="mt-4 w-full border-t border-line pt-3 text-xs text-fg-muted">
            <p className="truncate font-medium text-fg-secondary">{s.guardianName}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1">
              <Phone className="h-3 w-3" />
              {s.phone}
            </p>
          </div>
          <div className="mt-3">
            <FeeBadge student={s} />
          </div>
        </button>
      ))}
    </div>
  );
}
