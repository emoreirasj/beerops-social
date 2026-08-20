import { rich, brand } from '../shell.mjs';

/* Moldura de browser copiada do .shot do index.astro — a tela do produto
   precisa parecer a mesma coisa que o visitante vê na landing. */
export const css = `
  h2{font-size:2.9rem;margin-top:24px}
  .shot{background:var(--surface);border:1px solid var(--line2);
    border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.55)}
  .shot-bar{display:flex;align-items:center;gap:9px;padding:16px 20px;
    border-bottom:1px solid var(--line);background:var(--bg2)}
  .shot-bar .d{width:11px;height:11px;border-radius:50%;background:var(--line2)}
  .shot-bar .url{font-family:var(--mono);color:var(--dim);font-size:.95rem;margin-left:12px}
  .shot img{display:block;width:100%}
  .note{margin-top:34px;font-size:1.45rem;color:var(--muted);line-height:1.4}
`;

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="slide">
    ${s.kicker ? `<div class="eyebrow">${rich(s.kicker)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <div class="center">
    <div class="shot">
      <div class="shot-bar">
        <i class="d"></i><i class="d"></i><i class="d"></i>
        <span class="url">${rich(s.url || 'app.beerops.com.br')}</span>
      </div>
      <img src="${s._src}" alt="" />
    </div>
    ${s.note ? `<p class="note">${rich(s.note)}</p>` : ''}
    </div>
    ${brand(n, total)}
  </div>`;
