import type { Metadata } from "next";

import { NewApplicationView } from "@/features/admissions/components/NewApplicationView";

export const metadata: Metadata = { title: "New Application" };

export default function NewApplicationPage() {
  return <NewApplicationView />;
}
