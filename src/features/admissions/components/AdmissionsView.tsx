"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Plus, RotateCcw, SearchX, Trash2, X, XCircle } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/store/toast.store";

import { ACADEMIC_SESSION, DEFAULT_FILTERS, STATUSES } from "../constants";
import { useAdmissionsHydrated, useAdmissionsStore } from "../store/admissions.store";
import type { Admission, AdmissionFilters, AdmissionStatus } from "../types/types";
import { canDelete, exportAdmissionsCsv, filterAdmissions, isStatusLocked } from "../utils";
import { AdmissionStats } from "./AdmissionStats";
import { AdmissionsTable } from "./AdmissionsTable";
import { AdmissionsToolbar } from "./AdmissionsToolbar";
import { StatusUpdateDialog } from "./StatusUpdateDialog";

type StatusTarget = { admissions: Admission[]; status: AdmissionStatus };

export function AdmissionsView() {
  const hydrated = useAdmissionsHydrated();
  const admissions = useAdmissionsStore((s) => s.admissions);
  const remove = useAdmissionsStore((s) => s.remove);
  const reset = useAdmissionsStore((s) => s.reset);

  const [filters, setFilters] = useState<AdmissionFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const filtered = useMemo(() => filterAdmissions(admissions, filters), [admissions, filters]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Tab counts respect every filter except the status itself.
  const statusCounts = useMemo(() => {
    const base = filterAdmissions(admissions, { ...filters, status: "all" });
    const counts = { all: base.length } as Record<AdmissionStatus | "all", number>;
    for (const s of STATUSES) counts[s] = base.filter((a) => a.status === s).length;
    return counts;
  }, [admissions, filters]);

  const selectedRows = admissions.filter((a) => selected.has(a.id));

  function changeFilters(patch: Partial<AdmissionFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of pageRows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }

  /** Bulk status change — enrolled (paid) applications are final and get skipped. */
  function openBulkStatus(status: AdmissionStatus) {
    const changeable = selectedRows.filter((a) => !isStatusLocked(a));
    const locked = selectedRows.length - changeable.length;
    if (locked) {
      toast(`${locked} enrolled application${locked > 1 ? "s" : ""} skipped`, {
        description: "Paid applications are enrolled — their status can't be changed.",
        tone: "info",
      });
    }
    if (changeable.length) setStatusTarget({ admissions: changeable, status });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const targets = admissions.filter((a) => pendingDelete.includes(a.id));
    const deletable = targets.filter(canDelete);
    const skipped = targets.length - deletable.length;
    remove(deletable.map((a) => a.id));
    setSelected((prev) => new Set([...prev].filter((id) => !deletable.some((a) => a.id === id))));
    if (deletable.length) {
      toast(deletable.length === 1 ? "Application deleted" : `${deletable.length} applications deleted`, {
        description: deletable.length === 1 ? `${deletable[0]!.studentName}'s application was removed.` : undefined,
        tone: "info",
      });
    }
    if (skipped) {
      toast(`${skipped} application${skipped > 1 ? "s" : ""} kept`, {
        description: "Applications with payments can't be deleted — payment history is permanent.",
        tone: "error",
      });
    }
  }

  const deleteTargetName = pendingDelete?.length === 1 ? admissions.find((a) => a.id === pendingDelete[0])?.studentName : undefined;
  const lockedInDelete = pendingDelete ? admissions.filter((a) => pendingDelete.includes(a.id) && !canDelete(a)).length : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Admissions Management"
        description={`Review applications, approve enrolments and keep track of admission fees for the ${ACADEMIC_SESSION} session.`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(true)} title="Restore the original demo data">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset demo</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportAdmissionsCsv(filtered);
                toast("Export ready", { description: `${filtered.length} applications downloaded as CSV.`, tone: "info" });
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/admissions/new-application" className={buttonStyles()}>
              <Plus className="h-4 w-4" />
              New Application
            </Link>
          </>
        }
      />

      {hydrated ? <AdmissionStats admissions={admissions} /> : <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />}

      <Card className="mt-6 overflow-hidden">
        <AdmissionsToolbar filters={filters} onChange={changeFilters} statusCounts={statusCounts} />

        {/* Bulk actions */}
        {selectedRows.length > 0 && (
          <div className="mx-5 mt-4 flex animate-fade-in flex-wrap items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 sm:mx-6">
            <span className="mr-auto text-sm font-semibold text-indigo-700">{selectedRows.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => openBulkStatus("approved")}>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => openBulkStatus("rejected")}>
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingDelete(selectedRows.map((a) => a.id))} className="text-rose-600 dark:text-rose-400">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} aria-label="Clear selection">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="mt-4">
          {!hydrated ? (
            <div className="space-y-3 border-t border-line p-6" aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-soft" />
              ))}
            </div>
          ) : pageRows.length > 0 ? (
            <AdmissionsTable
              rows={pageRows}
              selected={selected}
              onToggle={toggleRow}
              onToggleAll={togglePage}
              onDelete={(a) => setPendingDelete([a.id])}
              onStatusChange={(a, status) => setStatusTarget({ admissions: [a], status })}
            />
          ) : (
            <div className="border-t border-line">
              <EmptyState
                icon={SearchX}
                title="No applications found"
                description="Try a different search term or clear the filters to see all applications."
                action={
                  <Button variant="outline" onClick={() => changeFilters(DEFAULT_FILTERS)}>
                    <RotateCcw className="h-4 w-4" />
                    Clear filters
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {hydrated && filtered.length > 0 && (
          <div className="border-t border-line px-5 py-4 sm:px-6">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>

      {statusTarget && (
        <StatusUpdateDialog
          key={`${statusTarget.status}-${statusTarget.admissions.map((a) => a.id).join(",")}`}
          admissions={statusTarget.admissions}
          status={statusTarget.status}
          onClose={() => {
            setStatusTarget(null);
            setSelected(new Set());
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete?.length === 1 ? "Delete this application?" : `Delete ${pendingDelete?.length ?? 0} applications?`}
        typeToConfirm={pendingDelete?.length === 1 ? pendingDelete[0] : `DELETE ${pendingDelete?.length ?? 0}`}
        description={
          deleteTargetName
            ? `${deleteTargetName}'s application will be permanently removed. This can't be undone.`
            : `The selected applications will be permanently removed. This can't be undone.${
                lockedInDelete ? ` ${lockedInDelete} of them have payments and will be kept.` : ""
              }`
        }
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          setSelected(new Set());
          changeFilters(DEFAULT_FILTERS);
          toast("Demo data restored", { tone: "info" });
        }}
        title="Reset demo data?"
        typeToConfirm="RESET"
        description="Demo only — all changes you made (applications, payments, status changes) are replaced with the original demo data. This button will not exist once the real backend is connected."
        confirmLabel="Reset"
      />
    </div>
  );
}
