import type { Metadata } from "next";

import { EditApplicationView } from "@/features/admissions/components/EditApplicationView";

export const metadata: Metadata = { title: "Edit Application" };

// The record is loaded on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function EditApplicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditApplicationView slug={slug} />;
}
