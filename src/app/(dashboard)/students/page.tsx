import type { Metadata } from "next";

import { StudentsView } from "@/features/students/components/StudentsView";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return <StudentsView />;
}
