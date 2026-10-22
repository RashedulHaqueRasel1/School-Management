import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return (
    <ModulePlaceholder
      title="Subjects"
      description="Configure subjects and assign them to classes and teachers."
    />
  );
}
