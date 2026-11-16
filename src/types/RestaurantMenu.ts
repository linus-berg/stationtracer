export interface RestaurantMenu {
  monday: Dish[];
  tuesday: Dish[];
  wednesday: Dish[];
  thursday: Dish[];
  friday: Dish[];
}

export type Weekday = keyof RestaurantMenu;

export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

/**
 * `standard` is meat, and is assumed when a dish has no type. `closing` is a
 * notice that the restaurant closes early or is closed all day, and
 * `christmas` is a julbord.
 */
export type DishType = 'standard' | 'vegetarian' | 'fish' | 'seafood' | 'bird' | 'soup' | 'closing' | 'christmas';

export interface Dish {
  index: number;
  dish: string;
  type: DishType;
}
