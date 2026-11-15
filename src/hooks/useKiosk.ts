import { useEffect } from 'react';
import { config } from '../config';

/** Hide the cursor when the mouse is idle; it's distracting on a wall display. */
function useHideIdleCursor() {
  useEffect(() => {
    let timer: number;
    const show = () => {
      document.body.classList.remove('cursor-hidden');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => document.body.classList.add('cursor-hidden'), config.cursorHideMs);
    };
    show();
    window.addEventListener('mousemove', show);
    return () => {
      window.removeEventListener('mousemove', show);
      window.clearTimeout(timer);
    };
  }, []);
}

/** Move the whole layout a couple of pixels now and then so static edges don't burn in. */
function useBurnInShift() {
  useEffect(() => {
    const offsets = [[0, 0], [2, 1], [1, 3], [-1, 2], [-2, 0], [-1, -2], [1, -1]];
    let step = 0;
    const root = document.getElementById('root');
    const timer = window.setInterval(() => {
      step = (step + 1) % offsets.length;
      const [x, y] = offsets[step];
      root?.style.setProperty('translate', `${x}px ${y}px`);
    }, config.burnInShiftMs);
    return () => window.clearInterval(timer);
  }, []);
}

/** Ask the browser to keep the screen on (only available on HTTPS/localhost). */
function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    const request = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then((l) => (lock = l), () => {});
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => {});
    };
  }, []);
}

const entryScript = (html: string) => html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];

/**
 * Pick up new deployments without anyone touching the display, and reload once
 * a night as a safety net. Only reloads after confirming the server is up, so an
 * outage never leaves the screen on a browser error page.
 */
function useAutoReload() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const loadedAt = Date.now();
    const running = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src');

    const check = async () => {
      try {
        const res = await fetch(import.meta.env.BASE_URL, { cache: 'no-store' });
        if (!res.ok) return;
        const latest = entryScript(await res.text());
        if (!latest) return;
        const reloadAt = new Date();
        reloadAt.setHours(config.dailyReloadHour, 0, 0, 0);
        const nightly = Date.now() >= reloadAt.getTime() && loadedAt < reloadAt.getTime();
        if (latest !== running || nightly) window.location.reload();
      } catch {
        // Server unreachable: keep showing what we have.
      }
    };
    const timer = window.setInterval(check, config.versionCheckMs);
    return () => window.clearInterval(timer);
  }, []);
}

export function useKiosk() {
  useHideIdleCursor();
  useBurnInShift();
  useWakeLock();
  useAutoReload();
}
