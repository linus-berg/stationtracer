/**
 * SMHI publishes point forecasts in two formats. /data/smhi.json may contain
 * either, and both are normalised into `Forecast` by src/lib/smhi.ts.
 */

/** Legacy pmp3g/version/2 format (retired by SMHI, endpoint now returns 404). */
export interface Pmp3gResponse {
  approvedTime?: string;
  referenceTime?: string;
  geometry?: { type: string; coordinates: number[][] };
  timeSeries: Pmp3gTimeSeries[];
}

export interface Pmp3gTimeSeries {
  validTime: string;
  parameters: Pmp3gParameter[];
}

export interface Pmp3gParameter {
  name: string;
  levelType: string;
  level: number;
  unit: string;
  values: number[];
}

/** Current snow1g/version/1 format. */
export interface Snow1gResponse {
  createdTime?: string;
  referenceTime?: string;
  geometry?: { type: string; coordinates: number[] };
  timeSeries: Snow1gTimeSeries[];
}

export interface Snow1gTimeSeries {
  time: string;
  intervalParametersStartTime?: string;
  data: Record<string, number | undefined>;
}

/** Format-independent forecast used by the UI. */
export interface ForecastPoint {
  time: Date;
  temperature: number;
  /** SMHI weather symbol, 1–27 (same table in both formats). */
  symbol?: number;
  windSpeed?: number;
  windGust?: number;
  /** Degrees the wind blows *from*. */
  windDirection?: number;
  /** Mean precipitation intensity, mm/h. */
  precipitation?: number;
  /** Probability of precipitation, 0–100 (snow1g only). */
  precipProbability?: number;
}

export interface Forecast {
  issued?: Date;
  location: { lat: number; lon: number };
  points: ForecastPoint[];
}
