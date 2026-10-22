/** Bare layout (no sidebar / header) for printable documents such as receipts. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-200 px-4 py-8 sm:py-12 dark:bg-slate-950 print:bg-white print:p-0">{children}</div>;
}
