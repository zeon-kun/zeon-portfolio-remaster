# LinkedIn banners

Five 1584×396 banners in the portfolio's palette (cream `#f5f0eb`, clay `#a35b42`), using the
`@lucasmarkes/hairline` isometric figures from the chat shell.

All text and contact details sit at x ≥ 600px, clear of the profile photo on desktop and mobile.

| File | Style | Figures |
| --- | --- | --- |
| `linkedin-banner-1.png` | Blueprint, light | Exploded |
| `linkedin-banner-2.png` | Night, dark | Terminal, Cabinet, Router |
| `linkedin-banner-3.png` | Toolbox strip | Exploded, Sieve, Dish, Format, Branches |
| `linkedin-banner-4.png` | Clay | Terrain |
| `linkedin-banner-5.png` | Network | Hub |

## Re-render

```sh
python3 -m http.server 8766        # from the repo root, after `bun install`
node design/linkedin-banner/render.mjs design/linkedin-banner 1 2 3 4 5
```

Append `:d` to a variant (e.g. `2:d`) to overlay the profile-photo footprints.
