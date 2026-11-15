import { config } from '../config';
import type { DepartureMetadata, Deviation, SlDeparturesResponse } from '../types/DepartureMetadata';
import { DataFileError } from './fetchData';

export interface Departure {
  key: string;
  line: string;
  destination: string;
  via?: string;
  stopArea?: string;
  stopPoint?: string;
  scheduled: Date;
  /** Real-time estimate when available, otherwise the timetable. */
  expected: Date;
  delayMinutes: number;
  cancelled: boolean;
  /** SL already reports this bus as gone. */
  departed: boolean;
  deviations: Deviation[];
}

export interface DepartureBoard {
  departures: Departure[];
  stopDeviations: Deviation[];
  /** The stop area most departures leave from, used as the board title. */
  primaryStopArea?: string;
}

export interface Disruption {
  message: string;
  lines: string[];
  importance: number;
}

const GONE_STATES = new Set(['DEPARTED', 'PASSED', 'ASSUMEDDEPARTED', 'MISSED']);
const CANCELLED_STATES = new Set(['CANCELLED']);
const CANCELLED_JOURNEY_STATES = new Set(['CANCELLED', 'ABORTED']);

/** SL times are local Stockholm time without an offset, which `Date` parses as local. */
function parseSlTime(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function normalize(d: DepartureMetadata): Departure | null {
  const scheduled = parseSlTime(d.scheduled);
  const expected = parseSlTime(d.expected) ?? scheduled;
  if (!scheduled || !expected || !d.line?.designation) return null;
  return {
    key: `${d.journey?.id}-${d.stop_point?.id ?? ''}-${d.scheduled}`,
    line: d.line.designation,
    destination: d.destination?.trim() || d.direction?.trim() || '',
    via: d.via?.trim() || undefined,
    stopArea: d.stop_area?.name,
    stopPoint: d.stop_point?.designation,
    scheduled,
    expected,
    delayMinutes: Math.round((expected.getTime() - scheduled.getTime()) / 60_000),
    cancelled: CANCELLED_STATES.has(d.state) || CANCELLED_JOURNEY_STATES.has(d.journey?.state ?? ''),
    departed: GONE_STATES.has(d.state),
    deviations: (d.deviations ?? []).filter((x) => x.message),
  };
}

function mostCommon(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  for (const [v, n] of counts) if (!best || n > counts.get(best)!) best = v;
  return best;
}

export function parseDepartures(raw: unknown): DepartureBoard {
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as SlDeparturesResponse).departures)) {
    throw new DataFileError("The departures file isn't an SL departures response.");
  }
  const response = raw as SlDeparturesResponse;
  const departures = response.departures
    .map(normalize)
    .filter((d): d is Departure => d !== null)
    .sort((a, b) => a.expected.getTime() - b.expected.getTime());
  return {
    departures,
    stopDeviations: (response.stop_deviations ?? []).filter((x) => x.message),
    primaryStopArea: mostCommon(departures.map((d) => d.stopArea)),
  };
}

/**
 * Departures that haven't left yet. The synced file can be minutes old, so
 * this is decided against the local clock rather than SL's `display` text.
 */
export function upcoming(departures: Departure[], now: Date): Departure[] {
  const cutoff = now.getTime() - config.departureGraceMs;
  return departures.filter((d) => {
    if (d.departed) return false;
    const time = d.cancelled ? d.scheduled : d.expected;
    return time.getTime() >= cutoff;
  });
}

/** Unique disruption messages, most important first, with the lines they affect. */
export function collectDisruptions(board: DepartureBoard, visible: Departure[]): Disruption[] {
  const byMessage = new Map<string, Disruption>();
  const add = (dev: Deviation, line?: string) => {
    const message = dev.message!.trim();
    const existing = byMessage.get(message);
    if (existing) {
      if (line && !existing.lines.includes(line)) existing.lines.push(line);
      existing.importance = Math.max(existing.importance, dev.importance_level ?? 0);
    } else {
      byMessage.set(message, { message, lines: line ? [line] : [], importance: dev.importance_level ?? 0 });
    }
  };
  board.stopDeviations.forEach((dev) => add(dev));
  visible.forEach((d) => d.deviations.forEach((dev) => add(dev, d.line)));
  return [...byMessage.values()].sort((a, b) => b.importance - a.importance);
}
