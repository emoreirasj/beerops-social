import { rich, brand } from '../shell.mjs';

export const css = `
    .mark{font-size:11rem;line-height:.6;font-weight:900;color:var(--amber);opacity:.28;
        letter-spacing:-.06em;margin-bottom:18px}
  blockquote{font-size:2.9rem;line-height:1.24;letter-spacing:-.02em;font-weight:600;
             text-wrap:balance}
  .attr{margin-top:46px;padding-top:26px;border-top:1px solid var(--line2);
        font-family:var(--mono);font-size:1.2rem;color:var(--amber);letter-spacing:.06em}
  .attr span{display:block;color:var(--dim);margin-top:9px;letter-spacing:.1em;font-size:1.05rem}
`;

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow glow-bl"></div>
  <div class="slide">
    ${s.kicker ? `<div class="eyebrow">${rich(s.kicker)}</div>` : ''}
    <div class="center">
      <div class="mark">&ldquo;</div>
      <blockquote>${rich(s.quote)}</blockquote>
      <div class="attr">${rich(s.author)}${
        s.role ? `<span>${rich(s.role)}</span>` : ''}</div>
    </div>
    ${brand(n, total)}
  </div>`;
