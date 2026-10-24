import type { Metadata } from "next";

import { NoticeDetailView } from "@/features/notices/components/NoticeDetailView";

export const metadata: Metadata = { title: "Notice" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NoticeDetailView slug={slug} />;
}
