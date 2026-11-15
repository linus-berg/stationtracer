import { useMemo } from 'react';
import './Departures.scss';
import { config } from '../../config';
import { useDepartures } from '../../hooks/useData';
import { useElementSize } from '../../hooks/useElementSize';
import { useNow } from '../../hooks/useNow';
import { collectDisruptions, upcoming } from '../../lib/departures';
import { formatAge } from '../../lib/time';
import { Freshness } from '../common/Freshness';
import { PanelMessage } from '../common/PanelMessage';
import { DepartureRow } from './DepartureRow';
import { Disruptions } from './Disruptions';

/** Minimum row height in rem; rows stretch evenly to fill the board. */
const ROW_REM = 4.6;
/** Traffic notices are collected from this many upcoming departures. */
const DISRUPTION_LOOKAHEAD = 12;

export const Departures = () => {
  const query = useDepartures();
  const now = useNow(1000);
  const [bodyRef, size] = useElementSize<HTMLDivElement>();

  const board = query.data?.data;
  const updatedAt = query.data ? query.data.lastModified ?? new Date(query.dataUpdatedAt) : null;
  const rowCount = size.height > 0 ? Math.max(1, Math.floor(size.height / (ROW_REM * size.rem))) : 0;

  const next = useMemo(() => (board ? upcoming(board.departures, now) : []), [board, now]);
  const shown = next.slice(0, rowCount);
  // Based on a fixed look-ahead, not on what fits: the banner changes the board's
  // height, so tying it to the visible rows could make it flicker on and off.
  const disruptions = useMemo(
    () => (board ? collectDisruptions(board, next.slice(0, DISRUPTION_LOOKAHEAD)) : []),
    [board, next],
  );

  let body;
  if (query.isPending) {
    body = <PanelMessage loading title="Loading departures" />;
  } else if (!board) {
    body = (
      <PanelMessage
        icon="offline"
        title="Departures aren't available"
        description={`${query.error?.message ?? ''} The display keeps retrying every few seconds.`}
      />
    );
  } else if (next.length === 0) {
    body = (
      <PanelMessage
        icon="time"
        title="No upcoming departures in the latest data"
        description={updatedAt ? `The departure file was last updated ${formatAge(updatedAt, now)}.` : undefined}
      />
    );
  } else {
    body = (
      <ol className="board__rows" style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
        {shown.map((d) => (
          <DepartureRow key={d.key} departure={d} now={now} primaryStopArea={board.primaryStopArea} />
        ))}
      </ol>
    );
  }

  return (
    <section className="board" aria-label="Bus departures">
      <div className="board__header">
        <h2 className="board__title">
          Departures{board?.primaryStopArea ? ` from ${board.primaryStopArea}` : ''}
        </h2>
        <Freshness
          updatedAt={updatedAt}
          staleAfterMs={config.staleAfterMs.departures}
          fetchFailed={query.isError && !!board}
          now={now}
        />
      </div>
      {next.length > 0 && (
        <div className="board__columns departure-grid" aria-hidden>
          <span>Line</span>
          <span>Destination</span>
          <span className="board__column-stop">Stop</span>
          <span className="board__column-time">Departs</span>
        </div>
      )}
      <div className="board__body" ref={bodyRef}>
        {body}
      </div>
      {disruptions.length > 0 && <Disruptions items={disruptions} />}
    </section>
  );
};
