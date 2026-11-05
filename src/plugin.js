import {fetchHtml,parseCards,parseHeroSlides,catalog,details as getDetails,resolveDevora,BASE_URL} from './devoracine.js';
const VERSION='1.0.0', PREFIX=`[DevoraCine v${VERSION}]`;
console.log(`${PREFIX} Creado por JuandreXter`);
const log=m=>console.log(`${PREFIX} ${m}`);
export async function search(arg){const q=typeof arg==='string'?arg:(arg?.query||arg?.q||'');log(`search(q="${q}")`);if(!q.trim())return [];const x=parseCards(await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(q)}`));log(`search(): ${x.length} resultados`);return x}
export async function home(){log('home(): cargando catálogo');const html=await fetchHtml(BASE_URL+'/');const all=parseCards(html);return {hero:parseHeroSlides(html),rails:[{title:'Destacados',items:all.slice(0,20)},{title:'Más para ver',items:all.slice(20,40)}]}}
export async function browse(ref='inicio',cursor='1'){const paths={inicio:'/',peliculas:'/peliculas/',series:'/series/'};const kind=ref==='series'?'series':'movie';const page=Number(cursor)||1;const base=paths[ref]||'/';const path=page>1?`${base.replace(/\/$/,'')}/page/${page}/`:base;const items=await catalog(path,kind);return {items,next:items.length>=12?String(page+1):undefined}}
export async function episodes(ref){const d=await getDetails(ref,typeof kino!=='undefined'?kino:null);return {series:{title:d.title,ref},episodes:[]}}
export async function details(ref){log(`details(ref="${ref}")`);return getDetails(ref,typeof kino!=='undefined'?kino:null)}
export async function resolve(ref){log(`resolve(ref="${ref}"): buscando reproductor`);const s=await resolveDevora(ref);log(`resolve(): HLS ${s.url}`);return s}
