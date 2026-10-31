"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarRange, KeyRound, Palette, RotateCcw, School, ShieldCheck, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useSettingsHydrated, useSettingsStore, type SettingsSection } from "../store/settings.store";
import { RolesSection, SecuritySection } from "./AccessSections";
import { AcademicSection, SchoolProfileSection } from "./GeneralSections";
import { AppearanceSection, NotificationsSection } from "./PreferenceSections";

type Tab = SettingsSection;

const NAV: { group: string; items: { key: Tab; label: string; hint: string; icon: LucideIcon }[] }[] = [
  {
    group: "School",
    items: [
      { key: "school", label: "School profile", hint: "Name, logo, contact", icon: School },
      { key: "academic", label: "Academic year", hint: "Session, shifts, grading", icon: CalendarRange },
    ],
  },
  {
    group: "Communication",
    items: [
      { key: "notifications", label: "Notifications", hint: "SMS, email, app alerts", icon: Bell },
      { key: "preferences", label: "Appearance", hint: "Theme, language", icon: Palette },
    ],
  },
  {
    group: "Access",
    items: [
      { key: "permissions", label: "Roles & permissions", hint: "Who can do what", icon: ShieldCheck },
      { key: "security", label: "Security", hint: "Sign-in, sessions", icon: KeyRound },
    ],
  },
];

const KEYS = NAV.flatMap((g) => g.items.map((i) => i.key));
const isTab = (s: string): s is Tab => (KEYS as string[]).includes(s);

const SECTIONS: Record<Tab, () => React.ReactNode> = {
  school: SchoolProfileSection,
  academic: AcademicSection,
  notifications: NotificationsSection,
  preferences: AppearanceSection,
  permissions: RolesSection,
  security: SecuritySection,
};

export function SettingsView() {
  const hydrated = useSettingsHydrated();
  const reset = useSettingsStore((s) => s.reset);
  const [tab, setTab] = useState<Tab>("school");
  const [resets, setResets] = useState(0);

  // Deep-link to a tab with #security etc.
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (isTab(h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  const Section = SECTIONS[tab];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your school profile, academic year, notifications, roles and security."
        actions={
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await confirmAction({ title: "Reset all settings?", description: "Every section goes back to its default values.", confirmLabel: "Reset", tone: "danger" });
              if (!ok) return;
              reset();
              setResets((n) => n + 1);
              toast("Settings reset to defaults");
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset defaults
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[16.5rem_1fr]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24">
          {/* Mobile: horizontal pills */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
            {NAV.flatMap((g) => g.items).map((i) => (
              <button
                key={i.key}
                type="button"
                onClick={() => go(i.key)}
                aria-current={tab === i.key ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition",
                  tab === i.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-line-strong bg-surface text-fg-muted",
                )}
              >
                <i.icon className="h-4 w-4" />
                {i.label}
              </button>
            ))}
          </div>

          {/* Desktop: grouped side menu */}
          <Card className="hidden p-3 lg:block">
            {NAV.map((g) => (
              <div key={g.group} className="mb-3 last:mb-0">
                <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{g.group}</p>
                <ul className="space-y-0.5">
                  {g.items.map((i) => {
                    const active = tab === i.key;
                    return (
                      <li key={i.key}>
                        <button
                          type="button"
                          onClick={() => go(i.key)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                            active ? "bg-indigo-50" : "hover:bg-subtle",
                          )}
                        >
                          {active && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-indigo-600" />}
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                              active ? "bg-indigo-600 text-white shadow-glow" : "bg-soft text-fg-muted group-hover:text-fg",
                            )}
                          >
                            <i.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className={cn("block text-sm font-semibold", active ? "text-indigo-700" : "text-fg")}>{i.label}</span>
                            <span className="block truncate text-xs text-fg-muted">{i.hint}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </Card>
        </nav>

        <div className="min-w-0">
          {hydrated ? (
            // Keyed so each section's draft starts from the saved values.
            <Section key={`${tab}-${resets}`} />
          ) : (
            <div className="space-y-4" aria-busy>
              <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-soft" />
              <div className="h-64 animate-pulse rounded-2xl bg-soft" />
              <div className="h-48 animate-pulse rounded-2xl bg-soft" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
