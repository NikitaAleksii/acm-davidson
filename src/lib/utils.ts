import { site } from "./site";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseTags(tags: string | null | undefined): string[] {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function joinTags(tags: string[]) {
  return Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).join(",");
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: site.timeZone,
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: site.timeZone,
});

const longDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: site.timeZone,
});

export function formatDate(d: Date) {
  return dateFmt.format(d);
}
export function formatLongDate(d: Date) {
  return longDateFmt.format(d);
}
export function formatTime(d: Date) {
  return timeFmt.format(d);
}
export function formatDateTime(d: Date) {
  return `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

/** Formats an event's time range, e.g. "Thu, Oct 2, 2025 · 6:00 PM – 7:30 PM". */
export function formatEventRange(start: Date, end?: Date | null) {
  if (!end) return formatDateTime(start);
  const sameDay = dateFmt.format(start) === dateFmt.format(end);
  return sameDay
    ? `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

/** Converts a Date to the value expected by <input type="datetime-local"> in the site time zone. */
export function toDateTimeLocal(d: Date | null | undefined) {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: site.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** Parses a datetime-local string as a wall-clock time in the site time zone. */
export function fromDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  // Find the UTC instant whose wall-clock time in the site TZ equals the input.
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(guess));
  const first = new Date(guess - offset);
  // Re-check for DST boundary shifts.
  const offset2 = tzOffsetMs(first);
  return offset2 === offset ? first : new Date(guess - offset2);
}

function tzOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: site.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const hour = get("hour") === 24 ? 0 : get("hour");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asUtc - date.getTime();
}

export function truncate(s: string, n = 160) {
  const clean = s.replace(/[#*_>`\[\]]/g, "").replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
