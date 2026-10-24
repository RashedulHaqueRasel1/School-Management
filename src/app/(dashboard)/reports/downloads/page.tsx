import type { Metadata } from "next";

import { DownloadsView } from "@/features/reports/components/DownloadsView";

export const metadata: Metadata = { title: "Report Downloads" };

export default function Page() {
  return <DownloadsView />;
}
