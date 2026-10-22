"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, FileCheck2, Plus, RotateCcw, UserX, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACADEMIC_SESSION } from "@/features/admissions/constants";
import { toast } from "@/store/toast.store";

import { useStudents } from "../hooks/use-students";
import type { Student, StudentFilters } from "../types/types";
import { DEFAULT_STUDENT_FILTERS, exportStudentsCsv, filterStudents, studentHref } from "../utils";
import { StudentGrid } from "./StudentGrid";
import { StudentStats } from "./StudentStats";
import { StudentsTable } from "./StudentsTable";
import { StudentsToolbar, type StudentsViewMode } from "./StudentsToolbar";

const FLOW = [
  { icon: FileCheck2, label: "Application approved" },
  { icon: Wallet, label: "First fee payment" },
  { icon: CheckCircle2, label: "Listed here as a student" },
];

export function StudentsView() {
  const { students, hydrated } = useStudents();
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_STUDENT_FILTERS);
  const [view, setView] = useState<StudentsViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const filtered = useMemo(() => filterStudents(students, filters), [students, filters]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const sourceCounts = useMemo(() => {
    const base = filterStudents(students, { ...filters, source: "all" });
    return {
      all: base.length,
      admission: base.filter((s) => s.source === "admission").length,
      existing: base.filter((s) => s.source === "existing").length,
      left: filterStudents(students, { ...filters, source: "left" }).length,
    };
  }, [students, filters]);

  function changeFilters(patch: Partial<StudentFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  const router = useRouter();
  const openStudent = (s: Student) => router.push(studentHref(s));

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Students"
        description={`Everyone enrolled for the ${ACADEMIC_SESSION} session. New applicants join automatically once their admission fee payment is recorded.`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportStudentsCsv(filtered);
                toast("Export ready", { description: `${filtered.length} students downloaded as CSV.`, tone: "info" });
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/admissions/new-application" className={buttonStyles()}>
              <Plus className="h-4 w-4" />
              New Admission
            </Link>
          </>
        }
      />

      {hydrated ? <StudentStats students={students.filter((s) => s.status !== "left")} /> : <div className="h-[92px] animate-pulse rounded-2xl bg-soft" />}

      {/* How students get here */}
      <Card className="mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          {FLOW.map(({ icon: Icon, label }, i) => (
            <li key={label} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-subtle px-3 py-1.5 font-medium text-fg-secondary">
                <Icon className="h-4 w-4 text-indigo-500" />
                {label}
              </span>
              {i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-fg-subtle" />}
            </li>
          ))}
        </ol>
        <Link href="/admissions" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Go to admissions <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <StudentsToolbar
          filters={filters}
          onChange={changeFilters}
          view={view}
          onViewChange={setView}
          sourceCounts={sourceCounts}
          sections={[...new Set(students.map((s) => s.section))].sort()}
        />

        <div className="mt-4">
          {!hydrated ? (
            <div className="space-y-3 border-t border-line p-6" aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-soft" />
              ))}
            </div>
          ) : pageRows.length === 0 ? (
            <div className="border-t border-line">
              <EmptyState
                icon={UserX}
                title="No students found"
                description="Try a different search term or clear the filters."
                action={
                  <Button variant="outline" onClick={() => changeFilters(DEFAULT_STUDENT_FILTERS)}>
                    <RotateCcw className="h-4 w-4" />
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : view === "table" ? (
            <StudentsTable rows={pageRows} onOpen={openStudent} />
          ) : (
            <StudentGrid rows={pageRows} onOpen={openStudent} />
          )}
        </div>

        {hydrated && filtered.length > 0 && (
          <div className="border-t border-line px-5 py-4 sm:px-6">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              pageSizeOptions={[8, 12, 24, 48]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>

    </div>
  );
}
