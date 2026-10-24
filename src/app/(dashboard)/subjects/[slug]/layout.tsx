import { SubjectShell } from "@/features/subjects/components/profile/SubjectShell";

// Subjects are built on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function SubjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubjectShell slug={slug}>{children}</SubjectShell>;
}
