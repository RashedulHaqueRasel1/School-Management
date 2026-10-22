import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Classes & Sections" };

export default function ClassesPage() {
  return (
    <ModulePlaceholder
      title="Classes & Sections"
      description="Organise classes, sections and class teachers."
    />
  );
}
