# jstarzz.github.io

My personal developer portfolio — hosted on GitHub Pages at
**[jstarzz.github.io](https://jstarzz.github.io)**.

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no
dependencies — clone it and open `index.html`.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and content |
| `styles.css` | Handwritten stylesheet (dark theme, responsive grid) |
| `script.js` | Project rendering + live [TheCatAPI](https://thecatapi.com) integration |

## The cat thing

Every image on the page is fetched live from TheCatAPI at runtime — the hero
portrait, the project card thumbnails, and the grid in the "cat endpoint"
section. It's a small demo of handling a real third-party API: the free tier
returns fewer images than you ask for, so `fetchCats()` tops up the shortfall
with parallel requests, fades images in only once they've decoded, and falls
back cleanly when the API rate-limits or goes down.

No API key is required, and none is embedded here.

## Local development

```bash
git clone https://github.com/Jstarzz/Jstarzz.github.io.git
cd Jstarzz.github.io
python -m http.server 8000   # or: npx serve
```

Then open <http://localhost:8000>.

## License

MIT
