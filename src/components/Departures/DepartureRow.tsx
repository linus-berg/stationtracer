import { Icon } from '@blueprintjs/core';
import type { ReactNode } from 'react';
import { config } from '../../config';
import type { Departure } from '../../lib/departures';
import { countdown, formatTime } from '../../lib/time';

interface Props {
  departure: Departure;
  now: Date;
  primaryStopArea?: string;
}

export const DepartureRow = ({ departure: d, now, primaryStopArea }: Props) => {
  const until = countdown(d.expected, now);
  const leavingNow = !d.cancelled && until.kind === 'now';
  const late = !d.cancelled && d.delayMinutes >= config.delayNoticeMinutes;

  const notes: ReactNode[] = [];
  if (d.cancelled) notes.push(<span key="cancelled" className="note note--cancelled">Cancelled</span>);
  if (late) notes.push(<span key="late" className="note note--late">{d.delayMinutes} min late</span>);
  if (d.stopArea && primaryStopArea && d.stopArea !== primaryStopArea) {
    notes.push(<span key="from" className="note">From {d.stopArea}</span>);
  }
  if (d.via) notes.push(<span key="via" className="note">Via {d.via}</span>);

  let time: ReactNode;
  if (d.cancelled) time = <s>{formatTime(d.scheduled)}</s>;
  else if (until.kind === 'now') time = 'Now';
  else if (until.kind === 'minutes')
    time = (
      <>
        {until.minutes}
        <span className="departure__unit"> min</span>
      </>
    );
  else time = until.text;

  const classes = ['departure', 'departure-grid'];
  if (d.cancelled) classes.push('departure--cancelled');
  if (leavingNow) classes.push('departure--now');

  return (
    <li className={classes.join(' ')}>
      <span className="departure__line">{d.line}</span>
      <div className="departure__main">
        <span className="departure__destination">
          <span className="departure__destination-text">{d.destination}</span>
          {d.deviations.length > 0 && (
            <Icon icon="warning-sign" className="departure__alert" aria-label="Has a traffic notice" />
          )}
        </span>
        {notes.length > 0 && <span className="departure__notes">{notes}</span>}
      </div>
      <span className="departure__stop">{d.stopPoint && <span className="stop-badge">{d.stopPoint}</span>}</span>
      <span className="departure__time">{time}</span>
    </li>
  );
};
