import type { Metadata } from "next";

import { NoticesView } from "@/features/notices/components/NoticesView";

export const metadata: Metadata = { title: "Notices" };

export default function NoticesPage() {
  return <NoticesView />;
}
