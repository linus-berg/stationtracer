/** Display configuration. Data files are synced into /public/data by an external flow. */
export const config = {
  dataUrls: {
    departures: '/data/sl.json',
    weather: '/data/smhi.json',
    menu: '/data/menu.json',
  },
  refreshMs: {
    departures: 3_000,
    weather: 30_000,
    menu: 60_000,
  },
  /** Show a warning when a file hasn't changed for this long. */
  staleAfterMs: {
    departures: 5 * 60_000,
    weather: 12 * 60 * 60_000,
  },
  /** Keep showing a bus as "Now" for this long after its expected time. */
  departureGraceMs: 30_000,
  /** Delays at or above this many minutes are called out on the board. */
  delayNoticeMinutes: 3,
  /** Used for sunrise/sunset if the forecast file has no coordinates (Stockholm C). */
  defaultLocation: { lat: 59.334591, lon: 18.06324 },
  /** On weekdays after this hour, the lunch panel features tomorrow instead of today. */
  lunchEndsHour: 14,
  /** Rotate between disruption messages this often. */
  disruptionRotateMs: 12_000,
  /** Hide the mouse cursor after this long without movement. */
  cursorHideMs: 3_000,
  /** Nudge the whole layout by a few pixels this often to avoid screen burn-in. */
  burnInShiftMs: 4 * 60_000,
  /** Check for a newly deployed version this often (production builds only). */
  versionCheckMs: 5 * 60_000,
  /** Reload once a day at this local hour to keep a long-running browser healthy. */
  dailyReloadHour: 4,
} as const;
