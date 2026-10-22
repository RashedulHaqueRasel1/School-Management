import { LogOut, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatTaka } from "@/features/admissions/utils";

import type { Student } from "../types/types";

export function NewAdmissionBadge({ student }: { student: Student }) {
  if (student.status === "left") {
    return (
      <Badge tone="neutral">
        <LogOut className="h-3 w-3" />
        Left · TC issued
      </Badge>
    );
  }
  if (student.source !== "admission") return null;
  return (
    <Badge tone="violet">
      <Sparkles className="h-3 w-3" />
      New
    </Badge>
  );
}

export function FeeBadge({ student }: { student: Student }) {
  return student.feeDue > 0 ? (
    <Badge tone="warning" dot>
      {formatTaka(student.feeDue)} due
    </Badge>
  ) : (
    <Badge tone="success" dot>
      Clear
    </Badge>
  );
}
