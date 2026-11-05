// Plugin oficial de DevoraCine para Kino (v1.1.0)
import { makeBrowse } from "./browse/index.js";
import {
  fetchHtml, parseCards, parseHeroSlides, catalog,
  details as getDetails, resolveDevora, BASE_URL,
} from "./devoracine.js";

const VERSION = "1.1.0";
const PREFIX = `[DevoraCine v${VERSION}]`;
console.log(`${PREFIX} Creado por JuandreXter`);

const log = (...a) => console.log(PREFIX, ...a);
const logError = (...a) => console.error(PREFIX, ...a);

/* ── browse app (screen declarativo) ── */
let browseApp = null;
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
        const label =
          tab === "peliculas" ? "Películas en DevoraCine"
          : tab === "series" ? "Series en DevoraCine"
          : "Contenido destacado";
        return { rows: [{ id: tab, title: label, ref: tab, items: r.items }] };
      },
      searchTitles: async (q) => {
        log(`searchTitles("${q}")`);
        const r = await search({ q });
        return Array.isArray(r) ? r : r.items || [];
      },
    });
  }
  return browseApp;
}

/* ── search ── */
export async function search(arg) {
  const q = typeof arg === "string" ? arg : (arg?.q || arg?.query || "");
  if (!q.trim()) return { items: [] };
  log(`search(q="${q}")`);
  const items = parseCards(
    await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(q.trim())}`)
  );
  log(`search(): ${items.length} resultados`);
  return { items };
}

/* ── home ── */
export async function home() {
  log("home(): cargando carrusel y rieles...");
  const html = await fetchHtml(BASE_URL + "/");
  const all = parseCards(html);
  const hero = parseHeroSlides(html);
  const rows = [
    { id: "featured", title: "Destacados", ref: "inicio", items: hero },
    { id: "latest", title: "Últimos estrenos", ref: "peliculas", items: all.slice(0, 24) },
    { id: "more", title: "Más para ver", ref: "peliculas", items: all.slice(24, 48) },
  ].filter((r) => r.items.length);
  log(`home(): ${rows.length} rieles cargados`);
  return rows;
}

/* ── browse ── */
export async function browse(ref = "peliculas", cursor = "1") {
  const paths = { inicio: "/", peliculas: "/peliculas/", series: "/series/", animacion: "/" };
  const page = Number(cursor) || 1;
  const base = paths[ref] || "/";
  const path = page > 1 ? `${base.replace(/\/$/, "")}/page/${page}/` : base;
  log(`browse(ref="${ref}", cursor="${cursor}", page=${page})`);
  const items = await catalog(path, ref === "series" ? "series" : "movie");
  log(`browse("${ref}"): página ${page} cargó ${items.length} items`);
  return { items, next: items.length >= 12 ? String(page + 1) : undefined };
}

/* ── episodes ── */
export async function episodes(ref) {
  log(`episodes(ref="${ref}")`);
  const d = await getDetails(ref, typeof kino !== "undefined" ? kino : null);
  return { series: { title: d.title, ref }, episodes: [] };
}

/* ── details ── */
export async function details(ref) {
  log(`details(ref="${ref}")`);
  return getDetails(ref, typeof kino !== "undefined" ? kino : null);
}

/* ── resolve ── */
export async function resolve(ref) {
  log(`resolve(ref="${ref}"): buscando reproductor...`);
  try {
    const s = await resolveDevora(ref);
    log(`resolve(): stream obtenido: ${s.url}`);
    return s;
  } catch (e) {
    logError(`resolve() falló: ${e.message}`);
    throw e;
  }
}

/* ── screen (UI declarativa nativa) ── */
export async function screen(ctx) {
  log("screen(): generando interfaz declarativa");
  return app().view(ctx || {});
}

export async function screenEvent(ev) {
  const parsed = typeof ev === "string" ? JSON.parse(ev) : ev;
  log(`screenEvent(ev="${parsed?.name}"): despachando evento`);
  return app().event(parsed || {});
}
