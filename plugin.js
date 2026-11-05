// src/devoracine.js
var BASE_URL = "https://devoracine.com";
var HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", Referer: `${BASE_URL}/`, "Accept-Language": "es-ES,es;q=0.9" };
async function fetchHtml(url, options = {}) {
  const f = typeof kino !== "undefined" && kino.fetch ? kino.fetch.bind(kino) : fetch;
  const r = await f(url, { ...options, headers: { ...HEADERS, ...options.headers || {} } });
  if (!r.ok) throw Error(`HTTP ${r.status} al solicitar ${url}`);
  return r.text();
}
var text = (x) => String(x || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
var clean = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
function parseCards(html, kind = "movie") {
  const out = [], seen = /* @__PURE__ */ new Set();
  const re = /<a\b[^>]*href=["'](https:\/\/devoracine\.com\/([^"'#?]+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while (m = re.exec(html)) {
    const ref = m[1], slug = clean(m[2]), inner = m[3];
    if (!slug || seen.has(slug) || /^(wp-|category|tag|author|feed|contacto|politica|terminos)/.test(slug)) continue;
    const img = (inner.match(/<img\b[^>]*src=["']([^"']+)/i) || [])[1];
    if (!img) continue;
    seen.add(slug);
    let title = (inner.match(/(?:title|alt)=["']([^"']+)/i) || [])[1] || m[2].replace(/-/g, " ");
    title = text(title).replace(/\s*[-–|].*$/, "");
    out.push({ id: slug, ref, title, kind, type: kind, poster: img, art: img, overview: void 0 });
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
  const rawTitle = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]) || text((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  const title = rawTitle.replace(/\s*[|–-]\s*(?:Ver )?(?:Película|Serie|Peliculas|Series).*$/i, "").trim();
  const overview = text((html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description/i) || [])[1]);
  const poster = (html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)/i) || [])[1] || "";
  let base = { title, overview, description: overview, poster, art: poster, backdrop: poster, kind: "movie", type: "movie", ref };
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
  if (/\.m3u8(?:[?"']|$)/i.test(decoded)) return { url: decoded, mime: "application/x-mpegURL", headers: { Referer: BASE_URL + "/", "User-Agent": HEADERS["User-Agent"] } };
  throw Error(`El reproductor externo no expuso una fuente HLS directa: ${new URL(decoded).hostname}`);
}

// src/plugin.js
var VERSION = "1.0.0";
var PREFIX = `[DevoraCine v${VERSION}]`;
console.log(`${PREFIX} Creado por JuandreXter`);
var log = (m) => console.log(`${PREFIX} ${m}`);
async function search(arg) {
  const q = typeof arg === "string" ? arg : arg?.query || arg?.q || "";
  log(`search(q="${q}")`);
  if (!q.trim()) return [];
  const x = parseCards(await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(q)}`));
  log(`search(): ${x.length} resultados`);
  return x;
}
async function home() {
  log("home(): cargando cat\xE1logo");
  const html = await fetchHtml(BASE_URL + "/");
  const all = parseCards(html);
  return { hero: parseHeroSlides(html), rails: [{ title: "Destacados", items: all.slice(0, 20) }, { title: "M\xE1s para ver", items: all.slice(20, 40) }] };
}
async function browse(ref = "inicio", cursor = "1") {
  const paths = { inicio: "/", peliculas: "/peliculas/", series: "/series/" };
  const kind = ref === "series" ? "series" : "movie";
  const page = Number(cursor) || 1;
  const base = paths[ref] || "/";
  const path = page > 1 ? `${base.replace(/\/$/, "")}/page/${page}/` : base;
  const items = await catalog(path, kind);
  return { items, next: items.length >= 12 ? String(page + 1) : void 0 };
}
async function episodes(ref) {
  const d = await details(ref, typeof kino !== "undefined" ? kino : null);
  return { series: { title: d.title, ref }, episodes: [] };
}
async function details2(ref) {
  log(`details(ref="${ref}")`);
  return details(ref, typeof kino !== "undefined" ? kino : null);
}
async function resolve(ref) {
  log(`resolve(ref="${ref}"): buscando reproductor`);
  const s = await resolveDevora(ref);
  log(`resolve(): HLS ${s.url}`);
  return s;
}
export {
  browse,
  details2 as details,
  episodes,
  home,
  resolve,
  search
};
