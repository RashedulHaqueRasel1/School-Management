"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileSearch } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useAdmissionsHydrated, useAdmissionsStore } from "../store/admissions.store";
import { admissionHref, slugFor } from "../utils";
import { AdmissionForm } from "./form/AdmissionForm";

export function EditApplicationView({ slug }: { slug: string }) {
  const router = useRouter();
  const hydrated = useAdmissionsHydrated();
  const admission = useAdmissionsStore((s) => s.admissions.find((a) => slugFor(a) === slug));
  const update = useAdmissionsStore((s) => s.update);

  if (!hydrated) return <Card className="h-96 animate-pulse" />;
  if (!admission) {
    return (
      <Card>
        <EmptyState
          icon={FileSearch}
          title="Application not found"
          description="It may have been deleted or renamed."
          action={
            <Link href="/admissions" className={buttonStyles({ variant: "outline" })}>
              Back to admissions
            </Link>
          }
        />
      </Card>
    );
  }

  const detailsHref = admissionHref(admission);

  return (
    <div className="animate-fade-up">
      <Link href={detailsHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        Back to {admission.studentName}
      </Link>
      <PageHeader title="Edit application" description={`${admission.id} · applied for ${admission.applyingClass}`} />
      <AdmissionForm
        key={admission.id}
        initial={admission}
        submitLabel="Save changes"
        cancelHref={detailsHref}
        onSubmit={async (input) => {
          if (!(await confirmAction({ title: "Save application changes?", description: `${input.studentName}'s application is updated.`, confirmLabel: "Save changes" }))) return;
          const updated = update(admission.id, input);
          toast("Changes saved", { description: `${input.studentName}'s application was updated.` });
          // The URL contains the name, so it changes if the name was edited.
          router.push(updated ? admissionHref(updated) : "/admissions");
        }}
      />
    </div>
  );
}
