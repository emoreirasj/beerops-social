#!/usr/bin/env node
/**
 * shots.mjs — captura as telas do produto direto do /demo  ->  assets/shots/*.png
 *
 *   npm run shots                       # captura de config.json -> demoUrl
 *   npm run shots -- http://localhost:4321/demo
 *
 * Por que o /demo e nao o app real: o /demo e um clone estatico, read-only e sem
 * login da UI de producao. Nao tem dado de cliente nenhum, entao nada do que sai
 * daqui e risco de LGPD — e nao precisa subir docker nem token pra rodar.
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8'));
const url = process.argv[2] || CONFIG.demoUrl;
const OUT = join(ROOT, 'assets', 'shots');

const VW = 1440;
const VH = 980;

/* As views do /demo, pelo data-view dos botoes da sidebar. `after` roda depois
   de trocar de view — usado pra abrir a subview do relatorio do lote AIP-05,
   que e o unico lote navegavel no demo (os outros disparam toast de cadeado). */
const TELAS = [
  { id: 'v-mp',    file: 'materia-prima.png', vw: 1180 },
  { id: 'v-adega', file: 'adega.png', vw: 1180 },
  { id: 'v-prod',  file: 'producao.png', vw: 1180 },
  {
    id: 'v-prod',
    file: 'relatorio-aip05.png',
    vw: 1180,
    after: async (page) => {
      await page.click('#v-prod tr:has(td:text-is("AIP-05")) button.link');
      await page.waitForSelector('#sv-report.on', { timeout: 5000 });
      await page.waitForTimeout(500);
    },
  },
  { id: 'v-ia',    file: 'relatorios-ia.png', vw: 1180 },
];

/** Altura real do conteudo. Sem isso, telas curtas (a lista de lotes, por
 *  exemplo) saem com metade da imagem em branco e a moldura do slide fica com
 *  um vazio enorme embaixo. */
async function alturaConteudo(page) {
  return page.evaluate(() => {
    const main = document.querySelector('#main');
    if (!main) return null;
    let base = 0;
    for (const el of main.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      // ignora o botao flutuante do assistente, que fica colado no rodape
      if (r.width > 0 && r.height > 0 && r.width < window.innerWidth) {
        base = Math.max(base, r.bottom);
      }
    }
    // a sidebar e mais alta que o conteudo em telas curtas; cortar no meio de
    // um item de menu parece bug de renderizacao, entao ela entra na medida
    const nav = main.ownerDocument.querySelectorAll('#side .nitem');
    if (nav.length) base = Math.max(base, nav[nav.length - 1].getBoundingClientRect().bottom);
    return base;
  });
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 2, // 2x pra imagem nao borrar ao ser reduzida dentro do slide
});

console.log(`fonte: ${url}\n`);
await page.goto(url, { waitUntil: 'networkidle' });

for (const tela of TELAS) {
  const vw = tela.vw || VW;
  await page.setViewportSize({ width: vw, height: VH });
  await page.click(`.nitem[data-view="${tela.id}"]`);
  // 400ms nao bastava: a troca de view tem fade-in e a captura saia esmaecida
  await page.waitForTimeout(1200);
  if (tela.after) await tela.after(page);

  const fundo = await alturaConteudo(page);
  const height = Math.round(Math.min(VH, Math.max(460, (fundo || VH) + 40)));

  await page.screenshot({
    path: join(OUT, tela.file),
    clip: { x: 0, y: 0, width: vw, height },
  });
  console.log(`  ${tela.file}  ${vw}x${height} css`);
}

await browser.close();
console.log(`\n${TELAS.length} telas em assets/shots/\n`);
