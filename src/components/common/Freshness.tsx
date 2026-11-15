import { Icon } from '@blueprintjs/core';
import { formatAge } from '../../lib/time';
import './common.scss';

interface Props {
  /** When the data last changed; falls back to when it was last fetched. */
  updatedAt: Date | null;
  staleAfterMs: number;
  /** The latest fetch failed, so what's on screen is an older copy. */
  fetchFailed: boolean;
  now: Date;
}

/**
 * Silent while data is fresh. When new data stops arriving, the board must
 * say so instead of quietly showing old times.
 */
export const Freshness = ({ updatedAt, staleAfterMs, fetchFailed, now }: Props) => {
  const stale = updatedAt !== null && now.getTime() - updatedAt.getTime() > staleAfterMs;
  if (!stale && !fetchFailed) return null;
  const age = updatedAt ? `last updated ${formatAge(updatedAt, now)}` : 'no update time available';
  const text = fetchFailed ? `Can't load new data, ${age}` : `Not updating, ${age}`;
  return (
    <span className="freshness" role="status">
      <Icon icon="warning-sign" className="freshness__icon" />
      {text}
    </span>
  );
};
