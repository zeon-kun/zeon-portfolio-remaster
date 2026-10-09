# LinkedIn banners

Five 1584×396 banners in the portfolio's palette (cream `#f5f0eb`, clay `#a35b42`), using the
`@lucasmarkes/hairline` isometric figures from the chat shell and the Jeong companion tag
(`components/chat/Companion.tsx`), whose cursor the figures react to.

All text and contact details sit at x ≥ 600px, clear of the profile photo on desktop and mobile.

| File | Style | Figures | Companion |
| --- | --- | --- | --- |
| `linkedin-banner-1.png` | Blueprint, light | Exploded | poke it |
| `linkedin-banner-2.png` | Night, dark | Terminal, Cabinet, Router | thinking… |
| `linkedin-banner-3.png` | Toolbox strip | Exploded, Sieve, Dish, Format, Branches | hi, I’m Jeong |
| `linkedin-banner-4.png` | Clay | Terrain | ask me |
| `linkedin-banner-5.png` | Network | Hub | zzZ |

## Re-render

```sh
python3 -m http.server 8766        # from the repo root, after `bun install`
node design/linkedin-banner/render.mjs design/linkedin-banner 1 2 3 4 5
```

Prefix with `SCALE=2` or `SCALE=3` for a high-res render (`linkedin-banner-N@2x.png`).
Append `:d` to a variant (e.g. `2:d`) to overlay the profile-photo footprints.
