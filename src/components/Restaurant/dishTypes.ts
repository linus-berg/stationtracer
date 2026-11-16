import type { DishType } from '../../types/RestaurantMenu';

export const DISH_LABELS: Record<DishType, string> = {
  standard: 'Meat',
  bird: 'Poultry',
  fish: 'Fish',
  seafood: 'Seafood',
  soup: 'Soup',
  vegetarian: 'Vegetarian',
  christmas: 'Julbord',
  closing: 'Restaurant closing',
};

/** Types explained in the panel's key, in this order. Julbord and closing notices explain themselves. */
export const KEYED_TYPES: DishType[] = ['standard', 'bird', 'fish', 'seafood', 'soup', 'vegetarian'];
