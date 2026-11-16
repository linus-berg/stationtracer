import type { ReactNode } from 'react';
import type { DishType } from '../../types/RestaurantMenu';
import { DISH_LABELS } from './dishTypes';

/*
 * Blueprint has no food icons, so they're drawn here as one set: solid shapes
 * on a 24-unit grid, with details cut out in the background colour.
 */
const GLYPHS: Record<DishType, ReactNode> = {
  // A cow's head. A steak reads as a blob at rest-day size; the horns and ears don't.
  standard: (
    <>
      <path d="M7.4 6.4C7.2 4.9 8.4 4.4 9.6 4.4h4.8c1.2 0 2.4.5 2.2 2L16 14.2H8Z" />
      <path d="M7.9 5.6C5.4 5.4 3.6 4 3.2 1.6 4.8 2.8 6.6 3.2 8.6 3.4ZM16.1 5.6c2.5-.2 4.3-1.6 4.7-4-1.6 1.2-3.4 1.6-5.4 1.8Z" />
      <path d="M7.6 7.6C5.6 6.8 3.4 7.2 1.6 8.8c1.8 1.4 4.2 1.6 6.2.6ZM16.4 7.6c2-.8 4.2-.4 6 1.2-1.8 1.4-4.2 1.6-6.2.6Z" />
      <rect x="5.8" y="13.2" width="12.4" height="8.6" rx="4.3" />
      <circle className="dish-icon__hole" cx="9.7" cy="9.6" r="1" />
      <circle className="dish-icon__hole" cx="14.3" cy="9.6" r="1" />
      <circle className="dish-icon__hole" cx="9.4" cy="17.6" r="1.2" />
      <circle className="dish-icon__hole" cx="14.6" cy="17.6" r="1.2" />
    </>
  ),
  // A drumstick.
  bird: (
    <>
      <path d="M9.6 14.9C7.6 11.6 8.3 7 11.6 4.6c3.3-2.3 7.9-1.9 9.5 1.6 1.6 3.6-.5 8-4.6 9.6-2.6 1-5 .5-6.9-.9Z" />
      <path d="M12 14.6 7.2 19.4 5.2 17.4 10 12.6Z" />
      <circle cx="4.4" cy="18" r="2" />
      <circle cx="6.6" cy="20.2" r="2" />
      <path className="dish-icon__cut" d="M13.4 6.6c1.6-1.1 3.6-1.2 5.1-.2" />
    </>
  ),
  fish: (
    <>
      <path d="M1.4 12c2.6-4.7 6.3-6.8 10.1-6.8 3.4 0 6 2 7.8 4.5L23 6.2v11.6l-3.7-3.5c-1.8 2.5-4.4 4.5-7.8 4.5-3.8 0-7.5-2.1-10.1-6.8Z" />
      <circle className="dish-icon__hole" cx="6.2" cy="10.8" r="1.3" />
      <path className="dish-icon__cut" d="M10.2 7.9c1.4 2.4 1.4 5.8 0 8.2" />
    </>
  ),
  // A curled shrimp.
  seafood: (
    <>
      <path d="M17.11 10.13C20.71 10.33 21.89 4.99 17.99 5.19A9.4 9.4 0 1 0 15.72 21.32L16.05 17.68A4.4 4.4 0 1 1 17.11 10.13Z" />
      <path d="M15.09 18.1 22.8 15.2 20.6 18.6 22.2 22.6 15.29 20.9Z" />
      <path
        className="dish-icon__cut"
        d="M12.16 8.8 8.61 4.9M9.42 11.79 4.21 9.69M9.6 15.84 4.5 16.19M12.16 18.4 8.61 20.3"
      />
      <path className="dish-icon__line" d="M20.4 6.4C18 1.8 10.8 1 5.2 3.6M21.3 7.6c-1.3-3.4-5-5.3-9.4-5.1" />
      <circle className="dish-icon__hole" cx="18.2" cy="7.4" r=".95" />
    </>
  ),
  // A bowl with a spoon; steam alone could be any hot dish.
  soup: (
    <>
      <path d="M2 11.4h20c-.2 5-4 8.9-8.9 9.5h-2.2C6 20.3 2.2 16.4 2 11.4Z" />
      <rect x="8.2" y="20.2" width="7.6" height="2.4" rx=".8" />
      <path d="M13.9 10.2 20.2 1.8A1 1 0 0 1 21.8 3L15.5 11.4A1 1 0 0 1 13.9 10.2Z" />
      <path className="dish-icon__line" d="M7 3.2c-1.1 1.2-1.1 2.4 0 3.6s1.1 2.4 0 3.6M11.2 2c-1.1 1.3-1.1 2.6 0 3.9s1.1 2.6 0 3.9" />
    </>
  ),
  vegetarian: (
    <>
      <path d="M20 3C10 3 4 8 4 15c0 2 .6 3.6 1.5 5L4 21.5 5.5 23 7 21.4C8.4 22.4 10 23 12 23c7 0 10-7 8-20Z" />
      <path className="dish-icon__cut" d="M6.5 19.5C9 15 12 11.5 16 8.5" />
    </>
  ),
  // A Christmas tree with its star.
  christmas: (
    <>
      <path d="M12 4.2 16.4 9.6h-2.1l4.4 5.2h-2.4l4.6 5.4H3.1l4.6-5.4H5.3l4.4-5.2H7.6Z" />
      <rect x="10.4" y="20.2" width="3.2" height="2.8" />
      <path className="dish-icon__star" d="m12 .6.9 1.9 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 2.8l2.1-.3Z" />
    </>
  ),
  // A clock: the restaurant closes early, or is closed all day.
  closing: (
    <>
      <circle cx="12" cy="12.5" r="9.8" />
      <path className="dish-icon__cut" d="M12 7v5.5l3.6 2.4" />
    </>
  ),
};

interface Props {
  type: DishType;
  /** Announce the type to assistive technology; leave off where a text label follows. */
  labelled?: boolean;
}

/** Renders nothing for a type this display doesn't know yet. */
export const DishIcon = ({ type, labelled = false }: Props) => {
  const glyph = GLYPHS[type];
  if (!glyph) return null;
  return (
    <svg
      className={`dish-icon dish-icon--${type}`}
      viewBox="0 0 24 24"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? DISH_LABELS[type] : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {glyph}
    </svg>
  );
};
