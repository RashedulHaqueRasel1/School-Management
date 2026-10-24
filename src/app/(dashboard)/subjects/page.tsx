import type { Metadata } from "next";

import { SubjectsView } from "@/features/subjects/components/SubjectsView";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return <SubjectsView />;
}
