"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Link2, Phone, Star, Unlink, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/admissions/components/StudentAvatar";
import { formatDate, normalizePhone } from "@/features/admissions/utils";
import { studentHref } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useGuardianActions } from "../../hooks/use-guardian-actions";
import { useParent } from "../../hooks/use-parent";
import type { ParentLink } from "../../types/types";
import { parentHref } from "../../utils";
import { LinkChildDialog, UnlinkChildDialog } from "./admin/ChildDialogs";

export function ChildrenView({ slug }: { slug: string }) {
  const { parent, parents, students, guardiansByStudent, teacherOf } = useParent(slug);
  const actions = useGuardianActions();
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState<ParentLink | null>(null);
  if (!parent || !teacherOf) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          The <Star className="inline h-3.5 w-3.5 fill-amber-400 text-amber-400" /> primary contact gets attendance alerts, results and fee reminders for that child.
        </p>
        <Button onClick={() => setLinking(true)}>
          <Link2 className="h-4 w-4" />
          Link a child
        </Button>
      </div>

      {parent.links.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No children linked" description="Link this guardian to a student." />
        </Card>
      ) : (
        <div className="space-y-4">
          {parent.links.map((l) => {
            const others = l.guardians.filter((g) => normalizePhone(g.phone) !== parent.key);
            const left = l.student.status === "left";
            return (
              <Card key={l.student.id} className={cn("p-5 sm:p-6", l.isPrimary && "ring-2 ring-indigo-500/20")}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <StudentAvatar name={l.student.name} photo={l.student.photo} size="lg" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={studentHref(l.student)} className="text-base font-semibold text-fg hover:text-indigo-600">
                          {l.student.name}
                        </Link>
                        <span className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-fg-secondary">{l.student.id}</span>
                        {left ? <Badge>Left school</Badge> : <Badge tone="success">Studying</Badge>}
                        {l.isPrimary && (
                          <Badge tone="info">
                            <Star className="h-3 w-3" /> Primary contact
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-fg-secondary">
                        {l.student.className} · Section {l.student.section} · Roll {l.student.roll} · {l.student.shift} shift · {l.student.version} version
                      </p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {parent.name} is the <span className="font-semibold text-fg">{l.relation.toLowerCase()}</span> ({l.role.toLowerCase()}) · Class teacher {teacherOf(l.student.id)} · Since {formatDate(l.student.enrolledOn)}
                      </p>

                      {others.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {others.map((g) => {
                            const other = parents.find((p) => p.key === normalizePhone(g.phone));
                            return (
                              <Link
                                key={g.role}
                                href={other ? parentHref(other) : "#"}
                                className="inline-flex items-center gap-2 rounded-xl border border-line px-2.5 py-1.5 text-xs transition hover:bg-subtle"
                              >
                                <span className="font-semibold text-fg">{g.name}</span>
                                <span className="text-fg-muted">{g.role}</span>
                                <span className="flex items-center gap-1 text-fg-subtle">
                                  <Phone className="h-3 w-3" />
                                  {g.phone}
                                </span>
                                {g.isPrimary && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col">
                    {!l.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = await confirmAction({
                            title: "Make primary contact?",
                            description: `${parent.name} will receive ${l.student.name}'s attendance alerts, results and fee reminders instead of the current primary contact.`,
                            confirmLabel: "Make primary",
                          });
                          if (!ok) return;
                          actions.makePrimary(parent, l);
                          toast("Primary contact changed", { description: `${l.student.name} → ${parent.name}` });
                        }}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Make primary
                      </Button>
                    )}
                    <Link href={studentHref(l.student, "guardians")} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 text-xs font-semibold text-fg-secondary transition hover:bg-subtle">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Student&apos;s guardians
                    </Link>
                    <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-400" onClick={() => setUnlinking(l)}>
                      <Unlink className="h-3.5 w-3.5" />
                      Unlink
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {linking && <LinkChildDialog parent={parent} students={students} guardiansByStudent={guardiansByStudent} onClose={() => setLinking(false)} />}
      {unlinking && <UnlinkChildDialog parent={parent} link={unlinking} onClose={() => setUnlinking(null)} />}
    </div>
  );
}
