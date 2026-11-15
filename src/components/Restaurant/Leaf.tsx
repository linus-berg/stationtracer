/** Vegetarian marker. Blueprint has no leaf icon, so it's drawn here. */
export const Leaf = ({ label }: { label?: string }) => (
  <svg
    className="leaf"
    viewBox="0 0 24 24"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <path d="M20 3C10 3 4 8 4 15c0 2 .6 3.6 1.5 5L4 21.5 5.5 23 7 21.4C8.4 22.4 10 23 12 23c7 0 10-7 8-20Z" />
    <path d="M6.5 19.5C9 15 12 11.5 16 8.5" className="leaf__vein" />
  </svg>
);
