import { StudentProfileShell } from "@/features/students/components/profile/StudentProfileShell";

// The student is loaded on the client (demo store / API), so this route may block on `params`.
export const instant = false;

export default async function StudentProfileLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StudentProfileShell slug={slug}>{children}</StudentProfileShell>;
}
