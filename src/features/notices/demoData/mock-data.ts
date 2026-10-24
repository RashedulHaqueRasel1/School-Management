import { CURRENT_USER } from "@/features/admissions/constants";
import { addDaysIso } from "@/features/students/demoData/profile-data";

import type { Notice, NoticeCategory, NoticeGroup, NoticePriority } from "../types/types";

/*
 * Demo notice board, dated relative to today so it always looks current.
 * TODO (backend phase): GET /notices
 */

type Seed = {
  slug: string;
  title: string;
  category: NoticeCategory;
  priority?: NoticePriority;
  groups: NoticeGroup[];
  classes?: string[];
  /** Days from today (negative = past); null = draft. */
  day: number | null;
  time?: string;
  expires?: number;
  pinned?: boolean;
  archived?: boolean;
  sms?: boolean;
  attachment?: { name: string; size: number };
  body: string;
};

const SEEDS: Seed[] = [
  {
    slug: "annual-exam-routine-published",
    title: "Annual Exam 2026 routine published",
    category: "Exam",
    priority: "important",
    groups: ["students", "parents"],
    day: -1,
    time: "10:30",
    pinned: true,
    sms: true,
    attachment: { name: "annual-exam-routine-2026.pdf", size: 184_320 },
    body: "The routine for the Annual Examination 2026 is now available. Papers begin on 6 December and run until 15 December.\n\nStudents must collect their admit cards from the class teacher one week before the exam. Admit cards will not be issued while two or more months of tuition are unpaid.\n\nPlease be seated 15 minutes before each paper. Mobile phones and smart watches are not allowed in the exam hall.",
  },
  {
    slug: "tuition-deadline-extended",
    title: "Tuition fee deadline for October extended to 31 October",
    category: "Finance",
    groups: ["parents"],
    day: -2,
    time: "09:00",
    expires: 7,
    sms: true,
    body: "Considering the Durga Puja holidays, the deadline for October tuition has been extended to 31 October without a late notice.\n\nFees can be paid at the accounts office (9 AM – 2 PM) or through bKash, Nagad and bank transfer. Please keep the payment slip.",
  },
  {
    slug: "staff-meeting-thursday",
    title: "Staff meeting on Thursday at 2:00 PM",
    category: "Staff",
    groups: ["teachers"],
    day: -3,
    time: "15:10",
    body: "All teachers are requested to attend a staff meeting in the conference room on Thursday at 2:00 PM.\n\nAgenda: annual exam duties, result processing timeline and the winter sports week.",
  },
  {
    slug: "winter-uniform-from-november",
    title: "Winter uniform mandatory from 15 November",
    category: "General",
    groups: ["students", "parents"],
    day: -4,
    time: "11:00",
    body: "The winter uniform (navy blazer or sweater with the school logo) becomes mandatory from 15 November. Uniforms are available at the school store.",
  },
  {
    slug: "victory-day-celebration",
    title: "Victory Day celebration — cultural programme",
    category: "Event",
    groups: ["students", "parents", "teachers"],
    day: 3,
    time: "08:00",
    body: "The school will celebrate Victory Day on 16 December with a flag hoisting, discussion and cultural programme. Students interested in performing should register with their class teacher by 30 November.",
  },
  {
    slug: "science-fair-class-6-8",
    title: "Inter-class science fair for Classes 6–8",
    category: "Academic",
    groups: ["students", "parents"],
    classes: ["Class 6", "Class 7", "Class 8"],
    day: -6,
    time: "12:00",
    body: "A science fair will be held on the school ground for Classes 6 to 8. Teams of up to three students may submit a project. Registration closes next Thursday.\n\nThe best three projects will represent the school at the district science fair.",
  },
  {
    slug: "school-closed-heavy-rain",
    title: "School closed tomorrow due to heavy rain",
    category: "Urgent",
    priority: "urgent",
    groups: ["students", "parents", "teachers"],
    day: -9,
    time: "18:45",
    expires: -8,
    sms: true,
    body: "Due to the heavy rainfall warning, the school will remain closed tomorrow. Classes will resume as usual the day after. Stay safe.",
  },
  {
    slug: "durga-puja-holidays",
    title: "Holidays for Durga Puja and Bijoya Dashami",
    category: "Holiday",
    groups: ["students", "parents", "teachers"],
    day: -12,
    time: "10:00",
    body: "The school will remain closed on 20 and 21 October for Durga Puja and Bijoya Dashami. Classes resume on 22 October.",
  },
  {
    slug: "class-10-model-test",
    title: "Model test for Class 10 (SSC candidates)",
    category: "Exam",
    groups: ["students", "parents"],
    classes: ["Class 10"],
    day: -15,
    time: "13:30",
    body: "A model test for SSC candidates will be held after the annual exam. The routine and syllabus will be shared by the class teacher.",
  },
  {
    slug: "parent-teacher-meeting-draft",
    title: "Parent–teacher meeting after the annual exam",
    category: "Academic",
    groups: ["parents"],
    day: null,
    body: "Parents are invited to a meeting with class teachers to discuss their child's progress and the annual exam results.\n\nDate and time will be confirmed.",
  },
  {
    slug: "library-week",
    title: "Library week — book reading competition",
    category: "Event",
    groups: ["students"],
    classes: ["Class 3", "Class 4", "Class 5"],
    day: -40,
    time: "09:30",
    expires: -25,
    archived: true,
    body: "During library week, students of Classes 3–5 can join the book reading competition. Prizes for the top readers.",
  },
];

export function demoNotices(today: string): Notice[] {
  return SEEDS.map((s, i) => {
    const date = s.day === null ? null : addDaysIso(today, s.day);
    const at = date ? `${date}T${s.time ?? "09:00"}:00` : null;
    const created = at ?? `${addDaysIso(today, -1)}T16:00:00`;
    return {
      id: `NTC-${String(i + 1).padStart(3, "0")}`,
      slug: s.slug,
      title: s.title,
      body: s.body,
      category: s.category,
      priority: s.priority ?? "normal",
      groups: s.groups,
      classes: s.classes ?? [],
      publishAt: at,
      expiresOn: s.expires === undefined ? undefined : addDaysIso(today, s.expires),
      pinned: s.pinned ?? false,
      archived: s.archived ?? false,
      sms: s.sms ?? false,
      email: true,
      attachment: s.attachment,
      createdBy: CURRENT_USER,
      createdAt: created,
      updatedAt: created,
      custom: false,
    };
  });
}
