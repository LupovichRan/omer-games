# המשחקים של עומר

Simple offline-friendly Hebrew games for kids. Each game is one self-contained `index.html` (inline CSS/JS, no external assets) in its own folder.

- `/pikachu/` – Pikachu catches falling balls
- `/science/` – Pikachu science lab (sink or float, ramp, magnet)

## Adding a game
1. Create a folder, e.g. `memory/`, with a single self-contained `index.html` (Hebrew, `dir="rtl"`).
2. Add an `<a class="game cN" href="memory/">…</a>` tile to the root `index.html` (colors `c1`–`c4`).
3. Commit to `main`; GitHub Pages redeploys automatically in ~1 minute.
