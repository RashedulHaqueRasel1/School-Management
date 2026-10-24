import { ParentProfileShell } from "@/features/parents/components/profile/ParentProfileShell";

// The guardian is built on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function ParentProfileLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ParentProfileShell slug={slug}>{children}</ParentProfileShell>;
}
