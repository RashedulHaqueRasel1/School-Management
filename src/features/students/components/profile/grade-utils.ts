import type { BadgeTone } from "@/components/ui/badge";

export function gradeTone(grade: string): BadgeTone {
  if (grade === "A+") return "success";
  if (grade === "A" || grade === "A-") return "info";
  if (grade === "B" || grade === "C") return "warning";
  if (grade === "F") return "danger";
  return "neutral";
}
