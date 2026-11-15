import { useLayoutEffect, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
  /** Root font size in px, so layout maths can work in rem. */
  rem: number;
}

const rootRem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/** Tracks an element's content box; also reports the current rem size. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0, rem: 16 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const rem = rootRem();
      setSize((prev) =>
        prev.width === width && prev.height === height && prev.rem === rem ? prev : { width, height, rem },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
