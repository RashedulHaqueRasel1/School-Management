import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { STATUS_CONFIG } from "../constants";
import type { AdmissionStatus } from "../types/types";

/** Status pill. Paid (enrolled) applications show "Enrolled" — their status is final. */
export function AdmissionStatusBadge({ status, enrolled }: { status: AdmissionStatus; enrolled?: boolean }) {
  if (enrolled) {
    return (
      <Badge tone="success">
        <GraduationCap className="h-3 w-3" />
        Enrolled
      </Badge>
    );
  }
  const config = STATUS_CONFIG[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}
