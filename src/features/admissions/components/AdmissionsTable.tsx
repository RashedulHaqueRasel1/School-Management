"use client";

import { useRouter } from "next/navigation";
import { Eye, Lock, Pencil, Trash2 } from "lucide-react";

import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { STATUS_CONFIG, STATUSES } from "../constants";
import type { Admission, AdmissionStatus } from "../types/types";
import { PAYMENT_STATUS_BADGE, admissionHref, canDelete, isStatusLocked, contactOf, dueAmount, formatDate, formatTaka, paymentStatusOf } from "../utils";
import { AdmissionStatusBadge } from "./AdmissionStatusBadge";
import { StudentAvatar } from "./StudentAvatar";

type AdmissionsTableProps = {
  rows: Admission[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onDelete: (admission: Admission) => void;
  onStatusChange: (admission: Admission, status: AdmissionStatus) => void;
};

export function AdmissionsTable({ rows, selected, onToggle, onToggleAll, onDelete, onStatusChange }: AdmissionsTableProps) {
  const router = useRouter();
  const selectedOnPage = rows.filter((r) => selected.has(r.id)).length;
  const allSelected = rows.length > 0 && selectedOnPage === rows.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] whitespace-nowrap text-sm">
        <thead>
          <tr className="border-y border-line bg-subtle/70 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            <th className="w-12 py-3 pl-5 sm:pl-6">
              <Checkbox
                aria-label="Select all on this page"
                checked={allSelected}
                indeterminate={!allSelected && selectedOnPage > 0}
                onCheckedChange={onToggleAll}
              />
            </th>
            <th className="px-3 py-3">Applicant</th>
            <th className="px-3 py-3">Class</th>
            <th className="px-3 py-3">Contact</th>
            <th className="px-3 py-3">Applied On</th>
            <th className="px-3 py-3">Admission Fee</th>
            <th className="px-3 py-3">Status</th>
            <th className="w-14 py-3 pr-5 sm:pr-6" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((a) => {
            const isSelected = selected.has(a.id);
            const contact = contactOf(a);
            const fee = paymentStatusOf(a);
            const href = admissionHref(a);
            const menu: ActionMenuItem[] = [
              { label: "View details", icon: Eye, onSelect: () => router.push(href) },
              { label: "Edit application", icon: Pencil, onSelect: () => router.push(`${href}/edit`) },
              { type: "separator" },
              ...(isStatusLocked(a)
                ? [{ label: "Status locked (enrolled)", icon: Lock, onSelect: () => {}, disabled: true }]
                : STATUSES.filter((s) => s !== "pending").map((s) => ({
                    label: STATUS_CONFIG[s].action,
                    icon: STATUS_CONFIG[s].icon,
                    onSelect: () => onStatusChange(a, s),
                    disabled: a.status === s,
                  }))),
              { type: "separator" },
              canDelete(a)
                ? { label: "Delete", icon: Trash2, onSelect: () => onDelete(a), danger: true }
                : { label: "Delete (has payments)", icon: Trash2, onSelect: () => {}, disabled: true },
            ];

            return (
              <tr
                key={a.id}
                onClick={() => router.push(href)}
                className={cn("cursor-pointer transition-colors", isSelected ? "bg-indigo-50/60" : "hover:bg-subtle/70")}
              >
                <td className="py-3.5 pl-5 sm:pl-6">
                  <Checkbox aria-label={`Select ${a.studentName}`} checked={isSelected} onCheckedChange={() => onToggle(a.id)} />
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={a.studentName} photo={a.photo} />
                    <div>
                      <p className="font-semibold text-fg">{a.studentName}</p>
                      <p className="text-xs text-fg-subtle">
                        {a.id} · {a.gender}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className="rounded-lg bg-soft px-2 py-1 text-xs font-semibold text-fg-secondary">{a.applyingClass}</span>
                </td>
                <td className="px-3 py-3.5">
                  <p className="font-medium text-fg-secondary">
                    {contact.name} <span className="text-xs font-normal text-fg-subtle">({contact.relation})</span>
                  </p>
                  <p className="text-xs text-fg-subtle">{contact.phone}</p>
                </td>
                <td className="px-3 py-3.5 text-fg-muted">{formatDate(a.appliedOn)}</td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-fg">{formatTaka(a.admissionFee)}</span>
                    <Badge tone={PAYMENT_STATUS_BADGE[fee].tone}>{PAYMENT_STATUS_BADGE[fee].label}</Badge>
                  </div>
                  {fee === "partial" && <p className="mt-0.5 text-[11px] text-fg-subtle">{formatTaka(dueAmount(a))} due</p>}
                </td>
                <td className="px-3 py-3.5">
                  <AdmissionStatusBadge status={a.status} enrolled={isStatusLocked(a)} />
                </td>
                <td className="py-3.5 pr-5 text-right sm:pr-6" onClick={(e) => e.stopPropagation()}>
                  <ActionMenu label={`Actions for ${a.studentName}`} items={menu} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
