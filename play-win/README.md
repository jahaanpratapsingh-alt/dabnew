# Dab Habitz Play & Win — PAC collision logic fix

PAC HABIT now uses deterministic tile collision: one swipe/key slides in a straight line to the last legal tile before a wall. Every maze cell has an explicit grid coordinate, so moving actors can no longer cause CSS Grid to reflow walls.

Open `index.html` or upload this folder to GitHub Pages.

## Mobile PAC control update
PAC HABIT now includes a mobile-only directional control disc. Tapping a direction highlights that arrow, plays feedback audio, and uses the exact same full-run-to-wall movement function as swipe/keyboard input. Swipe remains supported.
