import { rich, brand } from '../shell.mjs';

export const css = `
  h2{margin-top:26px}
  .bul{list-style:none;margin:44px 0 0;flex:1;display:flex;flex-direction:column;
    justify-content:space-evenly;gap:30px}
  .bul li{font-size:1.8rem;line-height:1.35;padding-left:52px;position:relative}
  .bul li::before{content:'';position:absolute;left:0;top:.6em;width:28px;height:3px;
    border-radius:2px;background:linear-gradient(90deg,var(--amber),var(--copper))}
  .bul .note{display:block;font-size:1.35rem;color:var(--muted);margin-top:10px;
    line-height:1.4;max-width:46ch}
`;

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="slide">
    ${s.kicker ? `<div class="eyebrow">${rich(s.kicker)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <ul class="bul">
      ${(s.items || []).map((it) => {
        const item = typeof it === 'string' ? { text: it } : it;
        return `<li>${rich(item.text)}${item.note ? `<span class="note">${rich(item.note)}</span>` : ''}</li>`;
      }).join('\n      ')}
    </ul>
    ${brand(n, total)}
  </div>`;
