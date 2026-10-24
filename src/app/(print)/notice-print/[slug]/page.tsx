import type { Metadata } from "next";

import { NoticePrint } from "@/features/notices/components/print/NoticePrint";

export const metadata: Metadata = { title: "Notice" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NoticePrint slug={slug} />;
}
