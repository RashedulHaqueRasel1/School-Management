import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Configure school profile, academic year, roles and permissions."
    />
  );
}
