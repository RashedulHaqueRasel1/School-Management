import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  School,
  Settings,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/** Sidebar navigation. Add a route here and create `app/(dashboard)/<href>/page.tsx`. */
export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { title: "Admissions Management", href: "/admissions", icon: UserPlus },
      { title: "Students", href: "/students", icon: GraduationCap },
      { title: "Teachers", href: "/teachers", icon: Users },
      { title: "Parents & Guardians", href: "/parents", icon: UsersRound },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Classes & Sections", href: "/classes", icon: School },
      { title: "Subjects", href: "/subjects", icon: BookOpen },
      { title: "Attendance", href: "/attendance", icon: CalendarCheck },
      { title: "Examinations", href: "/examinations", icon: ClipboardList },
      { title: "Results", href: "/results", icon: Trophy },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Fees & Payments", href: "/fees", icon: Wallet },
      { title: "Notices", href: "/notices", icon: Megaphone },
      { title: "Events & Holidays", href: "/events", icon: CalendarDays },
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const allNavItems = navigation.flatMap((group) => group.items);

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolve the nav item (and its group label) for the current path. */
export function findNavItem(pathname: string) {
  for (const group of navigation) {
    const item = group.items.find((i) => isActivePath(pathname, i.href));
    if (item) return { ...item, group: group.label };
  }
  return undefined;
}
