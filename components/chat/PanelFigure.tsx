"use client";

import {
  Branches,
  Dish,
  Elevator,
  Exploded,
  Loupe,
  Riffle,
  Sieve,
  Terrain,
  Vault,
  type HairlineProps,
} from "@lucasmarkes/hairline/react";

type Figure = React.ComponentType<HairlineProps>;

// One figure per page, keyed by exact pathname so nested routes (a blog post) stay figure-free.
const FIGURES: Record<string, Figure> = {
  "/changelog": Branches,
  "/blog": Riffle,
  "/market": Terrain,
  "/payme": Vault,
  "/booking": Dish,
  "/ratecard": Sieve,
  "/work": Exploded,
  "/experience": Elevator,
  "/pokedex": Loupe,
};

/** The hairline figure centred at the top of a panel. `play` keeps it alive on touch devices. */
export function PanelFigure({ pathname }: { pathname: string }) {
  const Figure = FIGURES[pathname];
  if (!Figure) return null;
  return (
    <div className="px-6 pt-8">
      <Figure key={pathname} theme="light" play className="mx-auto w-full max-w-[280px]" />
    </div>
  );
}
