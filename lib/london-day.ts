/** Start (inclusive) and end (exclusive) of the current Europe/London calendar day. */
export function londonDayRange(now = new Date()): { start: Date; end: Date } {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextYmd = next.toISOString().slice(0, 10);

  return {
    start: londonMidnight(ymd),
    end: londonMidnight(nextYmd),
  };
}

function londonMidnight(ymd: string): Date {
  const guess = new Date(`${ymd}T00:00:00Z`);
  const offset = tzOffsetMinutes("Europe/London", guess);
  let start = new Date(guess.getTime() - offset * 60_000);
  const offsetAtStart = tzOffsetMinutes("Europe/London", start);
  if (offsetAtStart !== offset) {
    start = new Date(guess.getTime() - offsetAtStart * 60_000);
  }
  return start;
}

function tzOffsetMinutes(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second")
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}
