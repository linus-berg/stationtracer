import './Clock.scss';
import { useNow } from '../../hooks/useNow';
import { formatLongDate, formatTime, isoWeek } from '../../lib/time';

export const Clock = () => {
  const now = useNow(1000);
  return (
    <header className="clock">
      <time className="clock__time" dateTime={now.toISOString()}>
        {formatTime(now)}
      </time>
      <div className="clock__date">
        <span>{formatLongDate(now)}</span>
        <span className="clock__week">Week {isoWeek(now)}</span>
      </div>
    </header>
  );
};
