import { ResultsShell } from "@/features/results/components/ResultsShell";

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <ResultsShell>{children}</ResultsShell>;
}
