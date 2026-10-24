import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { slugify } from "@/features/admissions/utils";

import type { ClassLevel, SectionSettings } from "../types/types";

/*
 * Default class / section setup. Every class has sections A and B; admins can
 * add more (C, Science, …), change rooms, capacity, shift, version and the
 * class teacher. TODO (backend phase): GET /classes
 */

export const DEFAULT_SECTIONS = ["A", "B"];

export const sectionKey = (className: string, section: string) => `${className}::${section}`;
export const sectionSlug = (className: string, section: string) => slugify(`${className}-${section}`);
export const sectionLabel = (className: string, section: string) => `${className} · Section ${section}`;
/** "6A", "NU-B", "KG-A" — for the badge tile. */
export function sectionCode(className: string, section: string) {
  const sec = section.length <= 2 ? section : section.slice(0, 1).toUpperCase();
  if (className.startsWith("Class ")) return `${className.slice(6)}${sec}`;
  return `${className === "KG" ? "KG" : className.slice(0, 2).toUpperCase()}-${sec}`;
}

export function levelOf(className: string): ClassLevel {
  if (["Play", "Nursery", "KG"].includes(className)) return "Pre-primary";
  const grade = Number(className.replace(/\D/g, ""));
  if (!className.startsWith("Class ") || !grade) return "Other";
  return grade <= 5 ? "Primary" : "Secondary";
}

export const LEVELS: ClassLevel[] = ["Pre-primary", "Primary", "Secondary", "Other"];

export const classOrder = (className: string) => {
  const i = CLASS_OPTIONS.indexOf(className);
  return i === -1 ? 100 : i;
};

export function defaultSettings(className: string, section: string, majority: { shift?: string; version?: string }): SectionSettings {
  const grade = Number(className.replace(/\D/g, ""));
  const pre = levelOf(className) === "Pre-primary";
  const sectionIndex = Math.max(0, section.charCodeAt(0) - 64);
  return {
    room: pre ? `Room G0${classOrder(className) + 1}${section}` : `Room ${grade || 9}0${sectionIndex}`,
    capacity: pre ? 25 : 40,
    shift: majority.shift ?? "Morning",
    version: majority.version ?? "Bangla",
  };
}
