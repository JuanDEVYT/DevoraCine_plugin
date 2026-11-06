// src/browse/model.js
var TAB_IDS = ["inicio", "peliculas", "series", "animacion"];
var MAX_SLIDES = 6;
var MAX_RAILS = 8;
var MAX_RAIL_ITEMS = 24;
var MAX_SLIDE_TEXT = 160;
var HTTPS = /^https?:\/\//;
function cardOf(item) {
  if (!item) return null;
  const out = {
    id: `${item.kind || "movie"}-${item.id}`,
    ref: item.ref,
    title: item.title,
    kind: item.kind || "movie"
  };
  const poster = item.poster || item.art || item.logo;
  if (poster && HTTPS.test(poster)) out.poster = poster;
  if (item.backdrop && HTTPS.test(item.backdrop)) out.backdrop = item.backdrop;
  if (item.rating !== void 0) out.rating = item.rating;
  if (item.year !== void 0) out.year = item.year;
  if (item.badges && Array.isArray(item.badges)) out.badges = item.badges.slice(0, 3);
  return out;
}
function slidesOf(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const img = it.backdrop || it.image || it.poster || it.art;
    if (!img || !HTTPS.test(img)) continue;
    if (!it.ref || typeof it.ref !== "string") continue;
    const title = typeof it.title === "string" ? it.title : "";
    const rawTxt = typeof it.text === "string" ? it.text : typeof it.overview === "string" ? it.overview : "";
    const text = rawTxt.length > MAX_SLIDE_TEXT ? rawTxt.slice(0, MAX_SLIDE_TEXT - 1).trim() + "\u2026" : rawTxt;
    const s = {
      id: `${it.kind || "movie"}-${it.id || title}`,
      ref: it.ref,
      kind: it.kind || "movie",
      title,
      image: img,
      text
    };
    if (it.logo && HTTPS.test(it.logo)) s.logo = it.logo;
    out.push(s);
    if (out.length >= MAX_SLIDES) break;
  }
  return out;
}
function railsOf(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const itemsRaw = Array.isArray(row.items) ? row.items : [];
    const items = itemsRaw.map(cardOf).filter(Boolean).slice(0, MAX_RAIL_ITEMS);
    if (items.length === 0) continue;
    out.push({
      id: String(row.id || row.ref || out.length),
      title: String(row.title || ""),
      ref: typeof row.ref === "string" ? row.ref : void 0,
      items
    });
    if (out.length >= MAX_RAILS) break;
  }
  return out;
}
function tabOf(page) {
  if (!page || typeof page !== "object") return null;
  const rows = Array.isArray(page.rows) ? page.rows : [];
  const explicitSlides = Array.isArray(page.slides) ? page.slides : [];
  let slides = slidesOf(explicitSlides);
  let rails = railsOf(rows);
  if (slides.length === 0 && rails.length > 0) {
    const first = rails[0];
    const rest = rails.slice(1);
    const promoted = first.items.filter((i) => i.backdrop || i.poster).slice(0, MAX_SLIDES);
    if (promoted.length > 0) {
      slides = slidesOf(promoted.map((c) => ({ ...c, image: c.backdrop || c.poster })));
      rails = rest;
    }
  }
  return { slides, rails };
}
function playedKey(ref) {
  const r = String(ref || "");
  const m = /\/(?:pelicula|serie|episodio)\/([^\/\?#]+)/.exec(r) || /devoracine\.autos\/[^\/]+\/([^\/\?#]+)/.exec(r);
  return m ? m[1] : "";
}
function recentOf(keys, loadedTabs) {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const pool = /* @__PURE__ */ new Map();
  for (const tab of loadedTabs) {
    if (!tab) continue;
    for (const r of tab.rails) {
      for (const c of r.items) {
        const k = playedKey(c.ref);
        if (k && !pool.has(k)) pool.set(k, c);
      }
    }
    for (const s of tab.slides) {
      const k = playedKey(s.ref);
      if (k && !pool.has(k)) {
        pool.set(k, {
          id: s.id,
          ref: s.ref,
          kind: s.kind,
          title: s.title,
          poster: s.image,
          backdrop: s.image
        });
      }
    }
  }
  const out = [];
  for (const k of keys) {
    const hit = pool.get(k);
    if (hit) out.push(hit);
  }
  return out;
}

// src/browse/words.js
var WORDS_RAW = {
  appName: ["DevoraCine", "DevoraCine"],
  tabHome: ["Inicio", "Home"],
  tabMovies: ["Pel\xEDculas", "Movies"],
  tabSeries: ["Series", "Series"],
  tabAnime: ["Animaci\xF3n", "Animation"],
  recentRail: ["Continuar viendo", "Continue Watching"],
  emptyTitle: ["Sin contenido todav\xEDa", "No content yet"],
  emptySub: ["Vuelve a intentarlo en unos instantes.", "Try again in a few moments."],
  failedTitle: ["No se pudo cargar", "Could not load"],
  failedSub: ["Comprueba la conexi\xF3n e int\xE9ntalo de nuevo.", "Check your connection and try again."],
  btnRetry: ["Reintentar", "Retry"],
  btnSearch: ["Buscar", "Search"],
  btnSettings: ["Ajustes", "Settings"],
  brSearchTitle: ["Buscar en DevoraCine", "Search DevoraCine"],
  brSearchHint: ["Pel\xEDcula, serie o t\xEDtulo...", "Movie, series or title..."],
  brRecentSearches: ["B\xFAsquedas recientes", "Recent searches"],
  brNoResults: ["Sin resultados para esta b\xFAsqueda.", "No results for this search."],
  brSearching: ["Buscando en DevoraCine...", "Searching DevoraCine..."],
  brTypeToSearch: ["Escribe un t\xEDtulo para empezar a buscar.", "Type a title to start searching."],
  setLangTitle: ["Idioma de audio preferido", "Preferred Audio Language"],
  setLangDesc: ["Prioridad al seleccionar servidores de reproducci\xF3n autom\xE1tica.", "Priority when selecting auto-play servers."],
  setLangLatino: ["Espa\xF1ol Latino", "Latin Spanish"],
  setLangCastellano: ["Castellano (Espa\xF1a)", "Castilian (Spain)"],
  setLangSub: ["Subtitulado", "Subtitled"],
  aboutTitle: ["Acerca de DevoraCine", "About DevoraCine"],
  aboutDesc: ["Cat\xE1logo y reproducci\xF3n de Devoracine para Kino.", "Official HD catalog and playback plugin for Kino."],
  aboutAuthor: ["Creado por JuandreXter", "Created by JuandreXter"],
  aboutVersion: ["Versi\xF3n 1.2.0", "Version 1.2.0"],
  watchNow: ["Reproducir", "Play"],
  moreInfo: ["Ver detalles", "More details"],
  brWatch: ["Reproducir", "Play"],
  brInfo: ["Ver detalles", "Details"],
  brSettings: ["Ajustes", "Settings"],
  brClose: ["Cerrar", "Close"],
  brSearch: ["Buscar", "Search"],
  brRecent: ["Continuar viendo", "Continue watching"],
  brEmpty: ["No hay contenido disponible.", "No content available."],
  brFailed: ["No se pudo cargar el contenido.", "Could not load content."],
  brRetry: ["Reintentar", "Retry"]
};
var WORDS = Object.fromEntries(
  Object.entries(WORDS_RAW).map(([k, [es, en]]) => [
    k,
    { id: k, es, en, text: es, textEn: en }
  ])
);
function both(key, vars = {}) {
  const w = WORDS[key] || { id: key, es: key, en: key };
  let es = w.es;
  let en = w.en;
  for (const [k, v] of Object.entries(vars)) {
    es = es.replaceAll(`{${k}}`, v);
    en = en.replaceAll(`{${k}}`, v);
  }
  return { id: w.id, es, en, text: es, textEn: en };
}

// src/browse/logo.js
var LOGO_ASPECT = "1:1";
var LOGO_DATA = "data:image/png;base64,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";

// src/browse/view.js
var TAB_KEYS = {
  inicio: "tabHome",
  peliculas: "tabMovies",
  series: "tabSeries",
  animacion: "tabAnime",
  anime: "tabAnime"
};
var POLL_MS = 1500;
var SEARCH_CAP = 60;
var twin = (key, field = "text", vars) => {
  const w = both(key, vars);
  return { [field]: w.es, [field + "En"]: w.en };
};
var logo = () => ({
  type: "Image",
  key: "logo",
  url: LOGO_DATA,
  aspect: LOGO_ASPECT,
  fit: "contain",
  h: 40,
  alt: "DevoraCine",
  altEn: "DevoraCine",
  fallback: { type: "Text", text: "DevoraCine", textEn: "DevoraCine", style: "h4" }
});
var tabBar = (active) => ({
  type: "TabBar",
  key: "tabs",
  divider: false,
  value: active,
  onChanged: "tab",
  tabs: TAB_IDS.map((id) => ({ value: id, ...twin(TAB_KEYS[id], "label") }))
});
var railSkeleton = (n) => ({
  type: "Column",
  key: "skel" + n,
  gap: 8,
  children: [
    { type: "Skeleton", shape: "line" },
    { type: "Row", gap: 12, sizes: ["compact"], children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}c${i}`, flex: 1 })) },
    { type: "Row", gap: 12, sizes: ["medium", "expanded"], children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}w${i}`, flex: 1 })) }
  ]
});
var gridSkeleton = () => ({
  type: "Column",
  key: "gridSkeleton",
  gap: 12,
  children: [
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["compact"], key: `gc${r}`, children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `gc${r}-${i}`, flex: 1 })) })),
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["medium", "expanded"], key: `gw${r}`, children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `gw${r}-${i}`, flex: 1 })) }))
  ]
});
var heroSkeleton = () => ({
  type: "Skeleton",
  key: "heroSkeleton",
  shape: "block",
  height: { compact: 200, expanded: 320 }
});
var slideNode = (s) => ({
  type: "heroCard",
  key: "slide-" + s.id,
  h: { compact: 200, expanded: 240 },
  title: s.title,
  text: s.text,
  image: s.image,
  ...s.logo ? { logo: s.logo } : {},
  buttons: [
    {
      type: "ElevatedButton",
      key: "watch-" + s.id,
      ...twin("brWatch", "labelText"),
      icon: "play",
      onPressed: { go: { play: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } }
    },
    {
      type: "TextButton",
      key: "info-" + s.id,
      ...twin("brInfo", "labelText"),
      onPressed: { go: { title: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } }
    }
  ]
});
var hero = (slides) => slides.length === 1 ? slideNode(slides[0]) : {
  type: "PageView",
  key: "hero" + slides.length,
  autoPlayMs: 6e3,
  children: slides.map(slideNode)
};
var rail = (r, key, titleOverride, size = "medium") => ({
  type: "titleRail",
  key,
  ...titleOverride || { title: r.title },
  ...r.ref ? { ref: r.ref } : {},
  items: r.items,
  size
});
function browseView({ tab, data, recent, pending, failed, device = "phone" }) {
  const tv = device === "tv";
  const gear = {
    type: "IconButton",
    key: "settingsButton",
    icon: "settings",
    ...twin("brSettings", "labelText"),
    ...twin("brSettings", "tooltip"),
    onPressed: { event: "go", arg: "settings" }
  };
  const active = TAB_IDS.includes(tab) ? tab : TAB_IDS[0];
  const body = [];
  if (data) {
    if (data.slides.length > 0) body.push(hero(data.slides));
    else if (pending) body.push(heroSkeleton());
    if (recent && recent.length > 0) body.push(rail({ items: recent }, "recent", twin("brRecent", "title"), tv ? "small" : "medium"));
    for (const r of data.rails) {
      body.push(rail(r, "rail-" + String(r.id).replace(/[^A-Za-z0-9_-]/g, "_"), null, tv ? "small" : "medium"));
    }
    if (data.rails.length === 0) {
      body.push({ type: "Text", ...twin("brEmpty", "text"), color: "muted" });
    }
  } else if (failed) {
    body.push({
      type: "MaterialBanner",
      key: "loadFailed",
      role: "error",
      ...twin("brFailed"),
      action: { ...twin("brRetry", "label"), onTap: "retry" }
    });
  } else {
    body.push(heroSkeleton(), railSkeleton(1), railSkeleton(2), railSkeleton(3));
  }
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "close",
        icon: "close",
        ...twin("brClose", "labelText"),
        ...twin("brClose", "tooltip"),
        onPressed: { go: { close: true } }
      },
      actions: tv ? [
        {
          type: "IconButton",
          key: "searchButton",
          icon: "search",
          ...twin("brSearch", "labelText"),
          ...twin("brSearch", "tooltip"),
          onPressed: "openSearch"
        },
        gear
      ] : [gear],
      title: tv ? {
        type: "Row",
        key: "titleRow",
        gap: 24,
        crossAxisAlignment: "center",
        children: [logo(), tabBar(active)]
      } : logo()
    },
    ...tv ? {} : {
      floatingActionButton: {
        type: "FloatingActionButton",
        key: "searchFab",
        icon: "search",
        ...twin("brSearch", "tooltip"),
        onPressed: "openSearch"
      }
    },
    body: {
      type: "Column",
      key: "page",
      children: [
        ...tv ? [] : [
          {
            type: "Column",
            key: "tabsRow",
            padding: { compact: 0, expanded: 24 },
            children: [tabBar(active)]
          }
        ],
        {
          type: "SingleChildScrollView",
          key: "browse-" + active,
          flex: 1,
          children: [
            {
              type: "Column",
              padding: { compact: 12, expanded: 24 },
              gap: 16,
              children: body
            }
          ]
        }
      ]
    },
    ...pending ? { every: { ms: POLL_MS, event: "tick" } } : {}
  };
}
function settingsView() {
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "back",
        icon: "arrow_back",
        ...twin("brBack", "labelText"),
        ...twin("brBack", "tooltip"),
        onPressed: "back"
      },
      title: logo()
    },
    body: {
      type: "SingleChildScrollView",
      key: "settings-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: [{ type: "settings", key: "form" }]
        }
      ]
    }
  };
}
function searchView({ query, status, items, history = [], device = "phone" }) {
  const tv = device === "tv";
  const searchForm = () => ({
    type: "Form",
    key: "searchForm",
    onSubmitted: "search",
    gap: 8,
    children: tv ? [
      {
        type: "Row",
        key: "searchRow",
        gap: 16,
        crossAxisAlignment: "center",
        children: [
          {
            type: "TextField",
            key: "q",
            kind: "text",
            value: query,
            ...twin("brSearchHint", "labelText"),
            maxLength: 100,
            autofocus: true,
            weight: 1
          },
          {
            type: "ElevatedButton",
            key: "searchGo",
            ...twin("brSearch", "labelText"),
            icon: "search",
            submit: true
          }
        ]
      }
    ] : [
      {
        type: "TextField",
        key: "q",
        kind: "text",
        value: query,
        ...twin("brSearchHint", "labelText"),
        maxLength: 100,
        autofocus: true
      },
      {
        type: "ElevatedButton",
        key: "searchGo",
        ...twin("brSearch", "labelText"),
        icon: "search",
        submit: true
      }
    ]
  });
  const body = tv ? [] : [searchForm()];
  if (status === "fail") {
    body.push({
      type: "MaterialBanner",
      key: "searchFailed",
      role: "error",
      ...twin("brSearchFailed"),
      action: { ...twin("brRetry", "label"), onTap: "sretry" }
    });
  } else if (status === "done" && items) {
    if (items.length === 0) {
      body.push({ type: "Text", ...twin("brNoResults", "text"), color: "muted" });
    } else {
      body.push({
        type: "titleGrid",
        key: "results",
        columns: { compact: 3, expanded: 6 },
        items: items.slice(0, SEARCH_CAP)
      });
    }
  } else if (status !== "idle") {
    body.push(gridSkeleton());
  } else if (history && history.length > 0) {
    body.push({ type: "Text", ...twin("brSearchedBefore", "text"), style: "h4" });
    body.push({
      type: "titleGrid",
      key: "history",
      columns: { compact: 3, expanded: 6 },
      items: history.slice(0, SEARCH_CAP)
    });
  }
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "back",
        icon: "arrow_back",
        ...twin("brBack", "labelText"),
        ...twin("brBack", "tooltip"),
        onPressed: "back"
      },
      ...tv ? { title: searchForm() } : twin("brSearchTitle", "title")
    },
    body: {
      type: "SingleChildScrollView",
      key: "search-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: body
        }
      ]
    },
    ...status === "loading" ? { every: { ms: 1e3, event: "stick" } } : {}
  };
}

// src/browse/metaCache.js
var KEY = "devoracine_meta1";
var MAX = 260;
var CONCURRENCY = 3;
var HTTPS2 = /^https?:\/\//;
function makeMetaCache({ kino: kino2, clock = { now: () => Date.now() } }) {
  const usable = () => {
    try {
      return typeof kino2.meta === "function" && kino2.meta.byTitle === true;
    } catch (_) {
      return false;
    }
  };
  let book = null;
  function read() {
    if (book) return book;
    try {
      const o = JSON.parse(kino2.storage.get(KEY) || "null");
      book = o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (_) {
      book = {};
    }
    return book;
  }
  function write() {
    try {
      const ids = Object.keys(book);
      if (ids.length > MAX) {
        for (const id of ids.slice(0, ids.length - MAX)) delete book[id];
      }
      kino2.storage.set(KEY, JSON.stringify(book));
    } catch (_) {
    }
  }
  function known(id) {
    const e = read()[id];
    if (!e) return {};
    return {
      ...e.t > 0 ? { tmdb: e.t } : {},
      ...e.l && HTTPS2.test(e.l) ? { logo: e.l } : {},
      ...e.b && HTTPS2.test(e.b) ? { backdrop: e.b } : {},
      ...e.o ? { overview: e.o } : {}
    };
  }
  const asked = (id) => Object.hasOwn(read(), id);
  function dress(cards) {
    return cards.map((c) => {
      const k = known(c.id);
      const withId = k.tmdb && !(c.ids && c.ids.tmdb) ? { ...c, ids: { ...c.ids || {}, tmdb: k.tmdb } } : c;
      const withBackdrop = k.backdrop && !withId.backdrop ? { ...withId, backdrop: k.backdrop } : withId;
      return k.logo && !withBackdrop.logo ? { ...withBackdrop, logo: k.logo } : withBackdrop;
    });
  }
  async function fill(cards, budgetMs) {
    if (!usable()) return 0;
    const start = clock.now();
    let count = 0;
    const pending = cards.filter((c) => !asked(c.id));
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      if (clock.now() - start >= budgetMs) break;
      const slice = pending.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (c) => {
          try {
            const type = c.kind === "series" ? "series" : "movie";
            const yearNum = c.year ? parseInt(c.year, 10) : void 0;
            const res = await kino2.meta({
              type,
              title: c.title,
              ...yearNum && yearNum > 1900 ? { year: yearNum } : {}
            });
            count++;
            if (!res) {
              read()[c.id] = { t: 0, l: "" };
            } else {
              const tmdbId = res.ids && res.ids.tmdb || res.id || 0;
              read()[c.id] = {
                t: tmdbId,
                l: res.logo || "",
                b: res.backdrop || "",
                o: res.overview || ""
              };
            }
          } catch (_) {
          }
        })
      );
    }
    if (count > 0) write();
    return count;
  }
  return { usable, known, asked, dress, fill };
}

// src/browse/index.js
var TAB_KEY = "devoracine_browseTab";
var SNAP_PREFIX = "devoracine_browse1:";
var SNAP_TTL_MS = 12 * 3600 * 1e3;
var SNAP_MAX = 24 * 1024;
var RECENT_KEY = "devoracine_recent1";
var RECENT_MAX = 16;
var HIST_KEY = "devoracine_searchHist1";
var HIST_MAX = 24;
var MAX_META_TICKS = 30;
var MAX_LOAD_TRIES = 3;
function metaAsk(c) {
  const title = String(c.title).replace(/\s*[([][^)\]]*[)\]]/g, "").replace(/\s+/g, " ").trim() || String(c.title);
  const y = /\((19|20)\d{2}\)/.exec(String(c.title));
  return { id: c.id, title, kind: c.kind, ...y ? { year: parseInt(y[0].slice(1, 5), 10) } : {} };
}
function makeBrowse({ kino: kino2, loadTab, searchTitles }) {
  const meta = makeMetaCache({ kino: kino2 });
  const slidesFrom = (rails) => {
    const out = [];
    for (const r of rails) {
      for (const c of r.items) {
        if (out.length >= 6) return out;
        const k = meta.known(c.id);
        const img = k.backdrop || c.poster;
        if (!img || out.some((s) => s.id === c.id)) continue;
        out.push({
          id: c.id,
          ref: c.ref,
          kind: c.kind,
          title: c.title,
          image: img,
          text: k.overview || (c.badges ? c.badges.join(" \xB7 ") : ""),
          ...k.logo ? { logo: k.logo } : {}
        });
      }
    }
    return out;
  };
  const uniform = (items) => items.every((i) => i.backdrop) ? items : items.map(({ backdrop, ...rest }) => rest);
  const enrich = (data) => data ? {
    slides: data.slides.length > 0 ? data.slides.map((s) => {
      const k = meta.known(s.id);
      return k.logo ? { ...s, logo: k.logo } : s;
    }) : slidesFrom(data.rails),
    rails: data.rails.map((r) => ({ ...r, items: uniform(meta.dress(r.items)) }))
  } : data;
  const metaTries = /* @__PURE__ */ new Map();
  const memo = /* @__PURE__ */ new Map();
  const log2 = (...a) => {
    try {
      kino2.log("[DevoraCine]", ...a);
    } catch (_) {
    }
  };
  const get = (k) => {
    try {
      return kino2.storage.get(k);
    } catch (_) {
      return null;
    }
  };
  const set = (k, v, opts) => {
    try {
      kino2.storage.set(k, v, opts);
    } catch (_) {
    }
  };
  function readSnap(tab) {
    try {
      const o = JSON.parse(get(SNAP_PREFIX + tab) || "null");
      return o && Date.now() - o.at < SNAP_TTL_MS && o.data && Array.isArray(o.data.rails) ? o.data : null;
    } catch (_) {
      return null;
    }
  }
  function writeSnap(tab, data) {
    for (let max = 20; max >= 6; max -= 2) {
      try {
        const slim = {
          slides: data.slides.slice(0, 5),
          rails: data.rails.map((r) => ({ ...r, items: r.items.slice(0, max) }))
        };
        const s = JSON.stringify({ at: Date.now(), data: slim });
        if (s.length <= SNAP_MAX) {
          set(SNAP_PREFIX + tab, s);
          return;
        }
      } catch (_) {
      }
    }
  }
  function dataOf(tab) {
    const m = memo.get(tab);
    if (m) return m.data;
    const s = readSnap(tab);
    if (s) {
      memo.set(tab, { data: s, whole: false });
      return s;
    }
    return null;
  }
  const stored = () => {
    const t = get(TAB_KEY);
    return TAB_IDS.includes(t) ? t : null;
  };
  const remember = (tab) => {
    set(TAB_KEY, tab);
  };
  function readKeys() {
    try {
      const a = JSON.parse(get(RECENT_KEY) || "[]");
      return Array.isArray(a) ? a.filter((k) => typeof k === "string") : [];
    } catch (_) {
      return [];
    }
  }
  function notePlayed(ref) {
    const k = playedKey(ref);
    if (!k) return;
    const prior = readKeys().filter((x) => x !== k);
    try {
      set(RECENT_KEY, JSON.stringify([k, ...prior].slice(0, RECENT_MAX)));
    } catch (_) {
    }
  }
  function readHistory() {
    try {
      const a = JSON.parse(get(HIST_KEY) || "[]");
      return Array.isArray(a) ? a.filter((c) => c && typeof c.id === "string" && typeof c.ref === "string" && typeof c.title === "string").slice(0, HIST_MAX) : [];
    } catch (_) {
      return [];
    }
  }
  function rememberFound(cards) {
    try {
      const fresh = cards.slice(0, 12).map((c) => ({
        id: c.id,
        ref: c.ref,
        title: c.title,
        kind: c.kind,
        poster: c.poster,
        year: c.year,
        rating: c.rating
      }));
      const ids = new Set(fresh.map((c) => c.id));
      set(HIST_KEY, JSON.stringify([...fresh, ...readHistory().filter((c) => !ids.has(c.id))].slice(0, HIST_MAX)));
    } catch (_) {
    }
  }
  let found = null;
  const tabFromArgs = (route) => {
    const a = route && route.args && typeof route.args === "object" ? route.args : {};
    return TAB_IDS.includes(a.tab) ? a.tab : null;
  };
  function needed(tab, device) {
    const order = [tab, ...TAB_IDS.filter((t) => t !== tab)];
    return order.filter((t, i) => (i === 0 || device !== "tv") && !(memo.get(t) && memo.get(t).whole));
  }
  function view(ctx) {
    const st = ctx.state && typeof ctx.state === "object" ? ctx.state : {};
    if (ctx.route && ctx.route.name === "settings") return settingsView();
    if (ctx.route && ctx.route.name === "search") {
      const query = typeof st.sq === "string" ? st.sq : "";
      const items = found && found.q === query ? found.items : null;
      const status = query === "" ? "idle" : st.sstate === "fail" ? "fail" : items ? "done" : "loading";
      return searchView({ query, status, items, history: query === "" ? readHistory() : [], device: ctx.device });
    }
    const tab = TAB_IDS.includes(st.tab) ? st.tab : tabFromArgs(ctx.route) ?? stored() ?? TAB_IDS[0];
    const data = enrich(dataOf(tab));
    const loaded = TAB_IDS.map((t) => memo.get(t)).filter(Boolean).map((m) => m.data);
    const pending = Array.isArray(st.pending) && st.pending.length > 0;
    return browseView({
      tab,
      data,
      recent: uniform(meta.dress(recentOf(readKeys(), loaded))),
      pending,
      failed: !!(st.failed && st.failed[tab]),
      device: ctx.device
    });
  }
  async function load(tab) {
    const page = await loadTab(tab);
    const data = tabOf(page);
    if (data) {
      memo.set(tab, { data, whole: true });
      writeSnap(tab, data);
    }
    return data !== null;
  }
  const loadTries = /* @__PURE__ */ new Map();
  function failLoad(tab, rest, failed) {
    const n = (loadTries.get(tab) || 0) + 1;
    loadTries.set(tab, n);
    if (n < MAX_LOAD_TRIES) rest.push(tab);
    else {
      failed[tab] = true;
      loadTries.delete(tab);
    }
  }
  const events = {
    open({ route, state, device }) {
      const tab = tabFromArgs(route) ?? (TAB_IDS.includes(state.tab) ? state.tab : stored() ?? TAB_IDS[0]);
      for (const t of TAB_IDS) dataOf(t);
      return { state: { tab, pending: needed(tab, device), failed: null } };
    },
    tab({ value, arg, state }) {
      const tab = TAB_IDS.includes(value) ? value : TAB_IDS.includes(arg) ? arg : null;
      if (!tab) return null;
      remember(tab);
      dataOf(tab);
      const failed = { ...state.failed || {} };
      delete failed[tab];
      const pending = [tab, ...Array.isArray(state.pending) ? state.pending.filter((t) => t !== tab) : []];
      return { state: { tab, pending: memo.get(tab) && memo.get(tab).whole ? pending.slice(1) : pending, failed } };
    },
    retry({ state, device }) {
      const tab = TAB_IDS.includes(state.tab) ? state.tab : TAB_IDS[0];
      return { state: { failed: null, pending: [tab, ...needed(tab, device).filter((t) => t !== tab)] } };
    },
    async tick({ state }) {
      const pending = Array.isArray(state.pending) ? state.pending : [];
      if (pending.length === 0) return null;
      const [next, ...rest] = pending;
      const failed = { ...state.failed || {} };
      if (next.startsWith("meta:")) {
        const tabId = next.slice(5);
        const m = memo.get(tabId);
        if (!m) return { state: { pending: rest } };
        const cards = [
          ...m.data.slides,
          ...m.data.rails.flatMap((r) => r.items.slice(0, 6)),
          ...m.data.rails.flatMap((r) => r.items.slice(6))
        ];
        const asked = await meta.fill(cards.map(metaAsk), 12e3);
        const made = slidesFrom(m.data.rails);
        if (made.length > m.data.slides.length) {
          m.data = { ...m.data, slides: made.map(({ logo: logo2, ...rest2 }) => rest2) };
          writeSnap(tabId, m.data);
        }
        const tries = (metaTries.get(tabId) || 0) + 1;
        metaTries.set(tabId, tries);
        if (asked > 0 && tries < MAX_META_TICKS && cards.some((c) => !meta.asked(c.id))) {
          return { state: { pending: [next, ...rest] } };
        }
        return { state: { pending: rest } };
      }
      try {
        const ok = await load(next);
        if (!ok) failLoad(next, rest, failed);
        else delete failed[next];
        if (ok && meta.usable()) rest.unshift("meta:" + next);
      } catch (e) {
        log2("browse tab error", e && e.message || "error");
        failLoad(next, rest, failed);
      }
      return { state: { pending: rest, failed } };
    },
    openSearch() {
      return { route: { push: "search" }, state: { sq: "", sstate: null } };
    },
    search({ value, route }) {
      const q = value && typeof value.q === "string" ? value.q.trim().slice(0, 100) : "";
      if (q === "") return null;
      const state = { sq: q, sstate: "loading" };
      return route && route.name === "search" ? { state } : { route: { push: "search" }, state };
    },
    async stick({ state }) {
      const q = typeof state.sq === "string" ? state.sq : "";
      if (q === "" || state.sstate !== "loading") return null;
      try {
        const out = await searchTitles(q);
        found = { q, items: (Array.isArray(out) ? out : []).slice(0, 60).map(cardOf) };
        rememberFound(found.items);
        return { state: { sstate: "done" } };
      } catch (e) {
        log2("browse search error", e && e.message || "error");
        return { state: { sstate: "fail" } };
      }
    },
    sretry({ state }) {
      return typeof state.sq === "string" && state.sq !== "" ? { state: { sstate: "loading" } } : null;
    },
    go({ arg }) {
      return arg === "settings" ? { route: { push: "settings" }, state: { fromBrowse: true } } : null;
    },
    back({ state, route }) {
      if (route && route.name === "settings" && !state.fromBrowse) return { close: true };
      return { route: { pop: true }, state: { sq: null, sstate: null } };
    }
  };
  async function event(ev) {
    const handler = Object.hasOwn(events, ev.name) ? events[ev.name] : null;
    return handler ? await handler({ ...ev, state: ev.state || {} }) ?? null : null;
  }
  return { view, event, notePlayed };
}

// src/devoracine.js
var BASE_URL = "https://devoracine.com";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  Referer: `${BASE_URL}/`,
  "Accept-Language": "es-ES,es;q=0.9"
};
async function fetchHtml(url, options = {}) {
  if (typeof kino === "undefined" || typeof kino.fetch !== "function")
    throw Error("Kino fetch no disponible");
  const r = await kino.fetch(url, {
    ...options,
    headers: { ...HEADERS, ...options.headers || {} }
  });
  if (!r.ok) throw Error(`HTTP ${r.status} al solicitar ${url}`);
  return r.text();
}
var strip = (x) => String(x || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8211;/g, "\u2013").replace(/\s+/g, " ").trim();
function slugToTitle(slug) {
  let s = slug.replace(/\/+$/, "").replace(/-(serie|la-pelicula|pelicula|movie|film)$/i, "").replace(/-(\d{4})$/, " ($1)").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(
    /\b(De|Del|La|El|Los|Las|Un|Una|En|Y|A|Al|Con|Por|Para|Sin|Que|Su|Se)\b/g,
    (w) => w.toLowerCase()
  ).replace(/^./, (c) => c.toUpperCase());
  s = s.replace(/\bSpider Man\b/g, "Spider-Man");
  s = s.replace(/\bX Men\b/g, "X-Men");
  s = s.replace(/\bAnt Man\b/g, "Ant-Man");
  s = s.replace(/\bIron Man\b/g, "Iron Man");
  return s;
}
var SKIP_SLUGS = /^(wp-|category|tag|author|feed|contacto|politica|terminos|privacy|cookie|page\/)/;
function parseCards(html, kind = "movie") {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const re = /<a\b[^>]*href=["'](https:\/\/devoracine\.com\/([^"'#?]+)\/?)\s*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while (m = re.exec(html)) {
    const ref = m[1];
    const rawSlug = m[2].replace(/\/+$/, "");
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
    const inner = m[3];
    if (!slug || seen.has(slug) || SKIP_SLUGS.test(slug)) continue;
    const imgMatch = inner.match(/<img\b[^>]*src=["']([^"']+)/i);
    if (!imgMatch) continue;
    seen.add(slug);
    const altAttr = (inner.match(/<img\b[^>]*\balt=["']([^"']+)/i) || [])[1];
    const titleAttr = (inner.match(/<img\b[^>]*\btitle=["']([^"']+)/i) || [])[1];
    const rawTitle = strip(altAttr || titleAttr || "");
    const title = rawTitle.length > 2 ? rawTitle : slugToTitle(rawSlug);
    const poster = imgMatch[1];
    out.push({
      id: slug,
      ref,
      title,
      kind,
      type: kind,
      poster,
      art: poster,
      overview: void 0
    });
  }
  return out;
}
function parseHeroSlides(html) {
  return parseCards(html).slice(0, 6);
}
async function catalog(path = "", kind = "movie") {
  return parseCards(await fetchHtml(`${BASE_URL}${path}`), kind);
}
async function details(ref, kinoApi) {
  const html = await fetchHtml(ref);
  const rawH1 = strip(
    (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]
  );
  const rawMeta = strip(
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
  );
  const rawTitle = rawH1 || rawMeta;
  const title = rawTitle.replace(/\s*[|–-]\s*(?:Ver )?(?:Película|Serie|Peliculas|Series|Devoracine|DevoraCine).*$/i, "").trim();
  const overview = strip(
    (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description/i) || [])[1]
  );
  const poster = (html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)/i) || [])[1] || "";
  let base = {
    title,
    overview,
    description: overview,
    poster,
    art: poster,
    backdrop: poster,
    kind: "movie",
    type: "movie",
    ref
  };
  try {
    if (kinoApi?.meta?.byTitle) {
      const m = await kinoApi.meta({ title, kind: "movie" });
      if (m) base = { ...base, ...m, ids: m.ids || base.ids };
    }
  } catch (_) {
  }
  return base;
}
async function resolveDevora(ref) {
  const html = await fetchHtml(ref);
  const src = (html.match(/<iframe[^>]+src=["']([^"']+)/i) || [])[1] || "";
  if (!src) throw Error("No se encontr\xF3 reproductor en esta ficha");
  const decoded = src.replace(/&amp;/g, "&");
  if (/\.m3u8(?:[?"']|$)/i.test(decoded))
    return {
      url: decoded,
      mime: "application/x-mpegURL",
      headers: {
        Referer: BASE_URL + "/",
        "User-Agent": HEADERS["User-Agent"]
      }
    };
  throw Error(
    `El reproductor externo no expuso una fuente HLS directa: ${new URL(decoded).hostname}`
  );
}

// src/plugin.js
var VERSION = "1.2.0";
var PREFIX = `[DevoraCine v${VERSION}]`;
console.log(`${PREFIX} Creado por JuandreXter`);
var log = (...a) => console.log(PREFIX, ...a);
var logError = (...a) => console.error(PREFIX, ...a);
var browseApp = null;
function app() {
  if (!browseApp) {
    browseApp = makeBrowse({
      kino: typeof kino !== "undefined" ? kino : null,
      loadTab: async (tab) => {
        log(`loadTab("${tab}"): cargando contenido declarativo...`);
        if (tab === "inicio") {
          const rows = await home();
          return { rows };
        }
        const r = await browse(tab, "1");
        const label = tab === "peliculas" ? "Pel\xEDculas en DevoraCine" : tab === "series" ? "Series en DevoraCine" : "Contenido destacado";
        return { rows: [{ id: tab, title: label, ref: tab, items: r.items }] };
      },
      searchTitles: async (q) => {
        log(`searchTitles("${q}")`);
        const r = await search({ q });
        return Array.isArray(r) ? r : r.items || [];
      }
    });
  }
  return browseApp;
}
async function search(arg) {
  const q = typeof arg === "string" ? arg : arg?.q || arg?.query || "";
  if (!q.trim()) return { items: [] };
  log(`search(q="${q}")`);
  const items = parseCards(
    await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(q.trim())}`)
  );
  log(`search(): ${items.length} resultados`);
  return { items };
}
async function home() {
  log("home(): cargando carrusel y rieles...");
  const html = await fetchHtml(BASE_URL + "/");
  const all = parseCards(html);
  const hero2 = parseHeroSlides(html);
  const rows = [
    { id: "featured", title: "Destacados", ref: "inicio", items: hero2 },
    { id: "latest", title: "\xDAltimos estrenos", ref: "peliculas", items: all.slice(0, 24) },
    { id: "more", title: "M\xE1s para ver", ref: "peliculas", items: all.slice(24, 48) }
  ].filter((r) => r.items.length);
  log(`home(): ${rows.length} rieles cargados`);
  return rows;
}
async function browse(ref = "peliculas", cursor = "1") {
  const paths = { inicio: "/", peliculas: "/peliculas/", series: "/series/", animacion: "/" };
  const page = Number(cursor) || 1;
  const base = paths[ref] || "/";
  const path = page > 1 ? `${base.replace(/\/$/, "")}/page/${page}/` : base;
  log(`browse(ref="${ref}", cursor="${cursor}", page=${page})`);
  const items = await catalog(path, ref === "series" ? "series" : "movie");
  log(`browse("${ref}"): p\xE1gina ${page} carg\xF3 ${items.length} items`);
  return { items, next: items.length >= 12 ? String(page + 1) : void 0 };
}
async function episodes(ref) {
  log(`episodes(ref="${ref}")`);
  const d = await details(ref, typeof kino !== "undefined" ? kino : null);
  return { series: { title: d.title, ref }, episodes: [] };
}
async function details2(ref) {
  log(`details(ref="${ref}")`);
  return details(ref, typeof kino !== "undefined" ? kino : null);
}
async function resolve(ref) {
  log(`resolve(ref="${ref}"): buscando reproductor...`);
  try {
    const s = await resolveDevora(ref);
    log(`resolve(): stream obtenido: ${s.url}`);
    return s;
  } catch (e) {
    logError(`resolve() fall\xF3: ${e.message}`);
    throw e;
  }
}
async function screen(ctx) {
  log("screen(): generando interfaz declarativa");
  return app().view(ctx || {});
}
async function screenEvent(ev) {
  const parsed = typeof ev === "string" ? JSON.parse(ev) : ev;
  log(`screenEvent(ev="${parsed?.name}"): despachando evento`);
  return app().event(parsed || {});
}
export {
  browse,
  details2 as details,
  episodes,
  home,
  resolve,
  screen,
  screenEvent,
  search
};
