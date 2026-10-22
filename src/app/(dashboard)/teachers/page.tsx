import type { Metadata } from "next";

import { TeachersView } from "@/features/teachers/components/TeachersView";

export const metadata: Metadata = { title: "Teachers" };

export default function TeachersPage() {
  return <TeachersView />;
}
