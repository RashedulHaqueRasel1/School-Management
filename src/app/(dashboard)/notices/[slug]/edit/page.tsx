import type { Metadata } from "next";

import { NoticeEditor } from "@/features/notices/components/NoticeEditor";

export const metadata: Metadata = { title: "Edit Notice" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NoticeEditor slug={slug} />;
}
