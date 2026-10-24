import type { Metadata } from "next";

import { ParentAccountView } from "@/features/parents/components/profile/AccountView";

export const metadata: Metadata = { title: "Guardian · Account" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ParentAccountView slug={slug} />;
}
