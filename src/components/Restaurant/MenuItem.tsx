import type { Dish } from '../../types/RestaurantMenu';
import { DishIcon } from './DishIcon';

interface Props {
  dish: Dish;
}

export const MenuItem = ({ dish }: Props) => (
  <li className={dish.type === 'closing' ? 'dish dish--closing' : 'dish'} data-type={dish.type}>
    <span className="dish__marker">
      <DishIcon type={dish.type} labelled />
    </span>
    <span className="dish__name">{dish.dish.trim()}</span>
  </li>
);
