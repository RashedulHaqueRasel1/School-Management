import type { AttendanceDay } from "@/features/students/types/types";

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

/** Present + late over school days, for the days given (up to today). */
export function attendanceRate(days: AttendanceDay[], today: string) {
  let school = 0;
  let here = 0;
  for (const d of days) {
    if (d.date > today) continue;
    if (d.status === "present" || d.status === "late") here++;
    if (d.status === "present" || d.status === "late" || d.status === "absent" || d.status === "leave") school++;
  }
  return { rate: pct(here, school), school, here };
}

/** Months of the session up to today: ["2026-01", …]. */
export function monthsToDate(today: string) {
  const months: string[] = [];
  for (let m = 1; m <= Number(today.slice(5, 7)); m++) months.push(`${today.slice(0, 4)}-${String(m).padStart(2, "0")}`);
  return months;
}

export function downloadCsv(rows: (string | number)[][], fileName: string) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
