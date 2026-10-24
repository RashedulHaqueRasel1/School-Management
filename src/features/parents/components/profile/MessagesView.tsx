"use client";

import { useState } from "react";
import { Mail, MessageSquareText, Send, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDateTime, smsSegments } from "@/features/admissions/utils";

import { TEMPLATE_LABEL } from "../../demoData/mock-data";
import { useParent } from "../../hooks/use-parent";
import type { MessageTemplate } from "../../types/types";
import { MessageDialog } from "./admin/MessageDialog";

const CHANNEL = {
  sms: { label: "SMS", icon: MessageSquareText },
  email: { label: "Email", icon: Mail },
  both: { label: "SMS + Email", icon: Send },
} as const;

export function ParentMessagesView({ slug }: { slug: string }) {
  const { parent, messages } = useParent(slug);
  const [template, setTemplate] = useState<MessageTemplate | "all">("all");
  const [composing, setComposing] = useState(false);
  if (!parent || !messages) return null;

  const shown = template === "all" ? messages : messages.filter((m) => m.template === template);
  const smsCredits = messages.filter((m) => m.channel !== "email").reduce((sum, m) => sum + smsSegments(m.body), 0);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Communication log</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {messages.length} message(s) · {smsCredits} SMS credit(s) used · automatic alerts and admin messages
          </p>
        </div>
        <Select aria-label="Filter by type" value={template} onChange={(e) => setTemplate(e.target.value as MessageTemplate | "all")} className="sm:w-52">
          <option value="all">All types</option>
          {(Object.keys(TEMPLATE_LABEL) as MessageTemplate[]).map((t) => (
            <option key={t} value={t}>
              {TEMPLATE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Button onClick={() => setComposing(true)}>
          <Send className="h-4 w-4" />
          New message
        </Button>
      </Card>

      {shown.length === 0 ? (
        <Card>
          <EmptyState icon={MessageSquareText} title="No messages" description="SMS and emails sent to this guardian appear here." />
        </Card>
      ) : (
        <ol className="space-y-3">
          {shown.map((m) => {
            const { label, icon: Icon } = CHANNEL[m.channel];
            return (
              <li key={m.id}>
                <Card className="flex gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{m.subject}</p>
                      <Badge>{TEMPLATE_LABEL[m.template]}</Badge>
                      {m.bulk && (
                        <Badge tone="violet">
                          <Users className="h-3 w-3" /> Bulk
                        </Badge>
                      )}
                      <Badge tone={m.status === "failed" ? "danger" : "success"} dot>
                        {m.status === "delivered" ? "Delivered" : m.status === "sent" ? "Sent" : "Failed"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-fg-secondary">{m.body}</p>
                    <p className="mt-2 text-xs text-fg-subtle">
                      {label} · {formatDateTime(m.sentAt)} · by {m.sentBy}
                      {m.studentName && ` · about ${m.studentName}`}
                    </p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {composing && <MessageDialog recipients={[parent]} onClose={() => setComposing(false)} />}
    </div>
  );
}
