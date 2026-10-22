import { CheckCheck, Clock, FilePlus2, Mail, MessageSquareText, Pencil, Wallet, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { STATUS_CONFIG } from "../../constants";
import type { ActivityEvent, GuardianNotification } from "../../types/types";
import { formatDateTime } from "../../utils";

const STATE_STYLE: Record<GuardianNotification["state"], { label: string; className: string; icon: typeof Clock }> = {
  queued: { label: "Queued", className: "bg-amber-50 text-amber-700", icon: Clock },
  sent: { label: "Delivered", className: "bg-emerald-50 text-emerald-700", icon: CheckCheck },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700", icon: XCircle },
};

function eventIcon(e: ActivityEvent) {
  if (e.type === "status" && e.status) return { icon: STATUS_CONFIG[e.status].icon, accent: STATUS_CONFIG[e.status].accent };
  if (e.type === "payment") return { icon: Wallet, accent: "bg-emerald-50 text-emerald-600" };
  if (e.type === "updated") return { icon: Pencil, accent: "bg-soft text-fg-muted" };
  return { icon: FilePlus2, accent: "bg-indigo-50 text-indigo-600" };
}

/** Everything that happened to the application, incl. every message sent to the guardian. */
export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold tracking-tight text-fg">Activity & guardian messages</h2>
      <p className="mt-0.5 text-xs text-fg-muted">Newest first. Delivery status is reported by the SMS / email service.</p>

      <ol className="mt-5 space-y-6">
        {events.map((e, i) => {
          const { icon: Icon, accent } = eventIcon(e);
          return (
            <li key={e.id} className="relative flex gap-3.5">
              {i < events.length - 1 && <span aria-hidden className="absolute left-[17px] top-10 h-[calc(100%-0.5rem)] w-px bg-line-strong" />}
              <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", accent)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-fg">{e.title}</p>
                <p className="text-xs text-fg-subtle">
                  {formatDateTime(e.at)} · {e.by}
                </p>

                {e.note && (
                  <p className="mt-2 rounded-lg border-l-2 border-fg-subtle/40 bg-subtle px-3 py-2 text-xs text-fg-secondary">
                    <span className="font-semibold">Reason:</span> {e.note}
                  </p>
                )}

                {e.message && (
                  <div className="mt-2.5 rounded-xl border border-line bg-subtle/60 p-3">
                    <p className="text-xs leading-relaxed text-fg-secondary">{e.message}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {e.notifications.map((n) => {
                        const state = STATE_STYLE[n.state];
                        const StateIcon = state.icon;
                        const ChannelIcon = n.channel === "sms" ? MessageSquareText : Mail;
                        return (
                          <span
                            key={`${n.channel}-${n.to}`}
                            title={n.to}
                            className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", state.className)}
                          >
                            <ChannelIcon className="h-3 w-3" />
                            {n.channel === "sms" ? "SMS" : "Email"}
                            <span className="opacity-60">·</span>
                            <StateIcon className="h-3 w-3" />
                            {state.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
