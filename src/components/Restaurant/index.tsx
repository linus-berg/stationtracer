import { useLayoutEffect, useRef } from 'react';
import './Restaurant.scss';
import { config } from '../../config';
import { useMenu } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { WEEKDAYS, type Weekday } from '../../types/RestaurantMenu';
import { PanelMessage } from '../common/PanelMessage';
import { DailyMenu } from './DailyMenu';
import { DishIcon } from './DishIcon';
import { DISH_LABELS, KEYED_TYPES } from './dishTypes';

interface LunchPlan {
  title: string;
  featured?: Weekday;
  rest: Weekday[];
}

const dayName = (d: Weekday) => d[0].toUpperCase() + d.slice(1);

/**
 * Featured dish sizes in rem, largest first. Each dish beyond three starts one
 * step smaller, so a long menu leaves room at the bottom instead of filling the
 * panel; a step that still doesn't fit (long dish names) is skipped.
 */
const FEATURED_REM = [1.67, 1.5, 1.33, 1.2, 1.1];
const FULL_SIZE_DISHES = 3;

/** Today until lunch is over, then tomorrow; the week overview on weekends and Friday afternoons. */
function planFor(now: Date): LunchPlan {
  const weekday = now.getDay() - 1; // 0 = Monday
  if (weekday < 0 || weekday > 4) return { title: 'Lunch this week', rest: WEEKDAYS };
  if (now.getHours() < config.lunchEndsHour) {
    return { title: 'Lunch today', featured: WEEKDAYS[weekday], rest: WEEKDAYS.slice(weekday + 1) };
  }
  if (weekday < 4) {
    return { title: 'Lunch tomorrow', featured: WEEKDAYS[weekday + 1], rest: WEEKDAYS.slice(weekday + 2) };
  }
  return { title: 'Lunch this week', rest: WEEKDAYS };
}

export const Restaurant = () => {
  const query = useMenu();
  const now = useNow(60_000);
  const sectionRef = useRef<HTMLElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLUListElement>(null);
  const menu = query.data?.data;
  const plan = planFor(now);
  const featuredCount = menu && plan.featured ? menu[plan.featured].length : 0;

  // A wall display can't scroll: size the featured day to fit, show only the days that fit completely,
  // and keep the key to the icons that are on screen.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const featured = featuredRef.current;
    const rest = restRef.current;
    const days = rest ? (Array.from(rest.children) as HTMLElement[]) : [];
    const keyItems = keyRef.current ? (Array.from(keyRef.current.children) as HTMLElement[]) : [];
    const fit = () => {
      // Lay out with the full key, so trimming it afterwards can only free up space.
      for (const item of keyItems) item.style.display = '';
      if (featured) {
        const limit = section.getBoundingClientRect().bottom + 0.5;
        let step = Math.min(Math.max(featuredCount - FULL_SIZE_DISHES, 0), FEATURED_REM.length - 1);
        for (; step < FEATURED_REM.length; step++) {
          featured.style.setProperty('--featured-size', `${FEATURED_REM[step]}rem`);
          if (featured.getBoundingClientRect().bottom <= limit) break;
        }
      }
      const shown: HTMLElement[] = featured ? [featured] : [];
      if (rest) {
        const limit = rest.getBoundingClientRect().bottom + 0.5;
        const fitting = days.filter((day) => day.getBoundingClientRect().bottom <= limit);
        for (const day of days) day.style.visibility = fitting.includes(day) ? '' : 'hidden';
        // With no day to show, the divider would be a stray line along the bottom edge.
        rest.style.visibility = fitting.length > 0 ? '' : 'hidden';
        shown.push(...fitting);
      }
      const types = new Set(shown.flatMap((el) => Array.from(el.querySelectorAll<HTMLElement>('[data-type]'), (d) => d.dataset.type)));
      for (const item of keyItems) if (!types.has(item.dataset.type)) item.style.display = 'none';
    };
    fit();
    // Watching the days themselves catches reflows the panel size doesn't, like the web font arriving.
    const observer = new ResizeObserver(fit);
    for (const el of [section, featured, ...days]) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [menu, plan.title, plan.featured, featuredCount]);

  if (query.isPending) return <PanelMessage loading title="Loading the lunch menu" />;
  if (!menu) {
    return <PanelMessage icon="error" title="The lunch menu isn't available" description={query.error?.message} />;
  }

  const shownDays = plan.featured ? [plan.featured, ...plan.rest] : plan.rest;
  const keyed = KEYED_TYPES.filter((type) => shownDays.some((d) => menu[d].some((dish) => dish.type === type)));

  return (
    <section className="lunch" aria-label="Lunch menu" ref={sectionRef}>
      <div className="lunch__header">
        <h2 className="lunch__title">{plan.title}</h2>
        {keyed.length > 0 && (
          <ul className="lunch__key" ref={keyRef}>
            {keyed.map((type) => (
              <li key={type} className="lunch__key-item" data-type={type}>
                <DishIcon type={type} /> {DISH_LABELS[type]}
              </li>
            ))}
          </ul>
        )}
      </div>
      {plan.featured && <DailyMenu featured dishes={menu[plan.featured]} ref={featuredRef} />}
      {plan.rest.length > 0 && (
        <div className="lunch__rest" ref={restRef}>
          {plan.rest.map((day) => (
            <DailyMenu key={day} day={dayName(day)} dishes={menu[day]} />
          ))}
        </div>
      )}
    </section>
  );
};
