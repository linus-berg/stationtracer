import { useLayoutEffect, useRef } from 'react';
import './Restaurant.scss';
import { config } from '../../config';
import { useMenu } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { WEEKDAYS, type Weekday } from '../../types/RestaurantMenu';
import { PanelMessage } from '../common/PanelMessage';
import { DailyMenu } from './DailyMenu';
import { Leaf } from './Leaf';

interface LunchPlan {
  title: string;
  featured?: Weekday;
  rest: Weekday[];
}

const dayName = (d: Weekday) => d[0].toUpperCase() + d.slice(1);

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
  const restRef = useRef<HTMLDivElement>(null);
  const menu = query.data?.data;
  const plan = planFor(now);

  // A wall display can't scroll: show only the days that fit completely.
  useLayoutEffect(() => {
    const el = restRef.current;
    if (!el) return;
    const fit = () => {
      const limit = el.getBoundingClientRect().bottom + 0.5;
      for (const child of Array.from(el.children) as HTMLElement[]) {
        child.style.visibility = child.getBoundingClientRect().bottom <= limit ? '' : 'hidden';
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [menu, plan.title]);

  if (query.isPending) return <PanelMessage loading title="Loading the lunch menu" />;
  if (!menu) {
    return <PanelMessage icon="error" title="The lunch menu isn't available" description={query.error?.message} />;
  }

  const hasVegetarian = WEEKDAYS.some((d) => menu[d].some((dish) => dish.type === 'vegetarian'));

  return (
    <section className="lunch" aria-label="Lunch menu">
      <div className="lunch__header">
        <h2 className="lunch__title">{plan.title}</h2>
        {hasVegetarian && (
          <span className="lunch__key">
            <Leaf /> Vegetarian
          </span>
        )}
      </div>
      {plan.featured && <DailyMenu featured dishes={menu[plan.featured]} />}
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
