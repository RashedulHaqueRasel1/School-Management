import type { Metadata } from "next";

import { ResultsOverviewView } from "@/features/results/components/ResultsOverviewView";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage() {
  return <ResultsOverviewView />;
}
