"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileSearch, GraduationCap, Printer } from "lucide-react";

import { SCHOOL_INFO } from "@/features/admissions/constants";

/*
 * Shared frame for printable student documents (tuition slips, TC).
 * Fixed light colours so printing / "Save as PDF" looks the same in dark mode.
 */

export function usePrintTitle(title: string | null) {
  // Open the print dialog straight away when asked to (?print=1).
  useEffect(() => {
    if (!title || new URLSearchParams(window.location.search).get("print") !== "1") return;
    const timer = setTimeout(() => {
      document.title = title;
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, [title]);
}

export function PrintToolbar({ backHref, backLabel, title }: { backHref: string; backLabel: string; title: string }) {
  return (
    <div className="mx-auto mb-6 flex w-full max-w-[210mm] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-slate-500 md:block dark:text-slate-400">Choose “Save as PDF” as the printer to share it digitally.</p>
        <button
          type="button"
          onClick={() => {
            // The browser uses the document title as the default PDF file name.
            document.title = title;
            window.print();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-b from-indigo-500 to-indigo-600 px-4 text-sm font-semibold text-white shadow-glow transition hover:from-indigo-500 hover:to-indigo-500"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

export function SchoolLetterhead({ badge, meta }: { badge: string; meta: [string, string][] }) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white print:[print-color-adjust:exact]">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{SCHOOL_INFO.name}</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {SCHOOL_INFO.address}
            <br />
            {SCHOOL_INFO.phone} · {SCHOOL_INFO.email}
            <br />
            EIIN {SCHOOL_INFO.eiin} · {SCHOOL_INFO.website}
          </p>
        </div>
      </div>
      <div className="sm:text-right">
        <p className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white print:[print-color-adjust:exact]">{badge}</p>
        <dl className="mt-3 space-y-0.5 text-sm">
          {meta.map(([label, value]) => (
            <div key={label} className="flex gap-2 sm:justify-end">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

export function PaperSheet({ children }: { children: React.ReactNode }) {
  return (
    <article className="relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-lg bg-white text-slate-900 shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
      <div className="h-2 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-500 print:[print-color-adjust:exact]" />
      <div className="p-8 sm:p-12 print:p-0 print:pt-6">{children}</div>
    </article>
  );
}

export function PrintNotFound({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-10 text-center shadow-lg">
      <FileSearch className="mx-auto h-10 w-10 text-slate-400" />
      <h1 className="mt-4 text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      <Link href="/students" className="mt-6 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">
        Back to students
      </Link>
    </div>
  );
}

export function PrintSkeleton() {
  return <div className="mx-auto h-[297mm] w-full max-w-[210mm] animate-pulse rounded-lg bg-white/60" aria-busy="true" />;
}
