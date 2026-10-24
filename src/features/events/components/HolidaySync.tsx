"use client";

import { useEffect } from "react";

import { localToday, setSchoolHolidays } from "@/features/students/demoData/profile-data";

import { demoEvents } from "../demoData/mock-data";
import { useEventAdminStore } from "../store/event-admin.store";
import { holidayMap } from "../utils";

/**
 * Keeps the attendance / exam holiday registry in step with the school holidays
 * on the Events page. Mounted once in the dashboard and print layouts.
 * BACKEND: the server applies school holidays itself; remove this then.
 */
export function HolidaySync() {
  useEffect(() => {
    const apply = () => {
      const { added, edits, deleted } = useEventAdminStore.getState();
      const events = [...demoEvents(localToday()).map((e) => ({ ...e, ...edits[e.id] })), ...added].filter((e) => !deleted.includes(e.id));
      setSchoolHolidays(holidayMap(events));
    };
    if (!useEventAdminStore.persist.hasHydrated()) void useEventAdminStore.persist.rehydrate();
    apply();
    return useEventAdminStore.subscribe(apply);
  }, []);
  return null;
}
