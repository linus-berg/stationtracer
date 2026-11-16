#!/usr/bin/env node
/**
 * Writes realistic sample files into public/data so the display can be
 * developed without the synced feeds. Times are relative to now.
 *
 *   yarn mock                    # SMHI snow1g format
 *   yarn mock --smhi=pmp3g       # legacy SMHI format
 *   yarn mock --watch            # regenerate every 30 s
 *   yarn mock --no-deviations    # without SL traffic notices
 *   yarn mock --at=2026-11-16T11:30   # pretend it's another time
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const smhiFormat = args.find((a) => a.startsWith('--smhi='))?.split('=')[1] ?? 'snow1g';
const watch = args.includes('--watch');
const withDeviations = !args.includes('--no-deviations');
const at = args.find((a) => a.startsWith('--at='))?.split('=')[1];
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');

const pad = (n) => String(n).padStart(2, '0');
/** SL format: local time without offset. */
const slTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const ROUTES = [
  { line: '53', destination: 'Henriksdalsberget', stop: 'A', every: 10, offset: 1 },
  { line: '53', destination: 'Karolinska institutet', stop: 'G', every: 10, offset: 4 },
  { line: '65', destination: 'Skeppsholmen', stop: 'L', every: 12, offset: 2 },
  { line: '65', destination: 'Hornsberg', stop: 'K', every: 12, offset: 7 },
  { line: '69', destination: 'Djurgårdsbrunn', stop: 'L', every: 15, offset: 9 },
  { line: '491', destination: 'Nyfors', stop: 'U', every: 30, offset: 14, via: 'Evlinge' },
  { line: '813C', destination: 'Tyresö centrum', stop: 'H', every: 20, offset: 11, area: 'Vattugatan' },
  { line: '443C', destination: 'Nacka strand', every: 15, offset: 5, area: 'Cityterminalen' },
];

function departures(now) {
  const list = [];
  let journey = 1;
  for (const r of ROUTES) {
    for (let m = r.offset; m < 150; m += r.every) {
      const scheduled = new Date(now.getTime() + m * 60_000);
      scheduled.setSeconds(0, 0);
      let expected = new Date(scheduled.getTime() + ((journey * 37) % 90) * 1000);
      let state = 'EXPECTED';
      if (r.line === '65' && m === r.offset + r.every) expected = new Date(scheduled.getTime() + 6 * 60_000);
      if (r.line === '69' && m === r.offset) state = 'CANCELLED';
      const minutes = Math.floor((expected - now) / 60_000);
      list.push({
        destination: r.destination,
        direction_code: 1,
        direction: r.destination,
        ...(r.via ? { via: r.via } : {}),
        state,
        display: minutes < 1 ? 'Nu' : minutes < 60 ? `${minutes} min` : `${pad(expected.getHours())}:${pad(expected.getMinutes())}`,
        scheduled: slTime(scheduled),
        expected: slTime(expected),
        journey: { id: 2026000000000 + journey++, state: m < 30 ? 'NORMALPROGRESS' : 'EXPECTED', prediction_state: 'NORMAL' },
        stop_area: { id: 10289, name: r.area ?? 'Centralen', type: 'BUSTERM' },
        ...(r.stop ? { stop_point: { id: 10800 + r.stop.charCodeAt(0), name: r.area ?? 'Centralen', designation: r.stop } } : {}),
        line: { id: parseInt(r.line, 10), designation: r.line, transport_authority_id: 1, transport_mode: 'BUS' },
        deviations:
          withDeviations && r.line === '65'
            ? [{ importance_level: 5, consequence: 'INFORMATION', message: 'Bussarna kör omväg via Vasagatan på grund av vägarbete vid Tegelbacken.' }]
            : [],
      });
    }
  }
  list.sort((a, b) => a.expected.localeCompare(b.expected));
  return {
    departures: list,
    stop_deviations: withDeviations
      ? [{ id: 1, importance_level: 3, message: 'Hissen till läge K är ur funktion. Använd trappan vid läge L.' }]
      : [],
  };
}

/** Hourly for 2 days, then 6-hourly out to 10 days, like SMHI. */
function forecastTimes(now) {
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(start.getUTCHours() + 1);
  const times = [];
  for (let h = 0; h < 48; h++) times.push(new Date(start.getTime() + h * 3_600_000));
  for (let h = 54; h <= 240; h += 6) times.push(new Date(start.getTime() + h * 3_600_000));
  return times;
}

function weatherAt(t, now) {
  const hoursAhead = (t - now) / 3_600_000;
  const localHour = t.getHours() + t.getMinutes() / 60;
  const daysAhead = hoursAhead / 24;
  const temperature = +(1.5 - daysAhead * 0.4 + 3 * Math.sin(((localHour - 9) / 24) * 2 * Math.PI)).toFixed(1);
  const raining = hoursAhead > 14 && hoursAhead < 21;
  const precipitation = raining ? +(0.3 + 1.4 * Math.sin(((hoursAhead - 14) / 7) * Math.PI)).toFixed(1) : 0;
  const symbol = raining ? (precipitation > 1 ? (temperature < 0.5 ? 26 : 19) : temperature < 0.5 ? 25 : 18) : [2, 3, 4, 6, 5, 3][Math.floor(hoursAhead / 8) % 6];
  return {
    temperature,
    symbol,
    precipitation,
    windSpeed: +(4 + 3 * Math.sin(hoursAhead / 5)).toFixed(1),
    windGust: +(9 + 4 * Math.sin(hoursAhead / 5)).toFixed(1),
    windDirection: 225,
    probability: raining ? 80 : 5,
  };
}

function snow1g(now) {
  return {
    createdTime: new Date(now.getTime() - 40 * 60_000).toISOString().replace('.000', ''),
    referenceTime: new Date(Math.floor(now / 3_600_000) * 3_600_000).toISOString().replace('.000', ''),
    geometry: { type: 'Point', coordinates: [18.077207, 59.33036] },
    timeSeries: forecastTimes(now).map((t) => {
      const w = weatherAt(t, now);
      return {
        time: t.toISOString().replace('.000', ''),
        intervalParametersStartTime: new Date(t.getTime() - 3_600_000).toISOString().replace('.000', ''),
        data: {
          air_temperature: w.temperature,
          wind_from_direction: w.windDirection,
          wind_speed: w.windSpeed,
          wind_speed_of_gust: w.windGust,
          relative_humidity: 85,
          precipitation_amount_mean: w.precipitation,
          probability_of_precipitation: w.probability,
          precipitation_frozen_part: -9,
          symbol_code: w.symbol,
        },
      };
    }),
  };
}

function pmp3g(now) {
  const p = (name, unit, value) => ({ name, levelType: 'hl', level: 2, unit, values: [value] });
  return {
    approvedTime: new Date(now.getTime() - 40 * 60_000).toISOString().replace('.000', ''),
    referenceTime: new Date(Math.floor(now / 3_600_000) * 3_600_000).toISOString().replace('.000', ''),
    geometry: { type: 'Point', coordinates: [[18.077207, 59.33036]] },
    timeSeries: forecastTimes(now).map((t) => {
      const w = weatherAt(t, now);
      return {
        validTime: t.toISOString().replace('.000', ''),
        parameters: [
          p('t', 'Cel', w.temperature),
          p('ws', 'm/s', w.windSpeed),
          p('wd', 'degree', w.windDirection),
          p('gust', 'm/s', w.windGust),
          p('pmean', 'kg/m2/h', w.precipitation),
          p('Wsymb2', 'category', w.symbol),
        ],
      };
    }),
  };
}

const MENU = {
  monday: [
    { index: 1, dish: 'Pannbiff med stekt lök, gräddsås, kokt potatis och rårörda lingon', type: 'standard' },
    { index: 2, dish: 'Halloumibiff med rostad rotselleri och örtyoghurt', type: 'vegetarian' },
  ],
  tuesday: [
    { index: 1, dish: 'Ugnsbakad torsk med äggsås, dill och pressad potatis', type: 'fish' },
    { index: 2, dish: 'Linsgryta med kokosmjölk, koriander och basmatiris', type: 'vegetarian' },
  ],
  wednesday: [
    { index: 1, dish: 'Kycklinggryta med paprika, chorizo och ris', type: 'bird' },
    { index: 2, dish: 'Pasta med svamp, spenat och parmesan', type: 'vegetarian' },
    { index: 3, dish: 'Räkpasta med citron, dill och chili', type: 'seafood' },
  ],
  thursday: [
    { index: 1, dish: 'Ärtsoppa och pannkakor med sylt och grädde', type: 'standard' },
    { index: 2, dish: 'Vegetarisk ärtsoppa och pannkakor med sylt', type: 'vegetarian' },
  ],
  friday: [
    { index: 1, dish: 'Julbord med sill, skinka, köttbullar och Janssons frestelse', type: 'christmas' },
    { index: 2, dish: 'Vegetariskt julbord', type: 'vegetarian' },
    { index: 3, dish: 'Restaurangen stänger kl. 13.00', type: 'closing' },
  ],
};

function write() {
  const now = at ? new Date(at) : new Date();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'sl.json'), JSON.stringify(departures(now), null, 1));
  writeFileSync(join(outDir, 'smhi.json'), JSON.stringify(smhiFormat === 'pmp3g' ? pmp3g(now) : snow1g(now), null, 1));
  writeFileSync(join(outDir, 'menu.json'), JSON.stringify(MENU, null, 1));
  console.log(`${now.toLocaleTimeString('sv-SE')} wrote sl.json, smhi.json (${smhiFormat}) and menu.json to ${outDir}`);
}

write();
if (watch) setInterval(write, 30_000);
