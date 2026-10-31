import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SchoolProfile = {
  name: string;
  shortName: string;
  eiin: string;
  established: string;
  board: string;
  principal: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  motto: string;
};

export type AcademicSettings = {
  year: string;
  sessionStart: string;
  sessionEnd: string;
  shifts: string[];
  versions: string[];
  grading: "gpa5" | "gpa4" | "percent";
  workingDays: string[];
  periodMinutes: number;
  passMark: number;
};

export type NotifyEvent = "absent" | "feeDue" | "results" | "notices" | "events" | "admission";
export type NotifyChannel = "sms" | "email" | "push";
export type NotificationSettings = Record<NotifyEvent, Record<NotifyChannel, boolean>>;

export type Preferences = {
  language: "en" | "bn";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  currency: "BDT" | "USD";
  timezone: string;
  compact: boolean;
};

export type RoleKey = "admin" | "principal" | "teacher" | "accountant" | "staff";
export type PermissionLevel = "none" | "view" | "edit" | "full";
export type PermissionModule = "students" | "teachers" | "attendance" | "examinations" | "fees" | "notices" | "reports" | "settings";
export type Permissions = Record<RoleKey, Record<PermissionModule, PermissionLevel>>;

export type SecuritySettings = {
  twoFactor: boolean;
  sessionTimeout: number;
  minPasswordLength: number;
  requireSymbols: boolean;
  loginAlerts: boolean;
};

export type SettingsState = {
  school: SchoolProfile;
  academic: AcademicSettings;
  notifications: NotificationSettings;
  preferences: Preferences;
  permissions: Permissions;
  security: SecuritySettings;
  /** Last save time per section (ISO). */
  savedAt: Partial<Record<SettingsSection, string>>;
  save: <K extends SavableKey>(key: K, value: SettingsState[K]) => void;
  reset: () => void;
};

export type SavableKey = "school" | "academic" | "notifications" | "preferences" | "permissions" | "security";
export type SettingsSection = SavableKey;

export const DEFAULTS: Pick<SettingsState, SavableKey> = {
  school: {
    name: "Greenfield Model High School",
    shortName: "GMHS",
    eiin: "108245",
    established: "1998",
    board: "Dhaka",
    principal: "Dr. Mahbubur Rahman",
    phone: "+880 1711-234567",
    email: "info@greenfield.edu.bd",
    website: "greenfield.edu.bd",
    address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
    motto: "Knowledge · Discipline · Service",
  },
  academic: {
    year: "2026",
    sessionStart: "January",
    sessionEnd: "December",
    shifts: ["Morning", "Day"],
    versions: ["Bangla", "English"],
    grading: "gpa5",
    workingDays: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"],
    periodMinutes: 40,
    passMark: 33,
  },
  notifications: {
    absent: { sms: true, email: false, push: true },
    feeDue: { sms: true, email: true, push: true },
    results: { sms: true, email: true, push: true },
    notices: { sms: false, email: true, push: true },
    events: { sms: false, email: false, push: true },
    admission: { sms: true, email: true, push: false },
  },
  preferences: {
    language: "en",
    dateFormat: "DD/MM/YYYY",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    compact: false,
  },
  permissions: {
    admin: { students: "full", teachers: "full", attendance: "full", examinations: "full", fees: "full", notices: "full", reports: "full", settings: "full" },
    principal: { students: "edit", teachers: "edit", attendance: "view", examinations: "full", fees: "view", notices: "full", reports: "full", settings: "view" },
    teacher: { students: "view", teachers: "none", attendance: "edit", examinations: "edit", fees: "none", notices: "view", reports: "view", settings: "none" },
    accountant: { students: "view", teachers: "none", attendance: "none", examinations: "none", fees: "full", notices: "view", reports: "edit", settings: "none" },
    staff: { students: "view", teachers: "none", attendance: "edit", examinations: "none", fees: "none", notices: "view", reports: "none", settings: "none" },
  },
  security: {
    twoFactor: false,
    sessionTimeout: 30,
    minPasswordLength: 8,
    requireSymbols: true,
    loginAlerts: true,
  },
};

/** School-wide settings (localStorage demo). */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      savedAt: {},
      // BACKEND: PUT /settings/{key}
      save: (key, value) => set((s) => ({ [key]: value, savedAt: { ...s.savedAt, [key]: new Date().toISOString() } }) as Partial<SettingsState>),
      reset: () => set({ ...DEFAULTS, savedAt: {} }),
    }),
    {
      name: "settings-demo",
      skipHydration: true,
      partialize: (s) => ({ school: s.school, academic: s.academic, notifications: s.notifications, preferences: s.preferences, permissions: s.permissions, security: s.security, savedAt: s.savedAt }),
    },
  ),
);

export function useSettingsHydrated() {
  const hydrated = useSyncExternalStore(
    (onChange) => useSettingsStore.persist.onFinishHydration(onChange),
    () => useSettingsStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useSettingsStore.persist.hasHydrated()) void useSettingsStore.persist.rehydrate();
  }, []);
  return hydrated;
}
