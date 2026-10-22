"use client";

import { useMemo } from "react";

import { localToday } from "@/features/students/demoData/profile-data";

import { demoTeachers, seedTeacherLeaves } from "../demoData/mock-data";
import { useTeacherAdminHydrated, useTeacherAdminStore } from "../store/teacher-admin.store";
import type { Teacher, TeacherLeave } from "../types/types";

/** All leave requests for one teacher (demo + admin-filed) with decisions applied. */
export function leavesFor(teacher: Teacher, created: TeacherLeave[], state: Record<string, Partial<TeacherLeave>>) {
  return [...created.filter((l) => l.teacherId === teacher.id), ...seedTeacherLeaves(teacher)]
    .map((l) => ({ ...l, ...state[l.id] }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Every teacher (demo + added) with admin edits applied, plus who is on
 * approved leave today. TODO (backend phase): GET /teachers
 */
export function useTeachers() {
  const hydrated = useTeacherAdminHydrated();
  const added = useTeacherAdminStore((s) => s.added);
  const details = useTeacherAdminStore((s) => s.details);
  const releases = useTeacherAdminStore((s) => s.releases);
  const leaveRequests = useTeacherAdminStore((s) => s.leaveRequests);
  const leaveState = useTeacherAdminStore((s) => s.leaveState);

  const teachers = useMemo<Teacher[]>(
    () =>
      [...demoTeachers, ...added].map((t) => ({
        ...t,
        ...details[t.id],
        status: releases[t.id] ? "left" : "active",
      })),
    [added, details, releases],
  );

  const onLeaveToday = useMemo(() => {
    // Dates are read on the client only (after hydration), never during prerender.
    if (!hydrated) return new Set<string>();
    const today = localToday();
    return new Set(
      teachers
        .filter((t) => t.status !== "left")
        .filter((t) => leavesFor(t, leaveRequests, leaveState).some((l) => l.status === "approved" && l.from <= today && l.to >= today))
        .map((t) => t.id),
    );
  }, [hydrated, teachers, leaveRequests, leaveState]);

  return { teachers, onLeaveToday, hydrated };
}
