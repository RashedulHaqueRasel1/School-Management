import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Parents & Guardians" };

export default function ParentsPage() {
  return (
    <ModulePlaceholder
      title="Parents & Guardians"
      description="Manage parent and guardian contacts linked to students."
    />
  );
}
