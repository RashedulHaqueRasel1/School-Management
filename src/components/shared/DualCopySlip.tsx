import { Building2, GraduationCap, Scissors, UserRound } from "lucide-react";

import { SCHOOL_INFO } from "@/features/admissions/constants";
import { amountInWords, formatDateTime, formatTaka } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";

/*
 * One A4 page with two identical copies of a payment slip — the office keeps the
 * top half, the payer takes the bottom half (cut along the dashed line).
 * Fixed light colours so printing / "Save as PDF" looks the same in dark mode.
 */

export type SlipParty = { label: string; name: string; lines: React.ReactNode[] };
export type SlipItem = { description: React.ReactNode; detail?: React.ReactNode; amount: number };
export type SlipSummaryRow = { label: string; value: string; strong?: boolean; tone?: "ok" | "due" };

export type SlipData = {
  /** "Tuition Fee Slip", "Money Receipt", "Salary Payslip" */
  title: string;
  /** Reference rows under the title: [label, value]. */
  meta: [string, string][];
  parties: [SlipParty, SlipParty];
  items: SlipItem[];
  /** Header of the item table's first column. */
  itemsLabel?: string;
  totalLabel: string;
  total: number;
  /** Amount written in words (default: total) — e.g. net pay on a payslip. */
  inWords?: number;
  summary: SlipSummaryRow[];
  stamp: { label: string; tone: "ok" | "due" };
  note?: string;
  /** [name, role] — left: school side, right: payer / payee. */
  signatures: [[string, string], [string, string]];
  /** Name of the second copy: "Student copy", "Employee copy". */
  holderCopy: string;
  /** Reference quoted in the footer. */
  reference: string;
};

const COPY_STYLE = {
  office: { icon: Building2, ribbon: "bg-slate-900 text-white", stripe: "from-slate-700 via-slate-500 to-slate-700" },
  holder: { icon: UserRound, ribbon: "bg-emerald-600 text-white", stripe: "from-indigo-600 via-violet-600 to-fuchsia-500" },
} as const;

export function DualCopySlip({ data }: { data: SlipData }) {
  return (
    <article className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-lg bg-white text-slate-900 shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
      <SlipCopy data={data} copy="office" />
      <div className="relative flex items-center gap-3 px-6 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 print:py-0" aria-hidden>
        <Scissors className="h-3.5 w-3.5 shrink-0 -rotate-90" />
        <span className="h-0 flex-1 border-t-2 border-dashed border-slate-300" />
        <span>Cut here</span>
        <span className="h-0 flex-1 border-t-2 border-dashed border-slate-300" />
      </div>
      <SlipCopy data={data} copy="holder" />
    </article>
  );
}

function SlipCopy({ data: d, copy }: { data: SlipData; copy: "office" | "holder" }) {
  const style = COPY_STYLE[copy];
  const CopyIcon = style.icon;
  const label = copy === "office" ? "Office copy" : d.holderCopy;
  return (
    <section className="relative flex flex-col print:h-[134mm] print:overflow-hidden">
      <div className={cn("h-1.5 bg-linear-to-r print:[print-color-adjust:exact]", style.stripe)} />
      <div className="flex flex-1 flex-col px-6 pb-4 pt-4 sm:px-8 print:px-1">
        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white print:[print-color-adjust:exact]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">{SCHOOL_INFO.name}</h1>
              <p className="text-[10px] leading-snug text-slate-500">
                {SCHOOL_INFO.address}
                <br />
                {SCHOOL_INFO.phone} · EIIN {SCHOOL_INFO.eiin}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700 print:[print-color-adjust:exact]">{d.title}</span>
              <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] print:[print-color-adjust:exact]", style.ribbon)}>
                <CopyIcon className="h-3 w-3" />
                {label}
              </span>
            </div>
            <dl className="mt-1.5 space-y-0.5 text-[11px]">
              {d.meta.map(([k, v]) => (
                <div key={k} className="flex justify-end gap-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className={cn("font-semibold", /no\.$/i.test(k) && "font-mono")}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        {/* Parties */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {d.parties.map((p) => (
            <div key={p.label} className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">{p.label}</p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">{p.name}</p>
              {p.lines.map((line, i) => (
                <p key={i} className="text-[11px] leading-snug text-slate-600">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Items + summary */}
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-4">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500 print:[print-color-adjust:exact]">
                  <th className="px-3 py-1.5">{d.itemsLabel ?? "Description"}</th>
                  <th className="px-3 py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-1">
                      {item.description}
                      {item.detail && <span className="text-slate-500"> · {item.detail}</span>}
                    </td>
                    <td className="px-3 py-1 text-right tabular-nums">{formatTaka(item.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-slate-50 text-xs font-bold print:[print-color-adjust:exact]">
                  <td className="px-3 py-1.5">{d.totalLabel}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatTaka(d.total)}</td>
                </tr>
              </tbody>
            </table>
            <p className="border-t border-slate-200 px-3 py-1 text-[10px]">
              <span className="text-slate-500">In words: </span>
              <span className="font-semibold">{amountInWords(d.inWords ?? d.total)}</span>
            </p>
          </div>

          <div className="flex w-52 flex-col justify-between gap-2">
            <dl className="space-y-1 text-[11px]">
              {d.summary.map((row) => (
                <div
                  key={row.label}
                  className={cn(
                    "flex justify-between gap-3",
                    row.tone && "rounded-md px-2 py-1 print:[print-color-adjust:exact]",
                    row.tone === "ok" && "bg-emerald-50 text-emerald-800",
                    row.tone === "due" && "bg-amber-50 text-amber-800",
                  )}
                >
                  <dt className={row.strong || row.tone ? "font-semibold" : "text-slate-500"}>{row.label}</dt>
                  <dd className={cn("tabular-nums", (row.strong || row.tone) && "font-bold")}>{row.value}</dd>
                </div>
              ))}
            </dl>
            <span
              className={cn(
                "-rotate-6 self-center rounded-md border-[2.5px] px-3 py-1 text-sm font-black uppercase tracking-[0.2em] print:[print-color-adjust:exact]",
                d.stamp.tone === "ok" ? "border-emerald-600 text-emerald-600" : "border-amber-500 text-amber-600",
              )}
            >
              {d.stamp.label}
            </span>
          </div>
        </div>

        {d.note && <p className="mt-2 text-[10px] text-slate-600">Note: {d.note}</p>}

        {/* Signatures */}
        <div className="mt-auto grid grid-cols-2 gap-10 pt-6 text-[11px] print:pt-3">
          {d.signatures.map(([name, role], i) => (
            <div key={role} className={i === 1 ? "text-right" : undefined}>
              <div className="h-px bg-slate-400" />
              <p className="mt-1 font-semibold">{name}</p>
              <p className="text-[10px] text-slate-500">{role}</p>
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-[9px] text-slate-400">
          {label} · computer-generated — quote {d.reference} for any query · {formatDateTime(new Date().toISOString())} · {SCHOOL_INFO.website}
        </p>
      </div>
    </section>
  );
}
