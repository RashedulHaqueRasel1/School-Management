import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Notices" };

export default function NoticesPage() {
  return (
    <ModulePlaceholder
      title="Notices"
      description="Publish announcements for students, parents and staff."
    />
  );
}
