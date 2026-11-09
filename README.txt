ROAD RAGE '96 — FIXED BUILD (2026-11-09)

This release fixes a JavaScript ReferenceError from the previous road curve update:
"maxy is not defined". That error stopped canvas rendering midway through each frame.

Contains index.html and all graphical assets (assets/).

Deployment: unzip, open the road_rage_96 folder, then upload BOTH index.html AND the assets folder to the root of your GitHub repository, replacing existing files. Do not upload only the index.html file, since sprites and backgrounds are loaded separately.

GitHub Pages: https://djrozzo-glitch.github.io/roadrage/
After uploading, hard refresh: Cmd + Shift + R.

Controls: Up/W accelerate; Down/S brake; Left/Right or A/D steer; Space/J punch; Shift/K kick; P/Esc pause.

Validation: JavaScript syntax checked and scene rendered in headless Chromium with assets embedded for the test (no page errors). Screenshots from first frame and a steering test were reviewed. Full GitHub Pages deployment was not tested.

CLEAN TRAFFIC UPDATE (NOV 2026)
- Roadside decorations reduced to widely spaced small objects.
- Road obstacles are rare, mostly at shoulders, and only after the opening section.
- Traffic density reduced for greater readability.
- Traffic now animates using body sway, suspension bounce, glowing brake lights,
  and police lights. Original PNG vehicle sprites remain in assets/sprites/vehicles.
- Game draw/update smoke-tested for 400 frames; test in browser after deployment.
