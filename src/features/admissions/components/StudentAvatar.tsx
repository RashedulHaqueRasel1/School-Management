import Image from "next/image";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sizes = {
  md: { box: "h-9 w-9", px: 36, avatar: "md" as const },
  lg: { box: "h-12 w-12", px: 48, avatar: "lg" as const },
  xl: { box: "h-24 w-24 sm:h-28 sm:w-28", px: 112, avatar: "lg" as const },
};

type StudentAvatarProps = {
  name: string;
  photo: string | null;
  size?: keyof typeof sizes;
  className?: string;
};

/** Student photo, or coloured initials when no photo was uploaded. */
export function StudentAvatar({ name, photo, size = "md", className }: StudentAvatarProps) {
  const s = sizes[size];
  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        width={s.px}
        height={s.px}
        unoptimized
        className={cn(s.box, "shrink-0 rounded-full object-cover", size === "xl" && "rounded-2xl", className)}
      />
    );
  }
  return (
    <Avatar
      name={name}
      size={s.avatar}
      className={cn(size === "xl" && "h-24 w-24 rounded-2xl text-2xl sm:h-28 sm:w-28", size === "lg" && "h-12 w-12 text-base", className)}
    />
  );
}
