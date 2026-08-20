#!/usr/bin/env node
/**
 * render.mjs — post.json  ->  PNGs 1080x1350 + caption.txt + feed.json
 *
 *   npm run render -- 2026-08-25-custo-por-litro
 *   npm run render:all
 *
 * Fonte:  posts/<slug>/post.json
 * Saida:  public/<slug>/01.png ...   (artefato de deploy do Cloudflare Pages)
 *         posts/<slug>/caption.txt   (legenda pronta pra conferencia humana)
 *         public/feed.json           (fila que o cenario do Make consome)
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page as shellPage, W, H } from './shell.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8'));

/* --- limites reais das plataformas, nao preferencias nossas --------------- */
const MAX_SLIDES = 10;      // a API de carrossel da Meta publica no maximo 10
const MAX_CAPTION = 2200;   // limite de legenda do Instagram
const MAX_HASHTAGS = 30;    // limite de hashtags por post

/* --- lint de copy: ver memoria feedback_copy_sem_promessa_absoluta -------- */
const PROMESSAS_PROIBIDAS = [
  'ilimitado', 'ilimitada', 'ilimitados', 'ilimitadas',
  'sem limite', 'sem limites',
  'garantido', 'garantia total',
  '100%', 'zero erro', 'zero erros',
  'nunca mais', 'sempre certo', 'infinito',
];

const TIPOS = ['capa', 'texto', 'dado', 'shot', 'antes-depois', 'citacao', 'cta'];
const templates = Object.fromEntries(
  await Promise.all(TIPOS.map(async (t) => [t, await import(`./templates/${t}.mjs`)])),
);

/* ------------------------------------------------------------------ utils */
const pad2 = (n) => String(n).padStart(2, '0');

/** Junta todo texto do post pra passar o lint de copy nele. */
function coletaTexto(node, acc = []) {
  if (typeof node === 'string') acc.push(node);
  else if (Array.isArray(node)) node.forEach((v) => coletaTexto(v, acc));
  else if (node && typeof node === 'object') Object.values(node).forEach((v) => coletaTexto(v, acc));
  return acc;
}

const montaLegenda = (post) =>
  [post.caption ? post.caption.trim() : '', (post.hashtags || []).join(' ')]
    .filter(Boolean)
    .join('\n\n.\n.\n.\n');

function valida(post, slug) {
  const erros = [];
  const slides = post.slides || [];

  if (!slides.length) erros.push('post sem slides');
  if (slides.length > MAX_SLIDES) {
    erros.push(`${slides.length} slides — a API de carrossel da Meta publica no maximo ${MAX_SLIDES}`);
  }

  slides.forEach((s, i) => {
    if (!TIPOS.includes(s.type)) {
      erros.push(`slide ${i + 1}: tipo "${s.type}" nao existe (use: ${TIPOS.join(', ')})`);
      return;
    }
    if (s.type === 'shot') {
      if (!s.image) erros.push(`slide ${i + 1}: type "shot" exige "image"`);
      else if (!existsSync(join(ROOT, 'assets', 'shots', s.image))) {
        erros.push(`slide ${i + 1}: assets/shots/${s.image} nao existe — rode "npm run shots"`);
      }
    }
    if (s.type === 'antes-depois' && (s.left || []).length !== (s.right || []).length) {
      erros.push(`slide ${i + 1}: "left" tem ${(s.left || []).length} itens e "right" tem ${(s.right || []).length} — o comparativo so alinha par a par com listas do mesmo tamanho`);
    }
    if (s.type === 'dado' && String(s.value || '').length > 9) {
      erros.push(`slide ${i + 1}: value "${s.value}" tem ${String(s.value).length} caracteres e vaza da margem (max 9)`);
    }
    if (!s.alt) erros.push(`slide ${i + 1}: falta "alt" (texto alternativo de acessibilidade)`);
  });

  const tags = post.hashtags || [];
  if (tags.length > MAX_HASHTAGS) erros.push(`${tags.length} hashtags — o limite do Instagram e ${MAX_HASHTAGS}`);

  const legenda = montaLegenda(post);
  if (legenda.length > MAX_CAPTION) {
    erros.push(`legenda com ${legenda.length} caracteres — o limite do Instagram e ${MAX_CAPTION}`);
  }

  const texto = coletaTexto(post).join(' \n ').toLowerCase();
  for (const termo of PROMESSAS_PROIBIDAS) {
    if (texto.includes(termo)) {
      erros.push(`copy: "${termo}" e promessa absoluta — trocar por dado verificavel (memoria feedback_copy_sem_promessa_absoluta)`);
    }
  }

  if (erros.length) {
    throw new Error(`\n[${slug}] ${erros.length} problema(s):\n  - ${erros.join('\n  - ')}\n`);
  }
}

/* ----------------------------------------------------------------- render */
async function renderPost(browser, slug) {
  const dirPost = join(ROOT, 'posts', slug);
  const post = JSON.parse(readFileSync(join(dirPost, 'post.json'), 'utf8'));
  valida(post, slug);

  const outDir = join(ROOT, 'public', slug);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const tmpDir = join(ROOT, '.tmp');
  mkdirSync(tmpDir, { recursive: true });

  const total = post.slides.length;
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });

  const arquivos = [];
  for (const [i, slide] of post.slides.entries()) {
    const n = i + 1;
    const tpl = templates[slide.type];

    // O <img> so carrega se a propria pagina vier de file:// — por isso
    // gravamos o HTML em disco em vez de usar page.setContent().
    if (slide.type === 'shot') {
      slide._src = pathToFileURL(join(ROOT, 'assets', 'shots', slide.image)).href;
    }

    const html = shellPage(tpl.default(slide, { n, total }), {
      accent: slide.accent,
      extraCss: tpl.css || '',
    });

    const tmp = join(tmpDir, `${slug}-${pad2(n)}.html`);
    writeFileSync(tmp, html, 'utf8');
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });

    const arquivo = `${pad2(n)}.png`;
    await page.screenshot({ path: join(outDir, arquivo), type: 'png' });
    arquivos.push(arquivo);
    process.stdout.write(`  ${pad2(n)}/${pad2(total)} ${slide.type}\n`);
  }

  await page.close();
  rmSync(tmpDir, { recursive: true, force: true });

  writeFileSync(join(dirPost, 'caption.txt'), montaLegenda(post) + '\n', 'utf8');
  return { post, arquivos };
}

/* ------------------------------------------------------------- feed.json  */
function montaFeed() {
  const base = CONFIG.baseUrl.replace(/\/$/, '');
  const slugs = readdirSync(join(ROOT, 'posts'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(ROOT, 'posts', d.name, 'post.json')))
    .map((d) => d.name)
    .sort();

  const posts = [];
  for (const slug of slugs) {
    const outDir = join(ROOT, 'public', slug);
    if (!existsSync(outDir)) continue;
    const post = JSON.parse(readFileSync(join(ROOT, 'posts', slug, 'post.json'), 'utf8'));
    const imagens = readdirSync(outDir).filter((f) => f.endsWith('.png')).sort();

    posts.push({
      id: slug,
      status: post.status || 'draft',       // draft | ready — o Make so publica "ready"
      scheduledAt: post.scheduledAt || null,
      caption: montaLegenda(post),
      images: imagens.map((f) => `${base}/${slug}/${f}`),
      altTexts: post.slides.map((s) => s.alt || ''),
    });
  }

  const feed = { generatedAt: new Date().toISOString(), baseUrl: base, posts };
  writeFileSync(join(ROOT, 'public', 'feed.json'), JSON.stringify(feed, null, 2) + '\n', 'utf8');
  return feed;
}

/* -------------------------------------------------------------------- cli */
const args = process.argv.slice(2);
const todos = args.includes('--all');
const alvos = todos
  ? readdirSync(join(ROOT, 'posts'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : args.filter((a) => !a.startsWith('--'));

if (!alvos.length) {
  console.error('uso: npm run render -- <slug>   |   npm run render:all');
  process.exit(1);
}

mkdirSync(join(ROOT, 'public'), { recursive: true });
const browser = await chromium.launch();
try {
  for (const slug of alvos) {
    console.log(`\n${slug}`);
    const { arquivos } = await renderPost(browser, slug);
    console.log(`  -> public/${slug}/ (${arquivos.length} imagens)`);
  }
} finally {
  await browser.close();
}
const feed = montaFeed();
const prontos = feed.posts.filter((p) => p.status === 'ready').length;
console.log(`\nfeed.json: ${feed.posts.length} post(s), ${prontos} marcado(s) como "ready"\n`);
