import { Icon } from '@blueprintjs/core';
import { useEffect, useState } from 'react';
import { config } from '../../config';
import type { Disruption } from '../../lib/departures';

interface Props {
  items: Disruption[];
}

/** Traffic notices from SL, one at a time, most important first. */
export const Disruptions = ({ items }: Props) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setStep((s) => s + 1), config.disruptionRotateMs);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const index = step % items.length;
  const item = items[index];

  return (
    <div className="disruptions" role="status" aria-live="polite">
      <Icon icon="warning-sign" className="disruptions__icon" />
      <div className="disruptions__body" key={item.message}>
        {item.lines.length > 0 && (
          <span className="disruptions__lines">
            {item.lines.map((line) => (
              <span key={line} className="mini-plate">
                {line}
              </span>
            ))}
          </span>
        )}
        <span className="disruptions__message">{item.message}</span>
      </div>
      {items.length > 1 && (
        <span className="disruptions__count">
          {index + 1} of {items.length}
        </span>
      )}
    </div>
  );
};
