/** "08:14 AM" → "08:14" (for <input type="time">) */
export function toInputTime(display?: string) {
  const match = /(\d+):(\d+) (AM|PM)/.exec(display ?? "");
  if (!match) return "";
  const h = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${match[2]}`;
}

/** "13:42" → "01:42 PM" */
export function toDisplayTime(input: string) {
  if (!input) return undefined;
  const [h, m] = input.split(":").map(Number) as [number, number];
  return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
