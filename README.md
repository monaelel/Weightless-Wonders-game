Weightless Wonders — project notes

Structure
- index.html        -> Main menu + canvas + HUD
- styles.css        -> UI and starfield styles
- script.js         -> Starfield + LevelManager (dynamically loads levels from /levels)
- levels/level1.js  -> Microgravity level
- levels/level2.js  -> Earth gravity (placeholder)
- levels/level3.js  -> Variable gravity (placeholder)
- levels/level4.js  -> Free-fall chase (placeholder)
- levels/level5.js  -> Lunar landing (placeholder)
- assets/           -> Put your images, audio, and sprites here

How levels work
- Each level module must export start(ctx) and stop()
- start(ctx) should return a Promise that resolves true when the player completes the level, or false if aborted
- The LevelManager dynamically imports levels and sequences them when the Start button is used

Adding assets
- Place images under assets/images and reference them with relative paths (e.g. './assets/images/astronaut.png')
- Audio files may be added under assets/audio

Testing locally
- For full functionality (speech/audio) use a local server. Example using Python 3:

    python -m http.server 8000

Then open http://localhost:8000 in your browser.

Notes
- This scaffold keeps level logic modular for easy extension. I moved the initial Level 1 implementation into `levels/level1.js` and provided simple placeholders for the other levels so progression works out of the box.
