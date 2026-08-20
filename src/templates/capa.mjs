import { rich, brand } from '../shell.mjs';

export const css = `
  h1{font-size:5.1rem}
    .lede{font-size:1.7rem;max-width:24ch}
`;

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="slide">
    ${s.kicker ? `<div class="eyebrow">${rich(s.kicker)}</div>` : ''}
    <div class="center">
      <h1>${rich(s.title)}</h1>
      ${s.lede ? `<p class="lede">${rich(s.lede)}</p>` : ''}
    </div>
    ${brand(n, total, { swipe: true })}
  </div>`;
