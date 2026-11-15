import { useMemo } from 'react';
import { useElementSize } from '../../hooks/useElementSize';
import { isDaylight } from '../../lib/sun';
import { formatWeekday } from '../../lib/time';
import type { ForecastPoint } from '../../types/WeatherMetadata';
import { WeatherIcon } from './WeatherIcon';

interface Props {
  points: ForecastPoint[];
  location: { lat: number; lon: number };
  now: Date;
}

const HOURS = 24;
/** Precipitation bars are scaled to at least this many mm/h, so drizzle looks like drizzle. */
const MIN_PRECIP_SCALE = 2;
const WET_MM = 0.1;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Next 24 hours: condition icons every three hours, temperature as a line, and
 * precipitation as bars in their own band. Two measures, two bands, one time axis.
 * Daylight is shaded so the short Nordic winter day is visible at a glance.
 */
export const ForecastChart = ({ points, location, now }: Props) => {
  const [ref, { width: W, height: H, rem }] = useElementSize<HTMLDivElement>();
  const hourStart = Math.floor(now.getTime() / 3_600_000) * 3_600_000;

  const series = useMemo(
    () =>
      points.filter(
        (p) => p.time.getTime() >= hourStart && p.time.getTime() <= hourStart + HOURS * 3_600_000,
      ),
    [points, hourStart],
  );

  const chart = useMemo(() => {
    if (W <= 0 || H <= 0 || series.length < 2) return null;
    const { lat, lon } = location;
    const t0 = series[0].time.getTime();
    const tN = series[series.length - 1].time.getTime();
    const step = series[1].time.getTime() - t0 || 3_600_000;
    const span = tN - t0 + step;
    const gutter = 2.2 * rem;
    const plotW = W - gutter;
    const x = (t: number) => gutter + ((t - t0 + step / 2) / span) * plotW;
    const stepPx = (step / span) * plotW;

    const wet = series.filter((p) => (p.precipitation ?? 0) >= WET_MM);
    const hasPrecip = wet.length > 0;

    const iconSize = 2.4 * rem;
    const axisH = 1.6 * rem;
    const precipH = hasPrecip ? 3.2 * rem : 0;
    const base = H - axisH;
    const tempTop = iconSize + 0.3 * rem;
    const tempBottom = base - precipH - (hasPrecip ? 0.4 * rem : 0);
    const labelRoom = 1.5 * rem;

    const temps = series.map((p) => p.temperature);
    let lo = Math.min(...temps);
    let hi = Math.max(...temps);
    if (hi - lo < 4) {
      const mid = (hi + lo) / 2;
      lo = mid - 2;
      hi = mid + 2;
    }
    const yTop = tempTop + labelRoom;
    const yBottom = tempBottom - labelRoom;
    const y = (t: number) => yBottom - ((t - lo) / (hi - lo)) * (yBottom - yTop);

    // Daylight spans, sampled every 10 minutes.
    const days: [number, number][] = [];
    let open: number | null = null;
    const from = t0 - step / 2;
    const to = tN + step / 2;
    for (let t = from; t <= to; t += 600_000) {
      const light = isDaylight(new Date(t), lat, lon);
      if (light && open === null) open = t;
      if (!light && open !== null) {
        days.push([open, t]);
        open = null;
      }
    }
    if (open !== null) days.push([open, to]);

    const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(p.time.getTime()).toFixed(1)},${y(p.temperature).toFixed(1)}`).join('');

    const maxIdx = temps.indexOf(Math.max(...temps));
    const minIdx = temps.indexOf(Math.min(...temps));
    const showMin = Math.round(temps[maxIdx]) !== Math.round(temps[minIdx]);

    const anchor = (px: number) =>
      px < gutter + 1.4 * rem ? { x: Math.max(px - 0.4 * rem, gutter), anchor: 'start' as const }
      : px > W - 1.4 * rem ? { x: Math.min(px + 0.4 * rem, W), anchor: 'end' as const }
      : { x: px, anchor: 'middle' as const };

    const pMax = Math.max(0, ...series.map((p) => p.precipitation ?? 0));
    const pScale = Math.max(MIN_PRECIP_SCALE, pMax);
    const barRoom = precipH - 1.4 * rem;
    const barW = Math.min(1.2 * rem, stepPx * 0.6);
    const bars = wet.map((p) => {
      const h = Math.max(2, ((p.precipitation ?? 0) / pScale) * barRoom);
      const cx = x(p.time.getTime());
      const r = Math.min(0.22 * rem, barW / 2, h);
      const x0 = cx - barW / 2;
      const x1 = cx + barW / 2;
      const top = base - h;
      return {
        key: p.time.getTime(),
        d: `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x1 - r}Q${x1},${top} ${x1},${top + r}V${base}Z`,
      };
    });
    const peak = wet.find((p) => p.precipitation === pMax);

    const ticks = series.filter((p) => p.time.getHours() % 3 === 0);

    return { x, y, gutter, days, line, maxIdx, minIdx, showMin, anchor, bars, peak, pScale, barRoom, base, ticks, iconSize, lo, hi, hasPrecip };
  }, [W, H, rem, series, location]);

  return (
    <div className="forecast-chart" ref={ref}>
      {chart && (
        <svg width={W} height={H} role="img" aria-label="Temperature and precipitation for the next 24 hours">
          {chart.days.map(([a, b]) => (
            <rect
              key={a}
              x={chart.x(a)}
              width={chart.x(b) - chart.x(a)}
              y={0}
              height={chart.base}
              rx={0.3 * rem}
              className="forecast-chart__day"
            />
          ))}

          {chart.lo < 0 && chart.hi > 0 && (
            <g className="forecast-chart__freezing">
              <line x1={chart.gutter} x2={W} y1={chart.y(0)} y2={chart.y(0)} />
              <text x={chart.gutter - 0.4 * rem} y={chart.y(0)} dy="0.35em" textAnchor="end">
                0°
              </text>
            </g>
          )}

          <path d={chart.line} className="forecast-chart__line" />

          {[chart.maxIdx, ...(chart.showMin ? [chart.minIdx] : [])].map((i) => {
            const p = series[i];
            const px = chart.x(p.time.getTime());
            const py = chart.y(p.temperature);
            const isMax = i === chart.maxIdx;
            const label = chart.anchor(px);
            return (
              <g key={`extreme-${i}`}>
                <circle cx={px} cy={py} r={Math.max(4, 0.26 * rem)} className="forecast-chart__dot" />
                <text
                  x={label.x}
                  y={isMax ? py - 0.65 * rem : py + 1.45 * rem}
                  textAnchor={label.anchor}
                  className={isMax ? 'forecast-chart__high' : 'forecast-chart__low'}
                >
                  {Math.round(p.temperature)}°
                </text>
              </g>
            );
          })}

          {chart.hasPrecip && (
            <g>
              <line x1={chart.gutter} x2={W} y1={chart.base} y2={chart.base} className="forecast-chart__baseline" />
              {chart.bars.map((b) => (
                <path key={b.key} d={b.d} className="forecast-chart__bar" />
              ))}
              {chart.peak && (() => {
                const px = chart.x(chart.peak.time.getTime());
                const h = Math.max(2, ((chart.peak.precipitation ?? 0) / chart.pScale) * chart.barRoom);
                const label = chart.anchor(px);
                return (
                  <text x={label.x} y={chart.base - h - 0.35 * rem} textAnchor={label.anchor} className="forecast-chart__peak">
                    {(chart.peak.precipitation ?? 0).toFixed(1)} mm
                  </text>
                );
              })()}
            </g>
          )}

          {chart.ticks.map((p) => {
            const t = p.time.getTime();
            const px = chart.x(t);
            const hour = p.time.getHours();
            const label = chart.anchor(px);
            const iconX = Math.min(Math.max(px - chart.iconSize / 2, chart.gutter), W - chart.iconSize);
            const light = isDaylight(p.time, location.lat, location.lon);
            return (
              <g key={t}>
                <WeatherIcon
                  symbol={p.symbol}
                  night={!light}
                  halo={light ? 'var(--day-band)' : 'var(--canvas)'}
                  x={iconX}
                  y={0}
                  size={chart.iconSize}
                />
                <text
                  x={label.x}
                  y={H - 0.3 * rem}
                  textAnchor={label.anchor}
                  className={hour === 0 ? 'forecast-chart__tick forecast-chart__tick--day' : 'forecast-chart__tick'}
                >
                  {hour === 0 ? formatWeekday(p.time, 'short') : `${pad(hour)}:00`}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
