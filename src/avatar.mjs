#!/usr/bin/env node
/**
 * avatar.mjs — foto de perfil do Instagram  ->  assets/brand/avatar.jpg
 *
 *   npm run avatar
 *
 * 1080x1080. O Instagram recorta em circulo e exibe pequeno (~150px no header
 * do perfil, ~40px em comentario), entao o wordmark vai EMPILHADO em duas
 * linhas — "BeerOps" em linha unica vira um borrao nesse tamanho.
 *
 * Mesmos tokens da landing, via tokens.css.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = readFileSync(join(ROOT, 'src', 'tokens.css'), 'utf8');
const S = 1080;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><style>
${TOKENS}
body{width:${S}px;height:${S}px;display:flex;align-items:center;justify-content:center}
.grid{background-size:90px 90px;opacity:.34}
.glow{width:1300px;height:1300px;right:-380px;top:-460px}
/* anel interno: sem ele a arte encosta na borda do recorte circular */
.ring{position:absolute;inset:54px;border-radius:50%;
      border:3px solid rgba(240,163,43,.28)}
.mark{position:relative;text-align:center;line-height:.86;letter-spacing:-.05em;
      font-weight:900;font-size:15.5rem}
.mark .a{display:block;color:var(--text)}
.mark .b{display:block;background:linear-gradient(100deg,var(--amber) 15%,var(--copper) 90%);
         -webkit-background-clip:text;background-clip:text;color:transparent}
</style></head><body>
  <div class="grid"></div><div class="glow"></div><div class="ring"></div>
  <div class="mark"><span class="a">Beer</span><span class="b">Ops</span></div>
</body></html>`;

const tmpDir = join(ROOT, '.tmp');
mkdirSync(tmpDir, { recursive: true });
const tmp = join(tmpDir, 'avatar.html');
writeFileSync(tmp, html, 'utf8');

const outDir = join(ROOT, 'assets', 'brand');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'avatar.jpg');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: S, height: S }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
await page.screenshot({ path: out, type: 'jpeg', quality: 94 });
await browser.close();
rmSync(tmpDir, { recursive: true, force: true });

console.log(`avatar ${S}x${S} -> assets/brand/avatar.jpg`);
