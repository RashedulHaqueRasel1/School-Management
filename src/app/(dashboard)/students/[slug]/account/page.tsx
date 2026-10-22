import type { Metadata } from "next";

import { AccountView } from "@/features/students/components/profile/AccountView";

export const metadata: Metadata = { title: "Account & Access" };

export const instant = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AccountView slug={slug} />;
}
