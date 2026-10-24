import type { Metadata } from "next";

import { ExamsView } from "@/features/examinations/components/ExamsView";

export const metadata: Metadata = { title: "Examinations" };

export default function ExaminationsPage() {
  return <ExamsView />;
}
