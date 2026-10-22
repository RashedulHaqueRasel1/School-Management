"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { toast } from "@/store/toast.store";

import { useAdmissionsHydrated, useAdmissionsStore } from "../store/admissions.store";
import { admissionHref } from "../utils";
import { AdmissionForm } from "./form/AdmissionForm";

export function NewApplicationView() {
  const router = useRouter();
  // Hydrate first so the new ID continues from saved demo data.
  useAdmissionsHydrated();
  const add = useAdmissionsStore((s) => s.add);

  return (
    <div className="animate-fade-up">
      <Link href="/admissions" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" />
        All applications
      </Link>
      <PageHeader
        title="New admission application"
        description="Fill in what you have now — only the fields marked * are required. The guardian receives an SMS with the application ID as soon as it is submitted."
      />
      <AdmissionForm
        submitLabel="Submit application"
        cancelHref="/admissions"
        onSubmit={(input) => {
          const created = add(input);
          toast("Application submitted", { description: `${created.studentName} · ${created.id} · confirmation SMS queued.` });
          router.push(admissionHref(created));
        }}
      />
    </div>
  );
}
