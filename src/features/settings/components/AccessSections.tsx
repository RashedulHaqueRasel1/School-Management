"use client";

import { useState } from "react";
import {
  BellRing,
  Calculator,
  Clock,
  Crown,
  Fingerprint,
  KeyRound,
  Laptop,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import type { PermissionLevel, PermissionModule, RoleKey } from "../store/settings.store";
import { Panel, SaveBar, SectionHeader, SettingRow, useDraft } from "./parts";

const ROLES: { key: RoleKey; label: string; users: number; icon: LucideIcon; accent: string }[] = [
  { key: "admin", label: "Administrator", users: 2, icon: Crown, accent: "bg-indigo-50 text-indigo-600" },
  { key: "principal", label: "Principal", users: 1, icon: UserCog, accent: "bg-violet-50 text-violet-600" },
  { key: "teacher", label: "Teacher", users: 48, icon: Users, accent: "bg-emerald-50 text-emerald-600" },
  { key: "accountant", label: "Accountant", users: 3, icon: Calculator, accent: "bg-amber-50 text-amber-600" },
  { key: "staff", label: "Office staff", users: 6, icon: Wrench, accent: "bg-sky-50 text-sky-600" },
];

const MODULES: { key: PermissionModule; label: string }[] = [
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "attendance", label: "Attendance" },
  { key: "examinations", label: "Examinations" },
  { key: "fees", label: "Fees & payments" },
  { key: "notices", label: "Notices" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

const LEVELS: { value: PermissionLevel; label: string; active: string }[] = [
  { value: "none", label: "None", active: "bg-surface text-fg shadow-card" },
  { value: "view", label: "View", active: "bg-sky-500 text-white shadow-sm" },
  { value: "edit", label: "Edit", active: "bg-indigo-600 text-white shadow-sm" },
  { value: "full", label: "Full", active: "bg-emerald-600 text-white shadow-sm" },
];

export function RolesSection() {
  const { draft: v, setDraft, dirty, savedAt, discard, commit } = useDraft("permissions");
  const [role, setRole] = useState<RoleKey>("teacher");
  const locked = role === "admin";
  const current = ROLES.find((r) => r.key === role)!;
  const set = (m: PermissionModule, level: PermissionLevel) => setDraft((d) => ({ ...d, [role]: { ...d[role], [m]: level } }));
  const granted = (r: RoleKey) => MODULES.filter((m) => v[r][m.key] !== "none").length;

  return (
    <section>
      <SectionHeader icon={ShieldCheck} title="Roles & permissions" description="Decide what each role can see and change across the dashboard." accent="bg-emerald-50 text-emerald-600" savedAt={savedAt} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17rem_1fr]">
        <Card className="p-2">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {ROLES.map((r) => (
              <li key={r.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setRole(r.key)}
                  aria-current={role === r.key}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition", role === r.key ? "bg-soft" : "hover:bg-subtle")}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", r.accent)}>
                    <r.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap text-sm font-semibold text-fg">{r.label}</span>
                    <span className="block text-xs text-fg-muted">
                      {r.users} user{r.users > 1 ? "s" : ""} · {granted(r.key)}/{MODULES.length} modules
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Panel
          title={`${current.label} access`}
          description={locked ? "Administrators always have full access." : "Pick a level for each module."}
          action={locked ? <Badge tone="info">Locked</Badge> : <Badge tone="success" dot>{granted(role)} modules</Badge>}
        >
          <ul className="divide-y divide-line">
            {MODULES.map((m) => (
              <li key={m.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-fg">{m.label}</span>
                <div role="radiogroup" aria-label={`${m.label} access`} className="inline-flex rounded-xl bg-soft p-1">
                  {LEVELS.map((l) => {
                    const on = v[role][m.key] === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={locked}
                        onClick={() => set(m.key, l.value)}
                        className={cn(
                          "h-8 min-w-14 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed",
                          on ? l.active : "text-fg-muted hover:text-fg",
                          locked && !on && "opacity-50",
                        )}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <SaveBar dirty={dirty} onDiscard={discard} onSave={() => commit("Permissions")} />
    </section>
  );
}

const SESSIONS = [
  { id: "s1", device: "Chrome on Linux", place: "Dhaka, Bangladesh", when: "Active now", icon: Laptop, current: true },
  { id: "s2", device: "Safari on iPhone", place: "Dhaka, Bangladesh", when: "2 hours ago", icon: Smartphone, current: false },
  { id: "s3", device: "Edge on Windows", place: "Narayanganj, Bangladesh", when: "Yesterday, 4:12 PM", icon: Laptop, current: false },
];

export function SecuritySection() {
  const { draft: v, patch, dirty, savedAt, discard, commit } = useDraft("security");
  const [sessions, setSessions] = useState(SESSIONS);
  const score = [v.twoFactor, v.minPasswordLength >= 10, v.requireSymbols, v.loginAlerts, v.sessionTimeout <= 30].filter(Boolean).length;
  const strength = score >= 4 ? { label: "Strong", tone: "text-emerald-600", bar: "bg-emerald-500" } : score >= 2 ? { label: "Fair", tone: "text-amber-600", bar: "bg-amber-500" } : { label: "Weak", tone: "text-rose-600", bar: "bg-rose-500" };

  return (
    <section>
      <SectionHeader icon={KeyRound} title="Security" description="Protect admin accounts with sign-in rules and keep an eye on active devices." accent="bg-rose-50 text-rose-600" savedAt={savedAt} />

      <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-fg-muted">Security score</p>
          <p className={cn("text-xl font-bold tracking-tight", strength.tone)}>{strength.label}</p>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded-full", i < score ? strength.bar : "bg-soft")} />
            ))}
          </div>
          <p className="mt-1.5 text-right text-xs text-fg-muted">{score} of 5 recommendations on</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Sign-in">
          <div className="divide-y divide-line">
            <SettingRow icon={Fingerprint} title="Two-factor authentication" description="Ask for a code from the phone on every sign-in">
              <Switch checked={v.twoFactor} onCheckedChange={(twoFactor) => patch({ twoFactor })} aria-label="Two-factor authentication" />
            </SettingRow>
            <SettingRow icon={BellRing} title="New sign-in alerts" description="Email me when a new device signs in">
              <Switch checked={v.loginAlerts} onCheckedChange={(loginAlerts) => patch({ loginAlerts })} aria-label="New sign-in alerts" />
            </SettingRow>
            <SettingRow icon={Clock} title="Auto sign-out" description="After this much inactivity">
              <Select aria-label="Auto sign-out" value={v.sessionTimeout} onChange={(e) => patch({ sessionTimeout: Number(e.target.value) })} className="w-32">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={240}>4 hours</option>
              </Select>
            </SettingRow>
          </div>
        </Panel>

        <Panel title="Password policy" description="Applies to all staff accounts">
          <div className="divide-y divide-line">
            <SettingRow title="Minimum length" description="10+ characters recommended">
              <Select aria-label="Minimum password length" value={v.minPasswordLength} onChange={(e) => patch({ minPasswordLength: Number(e.target.value) })} className="w-32">
                {[6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} chars
                  </option>
                ))}
              </Select>
            </SettingRow>
            <SettingRow title="Require symbols & numbers" description="e.g. Rahim@2026">
              <Switch checked={v.requireSymbols} onCheckedChange={(requireSymbols) => patch({ requireSymbols })} aria-label="Require symbols and numbers" />
            </SettingRow>
          </div>
        </Panel>

        <Panel
          title="Active sessions"
          description="Devices signed in to this account"
          className="lg:col-span-2"
          action={
            sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 dark:text-rose-400"
                onClick={async () => {
                  const ok = await confirmAction({ title: "Sign out all other devices?", description: "Everyone except this browser will need to sign in again.", confirmLabel: "Sign out others", tone: "danger" });
                  if (!ok) return;
                  setSessions((s) => s.filter((x) => x.current));
                  toast("Signed out other devices");
                }}
              >
                Sign out others
              </Button>
            )
          }
        >
          <ul className="divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.current ? "bg-emerald-50 text-emerald-600" : "bg-soft text-fg-muted")}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
                    {s.device}
                    {s.current && (
                      <Badge tone="success" dot>
                        This device
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {s.place} · {s.when}
                  </p>
                </div>
                {!s.current && (
                  // BACKEND: DELETE /auth/sessions/{id}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Sign out ${s.device}`}
                    onClick={() => {
                      setSessions((list) => list.filter((x) => x.id !== s.id));
                      toast("Device signed out", { description: s.device });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <SaveBar dirty={dirty} onDiscard={discard} onSave={() => commit("Security settings")} />
    </section>
  );
}
