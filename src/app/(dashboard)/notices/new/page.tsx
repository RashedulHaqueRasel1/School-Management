import type { Metadata } from "next";

import { NoticeEditor } from "@/features/notices/components/NoticeEditor";

export const metadata: Metadata = { title: "New Notice" };

export default function NewNoticePage() {
  return <NoticeEditor />;
}
