"use client";

import { useRouter } from "next/navigation";

import { confirmAction } from "@/store/confirm.store";
import { toast } from "@/store/toast.store";

import { useGuardianActions } from "../../hooks/use-guardian-actions";
import { useParent } from "../../hooks/use-parent";
import { useParentAdminStore } from "../../store/parent-admin.store";
import { parentHref } from "../../utils";
import { ParentForm } from "../form/ParentForm";

export function EditParentView({ slug }: { slug: string }) {
  const router = useRouter();
  const { parent, parents, students, profile } = useParent(slug);
  const actions = useGuardianActions();
  const setProfile = useParentAdminStore((s) => s.setProfile);
  if (!parent || !profile) return null;

  return (
    <ParentForm
      key={parent.key}
      initial={{ parent, profile }}
      parents={parents}
      students={students}
      submitLabel="Save changes"
      cancelHref={parentHref(parent)}
      onSubmit={async (v) => {
        const patch = { name: v.name, phone: v.phone, email: v.email, occupation: v.occupation, nid: v.nid };
        const changed = (Object.keys(patch) as (keyof typeof patch)[]).filter((k) => patch[k] !== parent[k]);
        const ok = await confirmAction({
          title: "Save guardian changes?",
          description: `${changed.length ? `Changes: ${changed.join(", ")}. ` : ""}Applied to all ${parent.links.length} linked child(ren).`,
          confirmLabel: "Save changes",
        });
        if (!ok) return;
        if (changed.length) actions.update(parent, patch, changed);
        const prefs = { address: v.address || undefined, preferredChannel: v.preferredChannel, language: v.language, notes: v.notes || undefined };
        if (v.address !== parent.address || v.preferredChannel !== profile.preferredChannel || v.language !== profile.language || (v.notes || undefined) !== profile.notes) {
          setProfile(v.phone, prefs, "Address / preferences updated");
        }
        toast("Guardian updated", { description: `${v.name}${changed.length ? ` · ${changed.join(", ")}` : ""}` });
        router.push(parentHref({ name: v.name, key: v.phone }));
      }}
    />
  );
}
