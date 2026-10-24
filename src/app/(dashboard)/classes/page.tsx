import type { Metadata } from "next";

import { ClassesView } from "@/features/classes/components/ClassesView";

export const metadata: Metadata = { title: "Classes & Sections" };

export default function ClassesPage() {
  return <ClassesView />;
}
