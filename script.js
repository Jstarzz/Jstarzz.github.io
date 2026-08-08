/* ------------------------------------------------------------------
   josiah.is-a.dev · vanilla JS, no dependencies

   Everything here is deliberately defensive: TheCatAPI is a free public
   endpoint with no key, so it can rate-limit, return fewer images than
   requested, or fail outright. The page has to stay usable either way.
   ------------------------------------------------------------------ */

const CAT_API = "https://api.thecatapi.com/v1/images/search";
const log = (...args) => console.log("%c[cat]", "color:#ffb26b;font-weight:bold", ...args);

/* Running total of cats successfully rendered this session. */
let catsServed = 0;

function bumpCounter(n = 1) {
  catsServed += n;
  const el = document.getElementById("catCounter");
  if (el) el.textContent = String(catsServed);
}

/**
 * Fetch `count` cat images.
 *
 * The unauthenticated endpoint caps how many images a single request will
 * return, so anything short of the ask gets topped up with parallel
 * single-image requests. Rejects only if we end up with nothing at all.
 */
async function fetchCats(count = 1) {
  const collected = [];

  const pull = async (limit) => {
    const res = await fetch(`${CAT_API}?limit=${limit}&t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.filter((c) => c && c.url) : [];
  };

  try {
    collected.push(...(await pull(Math.min(count, 10))));
  } catch (err) {
    log("bulk request failed, falling back to singles:", err.message);
  }

  // Top up whatever the bulk call didn't give us.
  const missing = count - collected.length;
  if (missing > 0) {
    const singles = await Promise.allSettled(
      Array.from({ length: missing }, () => pull(1))
    );
    for (const result of singles) {
      if (result.status === "fulfilled") collected.push(...result.value);
    }
  }

  if (collected.length === 0) throw new Error("no cats returned");

  const cats = collected.slice(0, count);
  log(`got ${cats.length}/${count} cats`);
  return cats;
}

/** Swap an <img> src and fade it in once the bytes have actually arrived. */
function loadImage(img, url, alt) {
  return new Promise((resolve) => {
    img.classList.remove("loaded");
    img.alt = alt;
    img.onload = () => {
      img.classList.add("loaded");
      bumpCounter();
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/* ---------------- hero cat ---------------- */

const heroCat = document.getElementById("heroCat");
const heroCatLoading = document.getElementById("heroCatLoading");
const newHeroCatBtn = document.getElementById("newHeroCat");

async function loadHeroCat() {
  if (!heroCat) return;

  heroCatLoading.hidden = false;
  newHeroCatBtn.disabled = true;

  try {
    const [cat] = await fetchCats(1);
    await loadImage(heroCat, cat.url, "A randomly selected cat, fetched live from TheCatAPI");
    heroCatLoading.hidden = true;
  } catch (err) {
    log("hero cat failed:", err.message);
    heroCatLoading.textContent = "cat unavailable, the API is napping";
  } finally {
    newHeroCatBtn.disabled = false;
  }
}

newHeroCatBtn?.addEventListener("click", loadHeroCat);

/* ---------------- projects ---------------- */

const PROJECTS = [
  {
    name: "ASI",
    lang: "Python",
    url: "https://github.com/Jstarzz/ASI",
    desc: "Aqua Satus Invenio: a machine learning algorithm for remote detection of floating sargassum in satellite imagery. Built as my final-year research project."
  },
  {
    name: "ebay-search-mcp",
    lang: "TypeScript",
    url: "https://github.com/Jstarzz/ebay-search-mcp",
    desc: "A Model Context Protocol server that exposes eBay search to AI agents as a structured tool, so an assistant can query listings directly."
  },
  {
    name: "WindUI",
    lang: "Lua",
    url: "https://github.com/Jstarzz/WindUI",
    desc: "An open source UI library for Roblox with themeable components and a clean API. Other developers build their interfaces on top of it."
  },
  {
    name: "ai-engineering-from-scratch",
    lang: "Python",
    url: "https://github.com/Jstarzz/ai-engineering-from-scratch",
    desc: "Learn it. Build it. Ship it for others. Working through AI engineering by implementing the pieces myself instead of importing them."
  },
  {
    name: "homelab",
    lang: "Infra",
    url: "https://github.com/Jstarzz/homelab",
    desc: "The configuration behind my self-hosted setup: services, networking and the automation that keeps it reproducible after a rebuild."
  },
  {
    name: "DataConsumer",
    lang: "Go",
    url: "https://github.com/Jstarzz/DataConsumer",
    desc: "A Go utility for pulling and chewing through data at volume. Fast, concurrent, and unkind to metered connections."
  }
];

async function buildProjects() {
  const grid = document.getElementById("projectGrid");
  if (!grid) return;

  // Render the cards immediately; thumbnails stream in afterwards so the
  // content is never blocked on a third-party API.
  grid.innerHTML = PROJECTS.map(
    (p) => `
    <article class="card">
      <div class="card-thumb">
        <span class="card-lang">${p.lang}</span>
        <img alt="" aria-hidden="true" width="640" height="360">
      </div>
      <div class="card-body">
        <h3><a href="${p.url}" target="_blank" rel="noopener">${p.name}</a></h3>
        <p>${p.desc}</p>
        <a class="card-link" href="${p.url}" target="_blank" rel="noopener">view source →</a>
      </div>
    </article>`
  ).join("");

  try {
    const cats = await fetchCats(PROJECTS.length);
    const imgs = grid.querySelectorAll(".card-thumb img");
    imgs.forEach((img, i) => {
      const cat = cats[i % cats.length];
      if (cat) loadImage(img, cat.url, "");
    });
  } catch (err) {
    log("project thumbnails unavailable:", err.message);
    // Cards keep working with the plain background; nothing else to do.
  }
}

/* ---------------- cat section ---------------- */

const CAT_GRID_SIZE = 8;
const catGrid = document.getElementById("catGrid");
const catStatus = document.getElementById("catStatus");
const loadCatsBtn = document.getElementById("loadCats");

function setStatus(text, state) {
  if (!catStatus) return;
  catStatus.textContent = text;
  catStatus.dataset.state = state;
}

async function loadCatGrid() {
  if (!catGrid) return;

  loadCatsBtn.disabled = true;
  setStatus("fetching…", "loading");

  // Skeleton tiles so the layout doesn't jump when images land.
  catGrid.innerHTML = Array.from(
    { length: CAT_GRID_SIZE },
    () => `<div class="cat-tile skeleton"><img alt="" width="400" height="400"></div>`
  ).join("");

  const started = performance.now();

  try {
    const cats = await fetchCats(CAT_GRID_SIZE);
    const tiles = [...catGrid.querySelectorAll(".cat-tile")];

    await Promise.all(
      tiles.map((tile, i) => {
        const cat = cats[i % cats.length];
        tile.classList.remove("skeleton");
        return loadImage(tile.querySelector("img"), cat.url, `Random cat ${i + 1}`);
      })
    );

    const ms = Math.round(performance.now() - started);
    setStatus(`200 OK · ${cats.length} cats · ${ms}ms`, "ok");
  } catch (err) {
    log("cat grid failed:", err.message);
    catGrid.innerHTML = `<p class="cat-empty">The cat API didn't answer. It happens, try again in a moment.</p>`;
    setStatus(`error: ${err.message}`, "error");
  } finally {
    loadCatsBtn.disabled = false;
  }
}

loadCatsBtn?.addEventListener("click", loadCatGrid);

/* ---------------- init ---------------- */

log("booting portfolio · https://github.com/Jstarzz");
loadHeroCat();
buildProjects();
loadCatGrid();
