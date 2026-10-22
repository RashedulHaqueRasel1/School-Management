import type { Metadata } from "next";

import { TeacherProfileView } from "@/features/teachers/components/profile/ProfileView";

export const metadata: Metadata = { title: "Teacher Profile" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeacherProfileView slug={slug} />;
}
