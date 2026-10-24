"use client";

import { useCallback, useMemo } from "react";

import { hash, localToday, seeded } from "@/features/students/demoData/profile-data";
import { useStudents } from "@/features/students/hooks/use-students";
import { useTeachers } from "@/features/teachers/hooks/use-teachers";

import { demoNotices } from "../demoData/mock-data";
import { useNoticeAdminHydrated, useNoticeAdminStore } from "../store/notice-admin.store";
import type { Notice, NoticeStatus } from "../types/types";
import { noticeStatus, nowIso } from "../utils";

const STATUS_ORDER: Record<NoticeStatus, number> = { published: 0, scheduled: 1, draft: 2, expired: 3, archived: 4 };

export type Reach = { students: number; parents: number; teachers: number; total: number; phones: number };

export type NoticeView = Notice & {
  status: NoticeStatus;
  reach: Reach;
  /** Opened on the portal (demo: grows with age). */
  seen: number;
};

/**
 * The notice board (demo + admin notices) with status, who it reaches and
 * how many have seen it. TODO (backend phase): GET /notices?withStats=1
 */
export function useNotices() {
  const ready = useNoticeAdminHydrated();
  const { students, hydrated: studentsReady } = useStudents();
  const { teachers, hydrated: teachersReady } = useTeachers();
  const added = useNoticeAdminStore((s) => s.added);
  const edits = useNoticeAdminStore((s) => s.edits);
  const deleted = useNoticeAdminStore((s) => s.deleted);
  const hydrated = ready && studentsReady && teachersReady;
  // Read when the notices change (not every render), so a notice published "now" shows as published.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => (hydrated ? nowIso() : ""), [hydrated, added, edits]);

  const reachOf = useCallback(
    (n: Pick<Notice, "groups" | "classes">): Reach => {
      const kids = students.filter((s) => s.status !== "left" && (!n.classes.length || n.classes.includes(s.className)));
      const studentsN = n.groups.includes("students") ? kids.length : 0;
      const parentsN = n.groups.includes("parents") ? new Set(kids.map((s) => s.phone || s.guardianName)).size : 0;
      const teachersN = n.groups.includes("teachers") ? teachers.filter((t) => t.status !== "left").length : 0;
      // SMS goes to guardians (students share the guardian's phone) and teachers.
      const phones = (n.groups.includes("parents") || n.groups.includes("students") ? new Set(kids.map((s) => s.phone).filter(Boolean)).size : 0) + teachersN;
      return { students: studentsN, parents: parentsN, teachers: teachersN, total: studentsN + parentsN + teachersN, phones };
    },
    [students, teachers],
  );

  const notices = useMemo<NoticeView[]>(() => {
    if (!hydrated) return [];
    return [...added, ...demoNotices(localToday()).map((n) => ({ ...n, ...edits[n.id] }))]
      .filter((n) => !deleted.includes(n.id))
      .map((n) => {
        const status = noticeStatus(n, now);
        const reach = reachOf(n);
        let seen = 0;
        if (n.publishAt && (status === "published" || status === "expired" || status === "archived")) {
          const hours = (Date.parse(now) - Date.parse(n.publishAt)) / 3_600_000;
          const rate = Math.min(0.96, 0.15 + Math.log10(1 + hours) * 0.3 + seeded(hash(n.id))() * 0.08);
          seen = Math.round(reach.total * rate);
        }
        return { ...n, status, reach, seen };
      })
      // Pinned, then live notices first; newest first within each group.
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.publishAt ?? b.updatedAt).localeCompare(a.publishAt ?? a.updatedAt));
  }, [hydrated, added, edits, deleted, reachOf, now]);

  return { notices, hydrated, now, reachOf, students, teachers };
}
