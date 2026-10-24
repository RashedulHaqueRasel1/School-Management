import { ExamShell } from "@/features/examinations/components/profile/ExamShell";

// Exams are built on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function ExamLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExamShell slug={slug}>{children}</ExamShell>;
}
