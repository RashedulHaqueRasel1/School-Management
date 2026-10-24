import { EventsShell } from "@/features/events/components/EventsShell";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <EventsShell>{children}</EventsShell>;
}
