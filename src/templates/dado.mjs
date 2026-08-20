import { rich, brand } from '../shell.mjs';

export const css = `
    .val{font-size:9.6rem;font-weight:800;letter-spacing:-.05em;line-height:.9;
       display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}
  .val .unit{font-style:normal;font-family:var(--mono);font-size:2.5rem;
             color:var(--muted);letter-spacing:-.02em}
  .cap{font-size:1.85rem;color:var(--muted);margin-top:38px;line-height:1.35;max-width:38ch}
  .delta{display:inline-flex;align-self:flex-start;align-items:center;gap:12px;margin-top:34px;
    font-family:var(--mono);font-size:1.15rem;letter-spacing:.06em;
    border:1px solid var(--line2);border-radius:99px;padding:12px 22px;background:var(--surface)}
  .delta i{width:9px;height:9px;border-radius:50%;background:var(--amber);font-style:normal}
`;

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow glow-c"></div>
  <div class="slide">
    ${s.kicker ? `<div class="eyebrow">${rich(s.kicker)}</div>` : ''}
    <div class="center">
      <div class="val"><span class="grad">${rich(s.value)}</span>${
        s.unit ? `<em class="unit">${rich(s.unit)}</em>` : ''}</div>
      ${s.caption ? `<p class="cap">${rich(s.caption)}</p>` : ''}
      ${s.delta ? `<div class="delta"><i></i>${rich(s.delta)}</div>` : ''}
    </div>
    ${brand(n, total)}
  </div>`;
