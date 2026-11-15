import type { Dish } from '../../types/RestaurantMenu';
import { MenuItem } from './MenuItem';

interface Props {
  /** Omitted for the featured day, whose name is in the panel title. */
  day?: string;
  dishes: Dish[];
  featured?: boolean;
}

export const DailyMenu = ({ day, dishes, featured = false }: Props) => (
  <div className={featured ? 'daily-menu daily-menu--featured' : 'daily-menu'}>
    {day && <h3 className="daily-menu__day">{day}</h3>}
    {dishes.length > 0 ? (
      <ul className="daily-menu__dishes">
        {dishes.map((dish) => (
          <MenuItem key={`${dish.index}-${dish.dish}`} dish={dish} />
        ))}
      </ul>
    ) : (
      <p className="daily-menu__empty">No lunch served</p>
    )}
  </div>
);
