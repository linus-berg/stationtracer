/**
 * Sun position and sunrise/sunset, computed locally (no network needed).
 * Formulas after Vladimir Agafonkin's SunCalc (BSD-2), itself based on
 * https://aa.quae.nl/en/reken/zonpositie.html — accurate to about a minute.
 */
const rad = Math.PI / 180;
const dayMs = 86_400_000;
const J1970 = 2440588;
const J2000 = 2451545;
const J0 = 0.0009;
const obliquity = rad * 23.4397;
/** Sun's upper limb on the horizon, including refraction. */
const HORIZON = -0.833 * rad;

const toDays = (date: Date) => date.getTime() / dayMs - 0.5 + J1970 - J2000;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs);

const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);

function eclipticLongitude(M: number) {
  const center = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + center + rad * 102.9372 + Math.PI;
}

const declination = (L: number) => Math.asin(Math.sin(obliquity) * Math.sin(L));
const rightAscension = (L: number) => Math.atan2(Math.sin(L) * Math.cos(obliquity), Math.cos(L));

/** Sun altitude above the horizon, in radians. */
export function sunAltitude(date: Date, lat: number, lon: number): number {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(date);
  const L = eclipticLongitude(solarMeanAnomaly(d));
  const dec = declination(L);
  const H = rad * (280.16 + 360.9856235 * d) - lw - rightAscension(L);
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}

export const isDaylight = (date: Date, lat: number, lon: number) => sunAltitude(date, lat, lon) > HORIZON;

export interface SunTimes {
  /** null during polar night / midnight sun. */
  sunrise: Date | null;
  sunset: Date | null;
}

/** Sunrise and sunset for the local calendar day containing `date`. */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const lw = rad * -lon;
  const phi = rad * lat;
  const n = Math.round(toDays(noon) - J0 - lw / (2 * Math.PI));
  const ds = J0 + lw / (2 * Math.PI) + n;
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const transit = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);

  const cosW = (Math.sin(HORIZON) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosW < -1 || cosW > 1) return { sunrise: null, sunset: null };
  const w = Math.acos(cosW);
  const set = J2000 + J0 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  return { sunrise: fromJulian(transit - (set - transit)), sunset: fromJulian(set) };
}
