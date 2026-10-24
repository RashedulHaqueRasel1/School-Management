import type { Metadata } from "next";

import { ParentMeetingsView } from "@/features/parents/components/profile/MeetingsView";

export const metadata: Metadata = { title: "Guardian · Meetings" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ParentMeetingsView slug={slug} />;
}
