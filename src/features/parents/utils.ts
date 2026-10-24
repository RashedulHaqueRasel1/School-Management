import { slugify } from "@/features/admissions/utils";

import type { Parent, ParentFilters, PortalAccount } from "./types/types";

export type ParentTab = "children" | "fees" | "messages" | "meetings" | "account" | "edit";

/** "abdul-uddin-4521" — name + last 4 digits of the mobile. */
export function parentSlug(p: Pick<Parent, "name" | "key">) {
  return `${slugify(p.name) || "guardian"}-${p.key.slice(-4)}`;
}

export function parentHref(p: Pick<Parent, "name" | "key">, tab?: ParentTab) {
  return `/parents/${parentSlug(p)}${tab ? `/${tab}` : ""}`;
}

export const DEFAULT_PARENT_FILTERS: ParentFilters = { search: "", view: "all", className: "all", portal: "all", sort: "name" };

export function filterParents(list: Parent[], f: ParentFilters, accountOf: (p: Parent) => PortalAccount) {
  const q = f.search.trim().toLowerCase();
  const classIndex = (p: Parent) => Math.min(...p.links.map((l) => Number(l.student.className.replace(/\D/g, "")) || 0));
  return list
    .filter((p) => {
      if (f.view === "inactive" ? !p.inactive : p.inactive) return false;
      if (f.view === "father" && !p.roles.includes("Father")) return false;
      if (f.view === "mother" && !p.roles.includes("Mother")) return false;
      if (f.view === "guardian" && !p.roles.includes("Local guardian")) return false;
      if (f.view === "multi" && p.links.length < 2) return false;
      if (f.className !== "all" && !p.links.some((l) => l.student.className === f.className)) return false;
      if (f.portal !== "all" && (accountOf(p).status === "active") !== (f.portal === "active")) return false;
      if (!q) return true;
      return [p.name, p.phone, p.email, p.id, ...p.links.flatMap((l) => [l.student.name, l.student.id])].some((v) => v.toLowerCase().includes(q));
    })
    .sort((a, b) => (f.sort === "children" ? b.links.length - a.links.length || a.name.localeCompare(b.name) : f.sort === "class" ? classIndex(a) - classIndex(b) : a.name.localeCompare(b.name)));
}

export function exportParentsCsv(list: Parent[]) {
  const header = ["Guardian ID", "Name", "Role", "Mobile", "Email", "Occupation", "Children", "Classes"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = list.map((p) =>
    [p.id, p.name, p.roles.join(" / "), p.phone, p.email, p.occupation, p.links.map((l) => `${l.student.name} (${l.student.id})`).join("; "), p.links.map((l) => `${l.student.className} ${l.student.section}`).join("; ")]
      .map(esc)
      .join(","),
  );
  const blob = new Blob([[header.map(esc).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guardians-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
