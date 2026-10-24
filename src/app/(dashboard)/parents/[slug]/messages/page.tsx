import type { Metadata } from "next";

import { ParentMessagesView } from "@/features/parents/components/profile/MessagesView";

export const metadata: Metadata = { title: "Guardian · Messages" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ParentMessagesView slug={slug} />;
}
