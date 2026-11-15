import { Colors } from '@blueprintjs/core';
import type { ReactNode } from 'react';
import { symbolInfo } from '../../lib/smhi';

const SUN = Colors.GOLD5;
const MOON = Colors.LIGHT_GRAY2;
const CLOUD = Colors.LIGHT_GRAY1;
const CLOUD_HEAVY = Colors.GRAY4;
const CLOUD_BACK = Colors.GRAY2;
const RAIN = Colors.BLUE5;
const SNOW = Colors.WHITE;
const FOG = Colors.GRAY4;

/** Crescent with its outer circle centred on (32, 32), radius 14. */
const MOON_PATH = 'M31.03 18.03A14 14 0 1 0 45.13 36.85A12 12 0 0 1 31.03 18.03Z';

const CLOUD_SHAPES = (
  <>
    <circle cx={22} cy={38} r={9} />
    <circle cx={34} cy={30} r={12} />
    <circle cx={45} cy={38} r={9} />
    <rect x={22} y={35} width={23} height={12} />
  </>
);

const Cloud = ({ transform, color, halo }: { transform?: string; color: string; halo: string }) => (
  <g transform={transform}>
    {/* A ring in the background colour keeps the cloud crisp where it overlaps the sun. */}
    <g style={{ fill: halo, stroke: halo }} strokeWidth={5}>
      {CLOUD_SHAPES}
    </g>
    <g fill={color}>{CLOUD_SHAPES}</g>
  </g>
);

const Sun = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={SUN} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return (
        <line
          key={i}
          x1={cx + Math.cos(a) * r * 1.45}
          y1={cy + Math.sin(a) * r * 1.45}
          x2={cx + Math.cos(a) * r * 1.9}
          y2={cy + Math.sin(a) * r * 1.9}
          stroke={SUN}
          strokeWidth={r * 0.28}
          strokeLinecap="round"
        />
      );
    })}
  </g>
);

const Moon = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => {
  const s = (r * 1.55) / 14;
  return (
    <g transform={`translate(${cx - 32 * s} ${cy - 32 * s}) scale(${s})`}>
      <path d={MOON_PATH} fill={MOON} />
    </g>
  );
};

const Drop = ({ x, heavy }: { x: number; heavy: boolean }) => (
  <line x1={x + 2} y1={45} x2={x - 2} y2={heavy ? 57 : 54} stroke={RAIN} strokeWidth={3.2} strokeLinecap="round" />
);

const Flake = ({ x }: { x: number }) => (
  <g stroke={SNOW} strokeWidth={2.8} strokeLinecap="round">
    {[90, 30, 150].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return <line key={deg} x1={x - Math.cos(a) * 6} y1={52 - Math.sin(a) * 6} x2={x + Math.cos(a) * 6} y2={52 + Math.sin(a) * 6} />;
    })}
  </g>
);

const Bolt = () => <path d="M35 39 L26 52 H32 L28 62 L40 47 H34 L38 39 Z" fill={SUN} />;

const SPREAD: Record<number, number[]> = { 1: [32], 2: [26, 38], 3: [21, 32, 43] };
/** Flakes are wider than drops, so they need more room to stay distinct at small sizes. */
const WIDE_SPREAD: Record<number, number[]> = { 1: [32], 2: [23, 41], 3: [15, 32, 49] };

interface Props {
  symbol?: number;
  night?: boolean;
  /** Colour behind the icon, used for the ring around overlapping shapes. */
  halo?: string;
  className?: string;
  /** Position and size when nested inside another SVG. */
  x?: number;
  y?: number;
  size?: number;
}

export const WeatherIcon = ({ symbol, night = false, halo = 'var(--canvas)', className, x, y, size }: Props) => {
  const info = symbolInfo(symbol);
  if (!info) return null;
  const Light = night ? Moon : Sun;
  const layers: ReactNode[] = [];

  if (info.precip) {
    if (info.showers) layers.push(<Light key="light" cx={21} cy={17} r={7} />);
    layers.push(
      <Cloud key="cloud" transform="translate(0 -8)" color={info.intensity === 3 ? CLOUD_HEAVY : CLOUD} halo={halo} />,
    );
    const n = info.intensity ?? 1;
    if (info.precip === 'thunder') {
      layers.push(<Bolt key="bolt" />);
      if (info.showers) layers.push(<Drop key="drop" x={20} heavy={false} />);
    } else if (info.precip === 'rain') {
      SPREAD[n].forEach((px) => layers.push(<Drop key={px} x={px} heavy={n === 3} />));
    } else if (info.precip === 'snow') {
      WIDE_SPREAD[n].forEach((px) => layers.push(<Flake key={px} x={px} />));
    } else {
      // Sleet: alternate drops and flakes, always at least one of each.
      WIDE_SPREAD[Math.min(3, n + 1)].forEach((px, i) =>
        layers.push(i % 2 === 0 ? <Drop key={px} x={px} heavy={false} /> : <Flake key={px} x={px} />),
      );
    }
  } else {
    switch (info.sky) {
      case 'clear':
        layers.push(<Light key="light" cx={32} cy={32} r={11} />);
        break;
      case 'nearlyClear':
        layers.push(<Light key="light" cx={28} cy={27} r={10} />);
        layers.push(<Cloud key="cloud" transform="translate(29 28) scale(0.55)" color={CLOUD} halo={halo} />);
        break;
      case 'variable':
        layers.push(<Light key="light" cx={24} cy={22} r={8.5} />);
        layers.push(<Cloud key="cloud" transform="translate(6 8) scale(0.9)" color={CLOUD} halo={halo} />);
        break;
      case 'halfClear':
        layers.push(<Light key="light" cx={21} cy={20} r={8} />);
        layers.push(<Cloud key="cloud" transform="translate(2 7)" color={CLOUD} halo={halo} />);
        break;
      case 'cloudy':
        layers.push(<Cloud key="cloud" transform="translate(-1 2)" color={CLOUD} halo={halo} />);
        break;
      case 'overcast':
        layers.push(<Cloud key="back" transform="translate(-6 -6) scale(0.85)" color={CLOUD_BACK} halo={halo} />);
        layers.push(<Cloud key="front" transform="translate(3 7) scale(0.95)" color={CLOUD_HEAVY} halo={halo} />);
        break;
      case 'fog':
        layers.push(<Cloud key="cloud" transform="translate(0 -9) scale(0.95)" color={CLOUD_BACK} halo={halo} />);
        layers.push(
          <g key="fog" stroke={FOG} strokeWidth={3.5} strokeLinecap="round">
            <line x1={12} y1={45} x2={46} y2={45} />
            <line x1={18} y1={52} x2={54} y2={52} />
            <line x1={12} y1={59} x2={42} y2={59} />
          </g>,
        );
        break;
    }
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      x={x}
      y={y}
      width={size}
      height={size}
      role="img"
      aria-label={info.label}
    >
      {layers}
    </svg>
  );
};
