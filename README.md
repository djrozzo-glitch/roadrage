# ROAD RAGE '96

Original browser arcade motorcycle-combat prototype, inspired by classic 1990s racing games. Built with HTML Canvas + vanilla JavaScript.

## Run

Open a hosted copy of `index.html` in a browser (GitHub Pages works). Artwork is loaded from relative paths in `assets/`, so keep the directory structure intact.

## Controls

- Arrow keys / WASD: accelerate, brake, steer
- Space / J: punch
- Shift / K: kick
- P / Escape: pause

Touch controls are included.

## Visual assets

Original editable vector SVG artwork:

- `assets/sprites/player.svg`: player motorcycle and rider
- `assets/sprites/rival-red.svg`, `rival-blue.svg`, `rival-green.svg`: opponent variants
- `assets/sprites/car.svg`, `truck.svg`: traffic
- `assets/sprites/pine.svg`, `palm.svg`, `rock.svg`, `sign.svg`: roadside elements
- `assets/sprites/cone.svg`, `barrier.svg`: additional obstacle art for later gameplay
- `assets/backgrounds/sunset-highway.svg`: mountain/sunset scene

## Development status

This is an early playable prototype. The missing-road issue was caused by road segment occlusion ordering and is patched in the current `main` branch. Visual assets are a first cohesive pass, not final animation sheets. Browser performance and gameplay balance still require playtesting.
