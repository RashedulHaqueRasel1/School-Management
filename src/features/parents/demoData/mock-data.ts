import { CURRENT_USER, SCHOOL_INFO } from "@/features/admissions/constants";
import { addDaysIso, hash, localToday } from "@/features/students/demoData/profile-data";

import type { MeetingMode, MessageTemplate, Parent, ParentMeeting, ParentMessage } from "../types/types";

/*
 * Demo communication history per guardian (deterministic by mobile number).
 * TODO (backend phase): GET /parents/:id/messages · /meetings
 */

export const TEMPLATE_LABEL: Record<MessageTemplate, string> = {
  general: "General message",
  fee: "Fee reminder",
  meeting: "Meeting invitation",
  absence: "Absence alert",
  result: "Result published",
  event: "Event / holiday notice",
};

export const MEETING_MODES: MeetingMode[] = ["In person", "Phone call", "Online"];

const SCHOOL = SCHOOL_INFO.name;

/** Ready-made text for each template. `child` is the student's first name. */
export function buildTemplate(template: MessageTemplate, ctx: { guardian: string; child?: string; className?: string; amount?: string; date?: string }) {
  const child = ctx.child ?? "your child";
  switch (template) {
    case "fee":
      return {
        subject: `Tuition fee reminder — ${child}`,
        body: `Dear ${ctx.guardian}, tuition fee of ${ctx.amount ?? "the due amount"} for ${child}${ctx.className ? ` (${ctx.className})` : ""} is pending. Please pay by the 10th to avoid a late fine. – ${SCHOOL}`,
      };
    case "meeting":
      return {
        subject: `Parent–teacher meeting — ${child}`,
        body: `Dear ${ctx.guardian}, you are invited to a parent–teacher meeting about ${child} on ${ctx.date ?? "[date]"}. Please confirm by replying YES. – ${SCHOOL}`,
      };
    case "absence":
      return {
        subject: `Absence alert — ${child}`,
        body: `Dear ${ctx.guardian}, ${child} was absent from school today without notice. Please inform the class teacher of the reason. – ${SCHOOL}`,
      };
    case "result":
      return {
        subject: `Exam result published — ${child}`,
        body: `Dear ${ctx.guardian}, ${child}'s exam result has been published. Log in to the guardian portal to view the marksheet. – ${SCHOOL}`,
      };
    case "event":
      return {
        subject: "School notice",
        body: `Dear ${ctx.guardian}, the school will remain closed on ${ctx.date ?? "[date]"}. Classes resume the next working day. – ${SCHOOL}`,
      };
    default:
      return { subject: "Message from school", body: `Dear ${ctx.guardian}, ` };
  }
}

const firstName = (name: string) => name.split(" ")[0] ?? name;

export function seedParentMessages(parent: Parent): ParentMessage[] {
  const today = localToday();
  const seed = hash(parent.key);
  const child = parent.links[0]?.student;
  if (!child) return [];
  const at = (days: number, hour: number) => `${addDaysIso(today, -days)}T0${hour}:15:00Z`;
  const list: ParentMessage[] = [
    {
      id: `PM-${parent.key.slice(-4)}-1`,
      parentKey: parent.key,
      template: "event",
      channel: "sms",
      ...buildTemplate("event", { guardian: parent.name, date: "Durga Puja (20–21 Oct)" }),
      sentAt: at(6 + (seed % 3), 4),
      sentBy: CURRENT_USER,
      bulk: true,
      status: "delivered",
    },
    {
      id: `PM-${parent.key.slice(-4)}-2`,
      parentKey: parent.key,
      template: "result",
      channel: parent.email ? "both" : "sms",
      ...buildTemplate("result", { guardian: parent.name, child: firstName(child.name) }),
      studentName: child.name,
      sentAt: at(40 + (seed % 10), 5),
      sentBy: CURRENT_USER,
      bulk: true,
      status: "delivered",
    },
  ];
  if (seed % 3 === 0) {
    list.push({
      id: `PM-${parent.key.slice(-4)}-3`,
      parentKey: parent.key,
      template: "absence",
      channel: "sms",
      ...buildTemplate("absence", { guardian: parent.name, child: firstName(child.name) }),
      studentName: child.name,
      sentAt: at(15 + (seed % 7), 3),
      sentBy: "Attendance system",
      status: "delivered",
    });
  }
  return list;
}

export function seedParentMeetings(parent: Parent, classTeacher: (studentId: string) => string): ParentMeeting[] {
  const seed = hash(`${parent.key}:meet`);
  const child = parent.links[0]?.student;
  if (!child) return [];
  const today = localToday();
  const list: ParentMeeting[] = [];
  if (seed % 3 !== 2) {
    list.push({
      id: `MT-${parent.key.slice(-4)}-1`,
      parentKey: parent.key,
      studentId: child.id,
      studentName: child.name,
      date: addDaysIso(today, -30 - (seed % 20)),
      time: "11:00",
      mode: "In person",
      withWhom: classTeacher(child.id),
      agenda: "Half-yearly result review and study plan.",
      status: "completed",
      outcome: "Discussed weak subjects; guardian agreed to a daily 1-hour revision routine at home.",
      createdAt: `${addDaysIso(today, -40 - (seed % 20))}T05:00:00Z`,
      createdBy: CURRENT_USER,
    });
  }
  if (seed % 4 === 1) {
    list.push({
      id: `MT-${parent.key.slice(-4)}-2`,
      parentKey: parent.key,
      studentId: child.id,
      studentName: child.name,
      date: addDaysIso(today, 3 + (seed % 6)),
      time: "10:30",
      mode: seed % 2 ? "Online" : "In person",
      withWhom: classTeacher(child.id),
      agenda: "Annual exam preparation and attendance.",
      status: "scheduled",
      createdAt: `${addDaysIso(today, -2)}T06:00:00Z`,
      createdBy: CURRENT_USER,
    });
  }
  return list;
}
