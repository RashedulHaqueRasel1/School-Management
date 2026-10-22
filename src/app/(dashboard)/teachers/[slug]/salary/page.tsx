import type { Metadata } from "next";

import { SalaryView } from "@/features/teachers/components/profile/SalaryView";

export const metadata: Metadata = { title: "Teacher Salary" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SalaryView slug={slug} />;
}
