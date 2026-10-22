import type { Metadata } from "next";

import { LeaveRequestsView } from "@/features/students/components/profile/LeaveRequestsView";

export const metadata: Metadata = { title: "Leave Requests" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LeaveRequestsView slug={slug} />;
}
