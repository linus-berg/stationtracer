import type { Dish } from '../../types/RestaurantMenu';
import { Leaf } from './Leaf';

interface Props {
  dish: Dish;
}

export const MenuItem = ({ dish }: Props) => (
  <li className="dish">
    <span className="dish__marker">{dish.type === 'vegetarian' && <Leaf label="Vegetarian" />}</span>
    <span className="dish__name">{dish.dish.trim()}</span>
  </li>
);
