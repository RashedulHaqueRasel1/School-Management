import type { Metadata } from "next";

import { TeacherAccountView } from "@/features/teachers/components/profile/AccountView";

export const metadata: Metadata = { title: "Teacher Account" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeacherAccountView slug={slug} />;
}
