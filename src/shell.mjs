import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TOKENS = readFileSync(join(here, 'tokens.css'), 'utf8');

export const W = 1080;
export const H = 1350;

/** Escapa texto vindo do post.json — o conteúdo é nosso, mas um `&` solto
 *  no meio de uma legenda não pode quebrar o HTML do slide. */
export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Permite marcação mínima no post.json sem abrir a porta pra HTML arbitrário:
 *    *palavra*  -> destaque em âmbar
 *    **frase**  -> gradiente âmbar->cobre
 *    |          -> quebra de linha */
export const rich = (s = '') =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<span class="grad">$1</span>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:normal;color:var(--amber)">$1</em>')
    .replace(/\|/g, '<br />');

/** Rodapé de marca. `n` e `total` desenham o contador "03 / 07".
 *  swipe: troca o contador pelo "arraste" (capa).
 *  semLogo: omite o wordmark — usado no CTA, que já traz o logo grande. */
export const brand = (n, total, { swipe = false, semLogo = false } = {}) => `
  <div class="brand">
    ${semLogo ? '' : '<span class="logo">Beer<em>Ops</em></span>'}
    ${swipe
      ? '<span class="swipe">ARRASTE &rarr;</span>'
      : `<span class="n">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>`}
  </div>`;

/** Monta a página completa de um slide. `accent` troca a paleta de acento
 *  (amber padrão, hop para ganho, red para perda) sem sair do design system. */
export function page(bodyHtml, { accent = '', extraCss = '' } = {}) {
  const accentClass = accent ? ` a-${accent}` : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
${TOKENS}
${extraCss}
</style>
</head>
<body class="${accentClass.trim()}">
${bodyHtml}
</body>
</html>`;
}
