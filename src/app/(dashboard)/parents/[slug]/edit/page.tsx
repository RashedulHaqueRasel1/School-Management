import type { Metadata } from "next";

import { EditParentView } from "@/features/parents/components/profile/EditParentView";

export const metadata: Metadata = { title: "Edit Guardian" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditParentView slug={slug} />;
}
