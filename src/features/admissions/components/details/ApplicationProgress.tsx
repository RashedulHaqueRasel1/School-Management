import { Check, Eye, FileCheck2, GraduationCap, Hourglass, Wallet, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Admission } from "../../types/types";
import { enrolledOn, formatDate, paymentStatusOf } from "../../utils";

type StepState = "done" | "current" | "upcoming" | "warning" | "error" | "skipped";

type Step = { label: string; detail: string; state: StepState; icon: typeof Check };

function lastStatusDate(a: Admission, statuses: string[]) {
  const event = a.history.find((e) => e.type === "status" && e.status && statuses.includes(e.status));
  return event ? formatDate(event.at.slice(0, 10)) : "";
}

/** Same 5-step journey the guardian will see when tracking the application. */
export function buildSteps(a: Admission): Step[] {
  const fee = paymentStatusOf(a);
  const reviewDate = lastStatusDate(a, ["in_review"]);
  const decisionDate = lastStatusDate(a, ["approved", "waitlisted", "rejected"]);
  const submitted: Step = { label: "Submitted", detail: formatDate(a.appliedOn), state: "done", icon: FileCheck2 };

  switch (a.status) {
    case "pending":
      return [
        submitted,
        { label: "Under review", detail: "Waiting for the office", state: "current", icon: Eye },
        { label: "Decision", detail: "Not yet", state: "upcoming", icon: Check },
        { label: "Admission fee", detail: "After approval", state: "upcoming", icon: Wallet },
        { label: "Enrolled", detail: "Final step", state: "upcoming", icon: GraduationCap },
      ];
    case "in_review":
      return [
        submitted,
        { label: "Under review", detail: reviewDate ? `Since ${reviewDate}` : "In progress", state: "current", icon: Eye },
        { label: "Decision", detail: "Not yet", state: "upcoming", icon: Check },
        { label: "Admission fee", detail: "After approval", state: "upcoming", icon: Wallet },
        { label: "Enrolled", detail: "Final step", state: "upcoming", icon: GraduationCap },
      ];
    case "waitlisted":
      return [
        submitted,
        { label: "Reviewed", detail: reviewDate || "Done", state: "done", icon: Eye },
        { label: "Waitlisted", detail: decisionDate || "Waiting for a seat", state: "warning", icon: Hourglass },
        { label: "Admission fee", detail: "After approval", state: "upcoming", icon: Wallet },
        { label: "Enrolled", detail: "Final step", state: "upcoming", icon: GraduationCap },
      ];
    case "rejected":
      return [
        submitted,
        { label: "Reviewed", detail: reviewDate || "Done", state: "done", icon: Eye },
        { label: "Not accepted", detail: decisionDate || "Closed", state: "error", icon: X },
        { label: "Admission fee", detail: "Not required", state: "skipped", icon: Wallet },
        { label: "Enrolled", detail: "—", state: "skipped", icon: GraduationCap },
      ];
    case "approved": {
      const started = a.payments.length > 0;
      return [
        submitted,
        { label: "Reviewed", detail: reviewDate || "Done", state: "done", icon: Eye },
        { label: "Approved", detail: decisionDate || "Done", state: "done", icon: Check },
        {
          label: "Admission fee",
          detail: fee === "paid" ? "Fully paid" : fee === "partial" ? "Partially paid" : "Payment due",
          state: fee === "paid" ? "done" : "current",
          icon: Wallet,
        },
        {
          label: "Enrolled",
          detail: started ? `Student since ${formatDate(enrolledOn(a)!)}` : "After first payment",
          state: started ? "done" : "upcoming",
          icon: GraduationCap,
        },
      ];
    }
  }
}

const circle: Record<StepState, string> = {
  done: "bg-emerald-500 text-white",
  current: "bg-indigo-600 text-white ring-4 ring-indigo-500/20",
  upcoming: "bg-soft text-fg-subtle",
  warning: "bg-violet-500 text-white ring-4 ring-violet-500/20",
  error: "bg-rose-500 text-white ring-4 ring-rose-500/20",
  skipped: "bg-soft text-fg-subtle opacity-50",
};

export function ApplicationProgress({ admission }: { admission: Admission }) {
  const steps = buildSteps(admission);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Application progress</h2>
          <p className="mt-0.5 text-xs text-fg-muted">The guardian sees this same tracker when they check the application online.</p>
        </div>
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-0">
        {steps.map((step, i) => {
          const Icon = step.state === "done" ? Check : step.icon;
          const next = steps[i + 1];
          return (
            <li key={step.label} className="relative flex items-center gap-3 sm:flex-col sm:text-center">
              {/* connector */}
              {next && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-0.5 sm:left-[calc(50%+24px)] sm:top-5 sm:h-0.5 sm:w-[calc(100%-48px)]",
                    step.state === "done" ? "bg-emerald-500" : "bg-line-strong",
                  )}
                />
              )}
              <span className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition", circle[step.state])}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </span>
              <div className="sm:mt-3">
                <p className={cn("text-sm font-semibold", step.state === "upcoming" || step.state === "skipped" ? "text-fg-subtle" : "text-fg")}>{step.label}</p>
                <p className="text-xs text-fg-muted">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
