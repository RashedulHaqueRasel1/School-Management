"use client";

import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useNotices } from "../hooks/use-notices";
import { NoticeForm } from "./NoticeForm";

/** /notices/new and /notices/[slug]/edit — waits for the board, then opens the composer. */
export function NoticeEditor({ slug }: { slug?: string }) {
  const { notices, hydrated } = useNotices();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-soft" />;
  if (!slug) return <NoticeForm />;
  const notice = notices.find((n) => n.slug === slug);
  if (!notice) {
    return (
      <Card>
        <EmptyState
          icon={Megaphone}
          title="Notice not found"
          description="It may have been deleted."
          action={
            <Link href="/notices" className={buttonStyles({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              All notices
            </Link>
          }
        />
      </Card>
    );
  }
  return <NoticeForm key={notice.id} notice={notice} />;
}
