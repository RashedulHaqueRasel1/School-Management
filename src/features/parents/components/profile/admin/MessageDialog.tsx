"use client";

import { useState } from "react";
import { Mail, MessageSquareText, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldGrid, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_USER } from "@/features/admissions/constants";
import { smsSegments, uid } from "@/features/admissions/utils";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast.store";

import { TEMPLATE_LABEL, buildTemplate } from "../../../demoData/mock-data";
import { useParentAdminStore } from "../../../store/parent-admin.store";
import type { MessageChannel, MessageTemplate, Parent, ParentMessage } from "../../../types/types";

const CHANNELS: { value: MessageChannel; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "both", label: "SMS + Email" },
];

const firstName = (name: string) => name.split(" ")[0] ?? name;

/** Fills {guardian} / {child} for one recipient. */
function personalise(text: string, p: Parent, childName?: string) {
  return text.replaceAll("{guardian}", p.name).replaceAll("{child}", firstName(childName ?? p.links[0]?.student.name ?? "your child"));
}

/**
 * Send an SMS / email to one guardian or many (bulk from the list page).
 * `{guardian}` and `{child}` are replaced for each recipient.
 * BACKEND: POST /parents/messages  { parentIds[], channel, subject, body, studentId? }
 */
export function MessageDialog({
  recipients,
  initialTemplate = "general",
  context,
  onClose,
}: {
  recipients: Parent[];
  initialTemplate?: MessageTemplate;
  /** Child + extra values for the templates (single recipient). */
  context?: { studentName?: string; className?: string; amount?: string; date?: string };
  onClose: () => void;
}) {
  const send = useParentAdminStore((s) => s.sendMessages);
  const bulk = recipients.length > 1;
  const fill = (t: MessageTemplate) => buildTemplate(t, { guardian: "{guardian}", child: "{child}", className: context?.className, amount: context?.amount, date: context?.date });
  const [template, setTemplate] = useState<MessageTemplate>(initialTemplate);
  const [subject, setSubject] = useState(fill(initialTemplate).subject);
  const [body, setBody] = useState(fill(initialTemplate).body);
  const withEmail = recipients.filter((p) => p.email).length;
  const [channel, setChannel] = useState<MessageChannel>("sms");
  const [error, setError] = useState("");

  const first = recipients[0]!;
  const preview = personalise(body, first, context?.studentName);
  const segments = smsSegments(preview);

  function submit() {
    if (body.trim().length < 10) return setError("Write the message (at least 10 characters).");
    const now = new Date().toISOString();
    const messages: ParentMessage[] = recipients.map((p) => ({
      id: uid(),
      parentKey: p.key,
      template,
      // Guardians without an email get the SMS only.
      channel: channel !== "sms" && !p.email ? "sms" : channel,
      subject: personalise(subject, p, context?.studentName),
      body: personalise(body, p, context?.studentName),
      studentName: context?.studentName,
      sentAt: now,
      sentBy: CURRENT_USER,
      bulk: bulk || undefined,
      status: "sent",
    }));
    send(messages);
    toast(bulk ? `Message sent to ${recipients.length} guardians` : "Message sent", {
      description: bulk ? `${segments * recipients.length} SMS credit(s) · ${channel !== "sms" ? `${withEmail} email(s)` : "SMS only"}` : `${first.name} · ${first.phone}`,
    });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={bulk ? `Message ${recipients.length} guardians` : "Send message"}
      description={bulk ? `${withEmail} of ${recipients.length} have an email address` : `${first.name} · ${first.phone}${first.email ? ` · ${first.email}` : ""}`}
      icon={
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <MessageSquareText className="h-5 w-5" />
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Send className="h-4 w-4" />
            Send{bulk ? ` to ${recipients.length}` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGrid>
          <FormField label="Template">
            <Select
              value={template}
              onChange={(e) => {
                const t = e.target.value as MessageTemplate;
                setTemplate(t);
                setSubject(fill(t).subject);
                setBody(fill(t).body);
              }}
              className="h-11"
            >
              {(Object.keys(TEMPLATE_LABEL) as MessageTemplate[]).map((t) => (
                <option key={t} value={t}>
                  {TEMPLATE_LABEL[t]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Send by">
            <div className="flex rounded-xl bg-soft p-1">
              {CHANNELS.map((c) => {
                const disabled = c.value !== "sms" && withEmail === 0;
                return (
                  <button
                    key={c.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setChannel(c.value)}
                    className={cn(
                      "h-9 flex-1 rounded-lg text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                      channel === c.value ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </FormField>
        </FieldGrid>
        {channel !== "sms" && (
          <FormField label="Email subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </FormField>
        )}
        <FormField label="Message" required error={error} hint="Use {guardian} and {child} — they are filled in for each guardian.">
          <Textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError("");
            }}
            rows={5}
            invalid={!!error}
          />
        </FormField>
        <div className="rounded-2xl border border-line bg-subtle p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
            <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
              {channel === "email" ? <Mail className="h-3.5 w-3.5" /> : <MessageSquareText className="h-3.5 w-3.5" />}
              Preview · {first.name}
            </span>
            {channel !== "email" && (
              <span className="tabular-nums">
                {preview.length} chars · {segments} SMS{bulk ? ` × ${recipients.length}` : ""}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm text-fg-secondary">{preview}</p>
        </div>
      </div>
    </Dialog>
  );
}
