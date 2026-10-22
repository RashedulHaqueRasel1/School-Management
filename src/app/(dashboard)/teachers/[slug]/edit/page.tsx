import type { Metadata } from "next";

import { EditTeacherView } from "@/features/teachers/components/profile/EditTeacherView";

export const metadata: Metadata = { title: "Edit Teacher" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditTeacherView slug={slug} />;
}
