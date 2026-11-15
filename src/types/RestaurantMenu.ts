export interface RestaurantMenu {
  monday: Dish[];
  tuesday: Dish[];
  wednesday: Dish[];
  thursday: Dish[];
  friday: Dish[];
}

export type Weekday = keyof RestaurantMenu;

export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export interface Dish {
  index: number;
  dish: string;
  type: "vegetarian" | "standard";
}
