import type { Metadata } from "next";

import { AttendanceOverview } from "@/features/dashboard/components/AttendanceOverview";
import { FeeCollectionChart } from "@/features/dashboard/components/FeeCollectionChart";
import { LatestNotices } from "@/features/dashboard/components/LatestNotices";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentAdmissions } from "@/features/dashboard/components/RecentAdmissions";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { TopPerformers } from "@/features/dashboard/components/TopPerformers";
import { UpcomingEvents } from "@/features/dashboard/components/UpcomingEvents";
import { WelcomeBanner } from "@/features/dashboard/components/WelcomeBanner";
import {
  attendanceSummary,
  feeCollection,
  feeTarget,
  latestNotices,
  quickActions,
  recentAdmissions,
  stats,
  topPerformers,
  upcomingEvents,
} from "@/features/dashboard/demoData/mock-data";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <WelcomeBanner />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FeeCollectionChart data={feeCollection} target={feeTarget} />
        </div>
        <AttendanceOverview data={attendanceSummary} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentAdmissions admissions={recentAdmissions} />
        </div>
        <UpcomingEvents events={upcomingEvents} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <QuickActions actions={quickActions} />
        <LatestNotices notices={latestNotices} />
        <TopPerformers students={topPerformers} />
      </div>
    </div>
  );
}
