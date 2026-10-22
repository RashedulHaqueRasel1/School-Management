import type { Metadata } from "next";

import { AdmissionDetailsView } from "@/features/admissions/components/details/AdmissionDetailsView";

export const metadata: Metadata = { title: "Application Details" };

// The record is loaded on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function AdmissionDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AdmissionDetailsView slug={slug} />;
}
