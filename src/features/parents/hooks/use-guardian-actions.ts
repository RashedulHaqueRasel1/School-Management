"use client";

import { normalizePhone } from "@/features/admissions/utils";
import { useStudentAdminStore } from "@/features/students/store/student-admin.store";
import type { GuardianInfo, Student } from "@/features/students/types/types";

import { useParentAdminStore } from "../store/parent-admin.store";
import type { GuardianRole, Parent, ParentLink } from "../types/types";

const ROLE_ORDER: GuardianRole[] = ["Father", "Mother", "Local guardian"];
const sortGuardians = (list: GuardianInfo[]) => [...list].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

export type GuardianPatch = Partial<Pick<GuardianInfo, "name" | "phone" | "email" | "occupation" | "nid">>;

/**
 * Guardian changes are written to every linked student's guardian list, so the
 * student profiles, SMS recipients and this module stay in sync.
 * BACKEND: PATCH /parents/:id · POST/DELETE /parents/:id/children/:studentId
 */
export function useGuardianActions() {
  const setGuardians = useStudentAdminStore((s) => s.setGuardians);
  const log = useParentAdminStore((s) => s.log);
  const rekey = useParentAdminStore((s) => s.rekey);

  const isMe = (parent: Pick<Parent, "key">) => (g: GuardianInfo) => normalizePhone(g.phone) === parent.key;

  return {
    /** Edit name, mobile, email… on every child at once. */
    update(parent: Parent, patch: GuardianPatch, changed: string[]) {
      for (const link of parent.links) {
        setGuardians(link.student.id, link.guardians.map((g) => (isMe(parent)(g) ? { ...g, ...patch } : g)), `Guardian edited from Parents (${link.role})`);
      }
      const nextKey = patch.phone ? normalizePhone(patch.phone) : parent.key;
      if (nextKey !== parent.key) rekey(parent.key, nextKey);
      log(nextKey, "profile", "Guardian details edited", changed.join(", "));
    },

    /** Add this guardian to a child in the given role (replaces whoever held that role). */
    link(parent: Pick<Parent, "key" | "name" | "phone" | "email" | "occupation" | "nid">, student: Student, current: GuardianInfo[], role: GuardianRole, relation: string, primary: boolean) {
      const me: GuardianInfo = { role, relation, name: parent.name, phone: parent.phone, email: parent.email, occupation: parent.occupation, nid: parent.nid, isPrimary: primary };
      const replaced = current.find((g) => g.role === role && !isMe(parent)(g));
      let next = current.filter((g) => g.role !== role && !isMe(parent)(g));
      if (primary) next = next.map((g) => ({ ...g, isPrimary: false }));
      next = sortGuardians([...next, me]);
      if (!next.some((g) => g.isPrimary)) next = next.map((g) => (g === me ? { ...g, isPrimary: true } : g));
      setGuardians(student.id, next, `${role} linked: ${parent.name}${replaced ? ` (replaced ${replaced.name})` : ""}`);
      log(parent.key, "children", "Child linked", `${student.name} (${student.id}) as ${role.toLowerCase()}${primary ? " · primary contact" : ""}`);
    },

    /** Remove the guardian from one child. A child always keeps at least one guardian. */
    unlink(parent: Parent, link: ParentLink, reason: string) {
      const rest = link.guardians.filter((g) => !isMe(parent)(g));
      if (rest.length === 0) return false;
      const next = link.isPrimary ? rest.map((g, i) => ({ ...g, isPrimary: i === 0 })) : rest;
      setGuardians(link.student.id, next, `${link.role} unlinked: ${parent.name}`);
      log(parent.key, "children", "Child unlinked", `${link.student.name} (${link.student.id}) · ${reason}`);
      return true;
    },

    /** Make this guardian the child's primary contact (gets all SMS / email). */
    makePrimary(parent: Parent, link: ParentLink) {
      setGuardians(link.student.id, link.guardians.map((g) => ({ ...g, isPrimary: isMe(parent)(g) })), `Primary contact → ${parent.name}`);
      log(parent.key, "children", "Set as primary contact", `${link.student.name} (${link.student.id})`);
    },
  };
}
