import type { Metadata } from "next";

import { NewTeacherView } from "@/features/teachers/components/NewTeacherView";

export const metadata: Metadata = { title: "Add Teacher" };

export default function NewTeacherPage() {
  return <NewTeacherView />;
}
