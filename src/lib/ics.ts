import { site } from "./site";

type IcsEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt?: Date | null;
  url: string;
};

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 requires lines to be at most 75 octets; fold longer lines. */
function fold(line: string) {
  const out: string[] = [];
  let cur = line;
  while (cur.length > 73) {
    out.push(cur.slice(0, 73));
    cur = " " + cur.slice(73);
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildIcs(ev: IcsEvent): string {
  const end = ev.endsAt ?? new Date(ev.startsAt.getTime() + 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Events//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.id}@${new URL(site.url).hostname}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(ev.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(ev.title)}`,
    `DESCRIPTION:${escapeText(ev.description)}\\n\\n${escapeText(ev.url)}`,
    `LOCATION:${escapeText(ev.location)}`,
    `URL:${ev.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
