"use client";

import { LatestNotices } from "@/features/dashboard/components/LatestNotices";

import { useNotices } from "../hooks/use-notices";
import { CATEGORY_STYLE, audienceLabel, noticeHref, relativeTime } from "../utils";

/** Dashboard "Notice Board" card — the latest published notices (pinned first). */
export function DashboardNotices() {
  const { notices, now } = useNotices();
  const latest = notices
    .filter((n) => n.status === "published")
    .slice(0, 4)
    .map((n) => ({ id: n.id, title: n.title, audience: audienceLabel(n), postedAt: relativeTime(n.publishAt!, now), category: { label: n.category, tone: CATEGORY_STYLE[n.category].tone }, href: noticeHref(n) }));
  return <LatestNotices notices={latest} />;
}
