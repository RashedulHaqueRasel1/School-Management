import { SectionShell } from "@/features/classes/components/profile/SectionShell";

// Sections are built on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function SectionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SectionShell slug={slug}>{children}</SectionShell>;
}
