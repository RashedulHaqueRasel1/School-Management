import { FeesShell } from "@/features/fees/components/FeesShell";

export default function FeesLayout({ children }: { children: React.ReactNode }) {
  return <FeesShell>{children}</FeesShell>;
}
