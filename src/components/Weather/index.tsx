import { useMemo } from 'react';
import './Weather.scss';
import { config } from '../../config';
import { useForecast } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  compassDirection,
  currentPoint,
  dailyOutlook,
  feelsLike,
  precipitationOutlook,
  symbolInfo,
} from '../../lib/smhi';
import { isDaylight, sunTimes } from '../../lib/sun';
import { formatTime, formatWeekday } from '../../lib/time';
import { Freshness } from '../common/Freshness';
import { PanelMessage } from '../common/PanelMessage';
import { ForecastChart } from './ForecastChart';
import { WeatherIcon } from './WeatherIcon';

const OUTLOOK_DAYS = 4;

export const Weather = () => {
  const query = useForecast();
  const now = useNow(60_000);
  const forecast = query.data?.data;

  const view = useMemo(() => {
    if (!forecast || forecast.points.length === 0) return null;
    const last = forecast.points[forecast.points.length - 1];
    if (last.time.getTime() < now.getTime() - 3_600_000) return null;
    const { lat, lon } = forecast.location;
    const current = currentPoint(forecast.points, now)!;
    return {
      current,
      night: !isDaylight(now, lat, lon),
      sun: sunTimes(now, lat, lon),
      outlook: precipitationOutlook(forecast.points, now),
      days: dailyOutlook(forecast.points, now, OUTLOOK_DAYS),
      chill: feelsLike(current.temperature, current.windSpeed),
    };
  }, [forecast, now]);

  if (query.isPending) return <PanelMessage loading title="Loading the forecast" />;
  if (!forecast) {
    return (
      <PanelMessage
        icon="cloud"
        title="The weather forecast isn't available"
        description={query.error?.message}
      />
    );
  }
  if (!view) {
    return (
      <PanelMessage
        icon="cloud"
        title="The weather forecast has run out"
        description="The latest forecast file doesn't cover the current time. New forecasts arrive with the SMHI data sync."
      />
    );
  }

  const { current, night, sun, outlook, days, chill } = view;
  const info = symbolInfo(current.symbol);
  const temp = Math.round(current.temperature);
  const showChill = chill !== undefined && Math.round(chill) < temp;

  const wind =
    current.windSpeed !== undefined
      ? [
          current.windDirection !== undefined
            ? `Wind ${Math.round(current.windSpeed)} m/s from the ${compassDirection(current.windDirection)}`
            : `Wind ${Math.round(current.windSpeed)} m/s`,
          current.windGust !== undefined && current.windGust >= current.windSpeed + 3
            ? `gusts ${Math.round(current.windGust)}`
            : null,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

  return (
    <section className="weather" aria-label="Weather">
      <div className="weather__now">
        <WeatherIcon className="weather__icon" symbol={current.symbol} night={night} />
        <div className="weather__temp">
          {temp}
          <span className="weather__degree">°</span>
        </div>
        <div className="weather__details">
          <p className="weather__condition">
            {info?.label}
            {showChill && <span className="weather__feels">, feels like {Math.round(chill!)}°</span>}
          </p>
          {wind && <p>{wind}</p>}
          {outlook && <p>{outlook}</p>}
        </div>
      </div>

      <ForecastChart points={forecast.points} location={forecast.location} now={now} />

      <div className="weather__footer">
        <ol className="weather__days" aria-label="Coming days">
          {days.map((d) => (
            <li key={d.date.getTime()} className="weather__day">
              <span className="weather__day-name">{formatWeekday(d.date, 'short')}</span>
              <WeatherIcon className="weather__day-icon" symbol={d.symbol} />
              <span className="weather__day-high">{Math.round(d.max)}°</span>
              <span className="weather__day-low">{Math.round(d.min)}°</span>
            </li>
          ))}
        </ol>
        <div className="weather__meta">
          {sun.sunrise && sun.sunset ? (
            <span>
              Sunrise {formatTime(sun.sunrise)}, sunset {formatTime(sun.sunset)}
            </span>
          ) : null}
          <Freshness
            updatedAt={forecast.issued ?? query.data?.lastModified ?? null}
            staleAfterMs={config.staleAfterMs.weather}
            fetchFailed={query.isError}
            now={now}
          />
          <span className="weather__source">
            Forecast from SMHI{forecast.issued ? `, issued ${formatTime(forecast.issued)}` : ''}
          </span>
        </div>
      </div>
    </section>
  );
};
