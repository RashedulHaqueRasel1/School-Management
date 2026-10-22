import { TeacherProfileShell } from "@/features/teachers/components/profile/TeacherProfileShell";

// The teacher is loaded on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function TeacherProfileLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeacherProfileShell slug={slug}>{children}</TeacherProfileShell>;
}
