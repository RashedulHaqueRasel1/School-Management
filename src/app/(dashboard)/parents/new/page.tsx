import type { Metadata } from "next";

import { NewParentView } from "@/features/parents/components/NewParentView";

export const metadata: Metadata = { title: "Add Guardian" };

export default function NewParentPage() {
  return <NewParentView />;
}
