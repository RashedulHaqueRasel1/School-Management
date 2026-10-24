"use client";

import { formatDate } from "@/features/admissions/utils";
import { PaperSheet, PrintNotFound, PrintSkeleton, PrintToolbar, SchoolLetterhead, usePrintTitle } from "@/features/students/components/print/PrintShell";

import { useNotices } from "../../hooks/use-notices";
import { audienceLabel, noticeHref } from "../../utils";

/** Official printable notice (for the physical notice board), e.g. /notice-print/annual-exam-routine-published */
export function NoticePrint({ slug }: { slug: string }) {
  const { notices, hydrated } = useNotices();
  const n = notices.find((x) => x.slug === slug);
  usePrintTitle(n ? `Notice - ${n.title}` : null);

  if (!hydrated) return <PrintSkeleton />;
  if (!n) return <PrintNotFound title="Notice not found" text="It may have been deleted." />;

  return (
    <>
      <PrintToolbar backHref={noticeHref(n)} backLabel="Back to notice" title={`Notice - ${n.title}`} />
      <PaperSheet>
        <SchoolLetterhead
          badge="Notice"
          meta={[
            ["Ref.", n.id],
            ["Date", n.publishAt ? formatDate(n.publishAt.slice(0, 10)) : "Draft"],
          ]}
        />
        <div className="my-8 h-px bg-slate-200" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {n.category} · To: {audienceLabel(n)}
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-snug tracking-tight">{n.title}</h2>
        {n.priority !== "normal" && (
          <p className="mt-2 inline-block rounded-md border-2 border-rose-500 px-2 py-0.5 text-xs font-black uppercase tracking-[0.2em] text-rose-600">{n.priority === "urgent" ? "Urgent" : "Important"}</p>
        )}
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-700">
          {n.body.split(/\n\s*\n/).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
        {n.attachment && <p className="mt-6 text-sm text-slate-500">Attachment: {n.attachment.name} (on the school portal)</p>}
        <div className="mt-20 flex justify-end">
          <div className="w-56 text-center text-sm">
            <div className="h-px bg-slate-400" />
            <p className="mt-2 font-semibold">Head Teacher</p>
            <p className="text-xs text-slate-500">{n.createdBy}</p>
          </div>
        </div>
      </PaperSheet>
    </>
  );
}
