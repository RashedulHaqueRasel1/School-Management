"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Award,
  Bell,
  CalendarDays,
  Check,
  ClipboardCheck,
  Languages,
  Mail,
  Megaphone,
  MessageSquareText,
  Monitor,
  Moon,
  Palette,
  Rows3,
  Smartphone,
  Sun,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { NotifyChannel, NotifyEvent, Preferences } from "../store/settings.store";
import { Panel, SaveBar, SectionHeader, SettingRow, useDraft } from "./parts";

const EVENTS: { key: NotifyEvent; label: string; description: string; icon: LucideIcon; accent: string }[] = [
  { key: "absent", label: "Student absent", description: "Guardian is told when a child misses class", icon: ClipboardCheck, accent: "bg-rose-50 text-rose-600" },
  { key: "feeDue", label: "Fee due reminder", description: "Monthly dues and overdue payments", icon: Wallet, accent: "bg-amber-50 text-amber-600" },
  { key: "results", label: "Results published", description: "When exam results go live", icon: Award, accent: "bg-violet-50 text-violet-600" },
  { key: "notices", label: "New notice", description: "Notices marked for guardians", icon: Megaphone, accent: "bg-sky-50 text-sky-600" },
  { key: "events", label: "Events & holidays", description: "Upcoming events and closures", icon: CalendarDays, accent: "bg-emerald-50 text-emerald-600" },
  { key: "admission", label: "Admission updates", description: "Application status changes", icon: UserPlus, accent: "bg-indigo-50 text-indigo-600" },
];

const CHANNELS: { key: NotifyChannel; label: string; icon: LucideIcon }[] = [
  { key: "sms", label: "SMS", icon: MessageSquareText },
  { key: "email", label: "Email", icon: Mail },
  { key: "push", label: "App", icon: Smartphone },
];

export function NotificationsSection() {
  const { draft: v, setDraft, dirty, savedAt, discard, commit } = useDraft("notifications");
  const toggle = (e: NotifyEvent, c: NotifyChannel, on: boolean) => setDraft((d) => ({ ...d, [e]: { ...d[e], [c]: on } }));
  const setChannel = (c: NotifyChannel, on: boolean) => setDraft((d) => Object.fromEntries(EVENTS.map(({ key }) => [key, { ...d[key], [c]: on }])) as typeof d);
  const smsCount = EVENTS.filter((e) => v[e.key].sms).length;

  return (
    <section>
      <SectionHeader icon={Bell} title="Notifications" description="Choose which updates reach guardians and staff, and through which channel." accent="bg-amber-50 text-amber-600" savedAt={savedAt} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CHANNELS.map((c) => {
          const count = EVENTS.filter((e) => v[e.key][c.key]).length;
          const all = count === EVENTS.length;
          return (
            <Card key={c.key} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", count ? "bg-indigo-50 text-indigo-600" : "bg-soft text-fg-subtle")}>
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">{c.label}</p>
                <p className="text-xs text-fg-muted">
                  {count} of {EVENTS.length} alerts on
                </p>
              </div>
              <Switch checked={all} onCheckedChange={(on) => setChannel(c.key, on)} aria-label={`Turn all ${c.label} alerts ${all ? "off" : "on"}`} />
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1fr_repeat(3,5.5rem)] items-center border-b border-line bg-subtle/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted sm:grid">
          <span>Alert</span>
          {CHANNELS.map((c) => (
            <span key={c.key} className="text-center">
              {c.label}
            </span>
          ))}
        </div>
        <ul className="divide-y divide-line">
          {EVENTS.map((e) => (
            <li key={e.key} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_repeat(3,5.5rem)] sm:items-center sm:px-6">
              <div className="flex items-start gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", e.accent)}>
                  <e.icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{e.label}</p>
                  <p className="text-xs text-fg-muted">{e.description}</p>
                </div>
              </div>
              <div className="flex gap-5 pl-12 sm:contents">
                {CHANNELS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 sm:justify-center">
                    <Switch checked={v[e.key][c.key]} onCheckedChange={(on) => toggle(e.key, c.key, on)} aria-label={`${e.label} via ${c.label}`} />
                    <span className="text-xs font-medium text-fg-muted sm:hidden">{c.label}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {smsCount > 0 && (
        <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          {smsCount} alert type{smsCount > 1 ? "s" : ""} will use SMS credits. Each SMS to a guardian costs one credit.
        </p>
      )}

      <SaveBar dirty={dirty} onDiscard={discard} onSave={() => commit("Notification settings")} />
    </section>
  );
}

const THEMES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function ThemePreview({ mode }: { mode: string }) {
  const dark = mode === "dark";
  const half = mode === "system";
  const pane = (isDark: boolean) => (
    <div className={cn("flex h-full flex-1 gap-1.5 p-2", isDark ? "bg-slate-900" : "bg-slate-50")}>
      <div className={cn("w-1/4 rounded-md", isDark ? "bg-slate-800" : "bg-white")} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={cn("h-2.5 w-2/3 rounded", isDark ? "bg-slate-700" : "bg-slate-200")} />
        <div className={cn("flex-1 rounded-md", isDark ? "bg-slate-800" : "bg-white")}>
          <div className="m-1.5 h-2 w-1/2 rounded bg-indigo-500" />
        </div>
      </div>
    </div>
  );
  return <div className="flex h-24 overflow-hidden rounded-lg ring-1 ring-line">{half ? [pane(false), pane(true)] : pane(dark)}</div>;
}

const subscribe = () => () => {};

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  // The theme is only known on the client.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { draft: v, patch, dirty, savedAt, discard, commit } = useDraft("preferences");

  return (
    <section>
      <SectionHeader icon={Palette} title="Appearance & region" description="Theme, language and formats for this dashboard." accent="bg-sky-50 text-sky-600" savedAt={savedAt} />

      <div className="space-y-6">
        <Panel title="Theme" description="Applies instantly on this device">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEMES.map((t) => {
              const active = mounted && theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "group rounded-2xl border p-2.5 text-left transition",
                    active ? "border-indigo-500 ring-4 ring-indigo-500/15" : "border-line-strong hover:border-fg-subtle/50",
                  )}
                >
                  <ThemePreview mode={t.value} />
                  <div className="mt-2.5 flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                      <t.icon className="h-4 w-4 text-fg-muted" />
                      {t.label}
                    </span>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", active ? "bg-indigo-600 text-white" : "border-2 border-fg-subtle/40")}>
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Language & formats">
          <div className="divide-y divide-line">
            <SettingRow icon={Languages} title="Language" description="Dashboard interface language">
              <Select aria-label="Language" value={v.language} onChange={(e) => patch({ language: e.target.value as Preferences["language"] })} className="w-36">
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </Select>
            </SettingRow>
            <SettingRow icon={CalendarDays} title="Date format" description="Used in lists, slips and reports">
              <Select aria-label="Date format" value={v.dateFormat} onChange={(e) => patch({ dateFormat: e.target.value as Preferences["dateFormat"] })} className="w-36">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </Select>
            </SettingRow>
            <SettingRow icon={Wallet} title="Currency" description="For fees and payments">
              <Select aria-label="Currency" value={v.currency} onChange={(e) => patch({ currency: e.target.value as Preferences["currency"] })} className="w-36">
                <option value="BDT">৳ BDT</option>
                <option value="USD">$ USD</option>
              </Select>
            </SettingRow>
            <SettingRow icon={Rows3} title="Compact tables" description="Tighter rows to fit more on screen">
              <Switch checked={v.compact} onCheckedChange={(compact) => patch({ compact })} aria-label="Compact tables" />
            </SettingRow>
          </div>
        </Panel>
      </div>

      <SaveBar dirty={dirty} onDiscard={discard} onSave={() => commit("Preferences")} />
    </section>
  );
}
