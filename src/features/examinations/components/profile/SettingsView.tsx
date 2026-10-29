"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, Save, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useExam } from "../../hooks/use-exam";
import type { ExamSummary } from "../../hooks/use-exams";
import { useExamAdminStore } from "../../store/exam-admin.store";
import type { ExamSettings } from "../../types/types";
import { ExamFields, validateExam } from "../ExamForm";

const pick = (e: ExamSummary): ExamSettings => ({
  name: e.name,
  type: e.type,
  startDate: e.startDate,
  classes: e.classes,
  startTime: e.startTime,
  fullMarks: e.fullMarks,
  passMarks: e.passMarks,
  instructions: e.instructions,
});

/** Edit / cancel / delete the exam. BACKEND: PATCH /exams/:id · POST /exams/:id/cancel · DELETE /exams/:id */
export function ExamSettingsView({ slug }: { slug: string }) {
  const { exam } = useExam(slug);
  return exam ? <SettingsForm key={exam.id} exam={exam} /> : null;
}

function SettingsForm({ exam }: { exam: ExamSummary }) {
  const router = useRouter();
  const saveSettings = useExamAdminStore((s) => s.saveSettings);
  const cancel = useExamAdminStore((s) => s.cancel);
  const restore = useExamAdminStore((s) => s.restore);
  const remove = useExamAdminStore((s) => s.remove);
  const [value, setValue] = useState(() => pick(exam));
  const [error, setError] = useState("");
  const [action, setAction] = useState<"cancel" | "delete" | "reschedule" | null>(null);
  const [reason, setReason] = useState("");

  const original = pick(exam);
  const changed = (Object.keys(value) as (keyof ExamSettings)[]).filter((k) => JSON.stringify(value[k]) !== JSON.stringify(original[k]));
  const reschedules = changed.some((k) => k === "startDate" || k === "classes" || k === "startTime" || k === "type");
  const locked = exam.status === "published";

  async function save() {
    const problem = validateExam(value);
    if (problem) return setError(problem);
    if (reschedules && exam.editedSchedule && action !== "reschedule") return setAction("reschedule");
    // The reschedule dialog is already the confirmation for that path.
    if (action !== "reschedule" && !(await confirmAction({ title: "Save exam settings?", description: `Changes: ${changed.join(", ")}.${reschedules ? " The routine is regenerated." : ""}`, confirmLabel: "Save changes" }))) return;
    saveSettings(exam.id, value, changed.join(", "), reschedules);
    toast("Exam updated", { description: reschedules ? "The routine was regenerated." : value.name });
    setAction(null);
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="p-5 sm:p-6 xl:col-span-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Exam settings</h2>
        <p className="mb-5 text-xs text-fg-muted">{locked ? "Results are published — dates and classes can no longer change." : "Changing the dates, classes, start time or type regenerates the routine."}</p>
        <fieldset disabled={locked} className="disabled:opacity-60">
          <ExamFields
            value={value}
            onChange={(patch) => {
              setValue((v) => ({ ...v, ...patch }));
              setError("");
            }}
          />
        </fieldset>
        {error && <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          <Button variant="outline" onClick={() => setValue(original)} disabled={changed.length === 0}>
            Discard
          </Button>
          <Button onClick={save} disabled={changed.length === 0 || locked}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </Card>

      <Card className="h-fit p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Danger zone</h2>
        <div className="mt-4 space-y-4">
          {exam.cancelled ? (
            <div>
              <p className="text-sm text-fg-secondary">Cancelled: {exam.cancelled.reason}</p>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={async () => {
                  if (!(await confirmAction({ title: "Restore this exam?", description: `${exam.name} comes back with its routine and admit cards.`, confirmLabel: "Restore" }))) return;
                  restore(exam.id);
                  toast("Exam restored");
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Restore exam
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-fg">Cancel exam</p>
              <p className="text-xs text-fg-muted">The routine and admit cards are withdrawn. It can be restored.</p>
              <Button variant="outline" className="mt-3 w-full" onClick={() => setAction("cancel")} disabled={locked}>
                <Ban className="h-4 w-4" />
                Cancel exam
              </Button>
            </div>
          )}
          {exam.custom && (
            <div className="border-t border-line pt-4">
              <p className="text-sm font-medium text-fg">Delete exam</p>
              <p className="text-xs text-fg-muted">Only exams you created, before results are published.</p>
              <Button variant="danger" className="mt-3 w-full" onClick={() => setAction("delete")} disabled={locked}>
                <Trash2 className="h-4 w-4" />
                Delete exam
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Dialog
        open={action === "cancel"}
        onClose={() => setAction(null)}
        title={`Cancel ${exam.name}?`}
        description="Tell students and guardians why."
        footer={
          <>
            <Button variant="outline" onClick={() => setAction(null)}>
              Keep exam
            </Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < 3}
              onClick={() => {
                cancel(exam.id, reason.trim());
                toast("Exam cancelled", { tone: "info" });
                setAction(null);
                setReason("");
              }}
            >
              Cancel exam
            </Button>
          </>
        }
      >
        <FormField label="Reason" required>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Postponed due to national holiday" />
        </FormField>
      </Dialog>
      <ConfirmDialog
        open={action === "delete"}
        onClose={() => setAction(null)}
        title={`Delete ${exam.name}?`}
        description="The exam, its routine, rooms and admit cards are removed. This cannot be undone."
        typeToConfirm={exam.name}
        onConfirm={() => {
          remove(exam.id);
          toast("Exam deleted");
          router.push("/examinations");
        }}
      />
      <ConfirmDialog
        open={action === "reschedule"}
        onClose={() => setAction(null)}
        title="Regenerate the routine?"
        tone="primary"
        description="You edited papers on the Schedule tab. These changes rebuild the routine and discard those edits."
        confirmLabel="Save & regenerate"
        onConfirm={save}
      />
    </div>
  );
}
