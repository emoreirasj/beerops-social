import { rich, brand } from '../shell.mjs';

export const css = `
  h2{font-size:2.9rem;margin-top:24px}
  .cols{margin-top:46px;display:grid;grid-template-columns:1fr 1fr;gap:22px;flex:1}
  .col{border:1px solid var(--line);border-radius:16px;padding:30px 26px;
    background:var(--surface);display:flex;flex-direction:column}
  .col .ch{display:block;font-family:var(--mono);font-size:1rem;letter-spacing:.14em;
    text-transform:uppercase;padding-bottom:20px;margin-bottom:24px;border-bottom:1px solid var(--line)}
  /* grid com linhas de altura igual nos dois cards: e o que mantem o item N
     da esquerda na mesma linha do item N da direita. Com space-evenly em cada
     coluna separadamente o par desalinha assim que um lado quebra em 2 linhas. */
  .col ul{list-style:none;flex:1;display:grid;grid-auto-rows:1fr;align-items:center}
  .col li{font-size:1.35rem;line-height:1.35;color:var(--muted);padding-left:34px;position:relative}
  .col li::before{position:absolute;left:0;top:-.04em;font-family:var(--mono);font-size:1.3rem}

  .col.bad{border-color:rgba(224,106,90,.28)}
  .col.bad .ch{color:var(--red)}
  .col.bad li::before{content:'×';color:var(--red)}

  .col.good{border-color:rgba(240,163,43,.3);background:var(--surface2)}
  .col.good .ch{color:var(--amber)}
  .col.good li{color:var(--text)}
  .col.good li::before{content:'✓';color:var(--hop)}
`;

const list = (items = []) => items.map((t) => `<li>${rich(t)}</li>`).join('\n        ');

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow glow-bl"></div>
  <div class="slide">
    ${s.kicker ? `<div class="eyebrow">${rich(s.kicker)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <div class="cols">
      <div class="col bad">
        <span class="ch">${rich(s.leftLabel || 'Planilha')}</span>
        <ul>${list(s.left)}</ul>
      </div>
      <div class="col good">
        <span class="ch">${rich(s.rightLabel || 'BeerOps')}</span>
        <ul>${list(s.right)}</ul>
      </div>
    </div>
    ${brand(n, total)}
  </div>`;
