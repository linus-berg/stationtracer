import { config } from '../config';
import type {
  Forecast,
  ForecastPoint,
  Pmp3gResponse,
  Pmp3gTimeSeries,
  Snow1gResponse,
  Snow1gTimeSeries,
} from '../types/WeatherMetadata';
import { DataFileError } from './fetchData';
import { formatTime, isSameDay, startOfDay } from './time';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** SMHI uses -9 as "missing" for fields that can't be negative. */
const nonNegative = (v: number | undefined) => (v === undefined || v < 0 ? undefined : v);

const validDate = (s: string | undefined) => {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
};

function fromPmp3g(raw: Pmp3gResponse): Forecast {
  const value = (ts: Pmp3gTimeSeries, name: string) =>
    ts.parameters.find((p) => p.name === name)?.values?.[0];
  const points: ForecastPoint[] = [];
  for (const ts of raw.timeSeries) {
    const time = validDate(ts.validTime);
    const temperature = value(ts, 't');
    if (!time || temperature === undefined) continue;
    points.push({
      time,
      temperature,
      symbol: value(ts, 'Wsymb2'),
      windSpeed: nonNegative(value(ts, 'ws')),
      windGust: nonNegative(value(ts, 'gust')),
      windDirection: nonNegative(value(ts, 'wd')),
      precipitation: nonNegative(value(ts, 'pmean')),
    });
  }
  const [lon, lat] = raw.geometry?.coordinates?.[0] ?? [];
  return {
    issued: validDate(raw.referenceTime ?? raw.approvedTime),
    location: lat !== undefined && lon !== undefined ? { lat, lon } : config.defaultLocation,
    points,
  };
}

function fromSnow1g(raw: Snow1gResponse): Forecast {
  const points: ForecastPoint[] = [];
  for (const ts of raw.timeSeries as Snow1gTimeSeries[]) {
    const time = validDate(ts.time);
    const d = ts.data ?? {};
    if (!time || typeof d.air_temperature !== 'number') continue;
    points.push({
      time,
      temperature: d.air_temperature,
      symbol: d.symbol_code,
      windSpeed: nonNegative(d.wind_speed),
      windGust: nonNegative(d.wind_speed_of_gust),
      windDirection: nonNegative(d.wind_from_direction),
      precipitation: nonNegative(d.precipitation_amount_mean),
      precipProbability: nonNegative(d.probability_of_precipitation),
    });
  }
  const [lon, lat] = raw.geometry?.coordinates ?? [];
  return {
    issued: validDate(raw.referenceTime ?? raw.createdTime),
    location: lat !== undefined && lon !== undefined ? { lat, lon } : config.defaultLocation,
    points,
  };
}

/** Accepts either SMHI format and returns points sorted by time. */
export function parseForecast(raw: unknown): Forecast {
  if (!isObject(raw) || !Array.isArray(raw.timeSeries) || raw.timeSeries.length === 0) {
    throw new DataFileError("The weather file isn't an SMHI point forecast.");
  }
  const first = raw.timeSeries[0] as Record<string, unknown>;
  let forecast: Forecast;
  if ('validTime' in first && Array.isArray(first.parameters)) {
    forecast = fromPmp3g(raw as unknown as Pmp3gResponse);
  } else if ('time' in first && isObject(first.data)) {
    forecast = fromSnow1g(raw as unknown as Snow1gResponse);
  } else {
    throw new DataFileError('The weather file uses an SMHI format this display doesn\'t recognise.');
  }
  if (forecast.points.length === 0) {
    throw new DataFileError('The weather file has no forecast steps with a temperature.');
  }
  forecast.points.sort((a, b) => a.time.getTime() - b.time.getTime());
  return forecast;
}

type PrecipKind = 'rain' | 'sleet' | 'snow' | 'thunder';
type Sky = 'clear' | 'nearlyClear' | 'variable' | 'halfClear' | 'cloudy' | 'overcast' | 'fog';

export interface SymbolInfo {
  label: string;
  sky: Sky;
  precip?: PrecipKind;
  intensity?: 1 | 2 | 3;
  /** Showers: sun/moon peeks through. */
  showers?: boolean;
}

/** SMHI weather symbols (Wsymb2 / symbol_code), 1–27. */
const SYMBOLS: Record<number, SymbolInfo> = {
  1: { label: 'Clear sky', sky: 'clear' },
  2: { label: 'Nearly clear sky', sky: 'nearlyClear' },
  3: { label: 'Variable cloudiness', sky: 'variable' },
  4: { label: 'Partly cloudy', sky: 'halfClear' },
  5: { label: 'Cloudy', sky: 'cloudy' },
  6: { label: 'Overcast', sky: 'overcast' },
  7: { label: 'Fog', sky: 'fog' },
  8: { label: 'Light rain showers', sky: 'cloudy', precip: 'rain', intensity: 1, showers: true },
  9: { label: 'Rain showers', sky: 'cloudy', precip: 'rain', intensity: 2, showers: true },
  10: { label: 'Heavy rain showers', sky: 'cloudy', precip: 'rain', intensity: 3, showers: true },
  11: { label: 'Thunderstorm', sky: 'cloudy', precip: 'thunder', intensity: 2, showers: true },
  12: { label: 'Light sleet showers', sky: 'cloudy', precip: 'sleet', intensity: 1, showers: true },
  13: { label: 'Sleet showers', sky: 'cloudy', precip: 'sleet', intensity: 2, showers: true },
  14: { label: 'Heavy sleet showers', sky: 'cloudy', precip: 'sleet', intensity: 3, showers: true },
  15: { label: 'Light snow showers', sky: 'cloudy', precip: 'snow', intensity: 1, showers: true },
  16: { label: 'Snow showers', sky: 'cloudy', precip: 'snow', intensity: 2, showers: true },
  17: { label: 'Heavy snow showers', sky: 'cloudy', precip: 'snow', intensity: 3, showers: true },
  18: { label: 'Light rain', sky: 'overcast', precip: 'rain', intensity: 1 },
  19: { label: 'Rain', sky: 'overcast', precip: 'rain', intensity: 2 },
  20: { label: 'Heavy rain', sky: 'overcast', precip: 'rain', intensity: 3 },
  21: { label: 'Thunder', sky: 'overcast', precip: 'thunder', intensity: 1 },
  22: { label: 'Light sleet', sky: 'overcast', precip: 'sleet', intensity: 1 },
  23: { label: 'Sleet', sky: 'overcast', precip: 'sleet', intensity: 2 },
  24: { label: 'Heavy sleet', sky: 'overcast', precip: 'sleet', intensity: 3 },
  25: { label: 'Light snowfall', sky: 'overcast', precip: 'snow', intensity: 1 },
  26: { label: 'Snowfall', sky: 'overcast', precip: 'snow', intensity: 2 },
  27: { label: 'Heavy snowfall', sky: 'overcast', precip: 'snow', intensity: 3 },
};

export const symbolInfo = (symbol: number | undefined): SymbolInfo | undefined =>
  symbol === undefined ? undefined : SYMBOLS[Math.round(symbol)];

/** The forecast step covering `now`: the last point at or before it, else the first. */
export function currentPoint(points: ForecastPoint[], now: Date): ForecastPoint | undefined {
  let current: ForecastPoint | undefined;
  for (const p of points) {
    if (p.time.getTime() <= now.getTime() + 30 * 60_000) current = p;
    else break;
  }
  return current ?? points[0];
}

/** Wind chill as used by SMHI ("känns som"); only meaningful when cold and windy. */
export function feelsLike(temperature: number, windSpeed: number | undefined): number | undefined {
  if (windSpeed === undefined || temperature > 10 || windSpeed < 1.4) return undefined;
  const v = Math.pow(windSpeed, 0.16);
  return 13.12 + 0.6215 * temperature - 13.956 * v + 0.48669 * temperature * v;
}

const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
export const compassDirection = (degrees: number) => COMPASS[Math.round(degrees / 45) % 8];

const PRECIP_WORD: Record<PrecipKind, string> = {
  rain: 'Rain',
  sleet: 'Sleet',
  snow: 'Snow',
  thunder: 'Thunder showers',
};

const isWet = (p: ForecastPoint) => (p.precipitation ?? 0) >= 0.1;

function precipWord(p: ForecastPoint): string {
  const kind = symbolInfo(p.symbol)?.precip;
  if (kind) return PRECIP_WORD[kind];
  if (p.temperature <= 0) return 'Snow';
  if (p.temperature >= 3) return 'Rain';
  return 'Precipitation';
}

function whenText(time: Date, now: Date): string {
  if (isSameDay(time, now)) return formatTime(time);
  return `${formatTime(time)} tomorrow`;
}

/** One plain sentence about precipitation in the next 12 hours. */
export function precipitationOutlook(points: ForecastPoint[], now: Date): string {
  const horizon = now.getTime() + 12 * 3_600_000;
  const upcoming = points.filter(
    (p) => p.time.getTime() >= now.getTime() - 30 * 60_000 && p.time.getTime() <= horizon,
  );
  if (upcoming.length === 0) return '';
  const [first] = upcoming;
  if (isWet(first)) {
    const dry = upcoming.find((p) => !isWet(p));
    return dry
      ? `${precipWord(first)} until about ${whenText(dry.time, now)}`
      : `${precipWord(first)} for the next 12 hours`;
  }
  const wet = upcoming.find(isWet);
  return wet ? `${precipWord(wet)} from about ${whenText(wet.time, now)}` : 'Dry for the next 12 hours';
}

export interface DaySummary {
  date: Date;
  min: number;
  max: number;
  symbol?: number;
}

/** Min/max and a midday symbol for each of the next `days` calendar days after today. */
export function dailyOutlook(points: ForecastPoint[], now: Date, days: number): DaySummary[] {
  const today = startOfDay(now).getTime();
  const byDay = new Map<number, ForecastPoint[]>();
  for (const p of points) {
    const day = startOfDay(p.time).getTime();
    if (day <= today) continue;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(p);
  }
  return [...byDay.entries()]
    .filter(([, pts]) => pts.length >= 2)
    .slice(0, days)
    .map(([day, pts]) => {
      const temps = pts.map((p) => p.temperature);
      const midday = pts.reduce((best, p) =>
        Math.abs(p.time.getHours() - 13) < Math.abs(best.time.getHours() - 13) ? p : best,
      );
      return { date: new Date(day), min: Math.min(...temps), max: Math.max(...temps), symbol: midday.symbol };
    });
}
