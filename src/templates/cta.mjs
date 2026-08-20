import { rich, brand } from '../shell.mjs';

export const css = `
    .biglogo{font-weight:900;font-size:3.6rem;letter-spacing:-.035em;margin-bottom:44px}
  .biglogo em{font-style:normal;color:var(--amber)}
  .biglogo span{font-family:var(--mono);font-size:1rem;color:var(--dim);
                letter-spacing:.16em;margin-left:18px;vertical-align:12px}
  h2{font-size:3.5rem}
  .lede{font-size:1.65rem;max-width:34ch}
  .url{align-self:flex-start;margin-top:52px;font-family:var(--mono);font-size:1.9rem;
       font-weight:700;color:#181005;letter-spacing:-.01em;
       background:linear-gradient(135deg,var(--amber),var(--copper));
       padding:20px 38px;border-radius:99px;box-shadow:0 10px 44px rgba(240,163,43,.25)}
  .proof{margin-top:40px;font-family:var(--mono);font-size:1.15rem;color:var(--dim);
         display:flex;align-items:center;gap:14px}
  .proof i{width:9px;height:9px;border-radius:50%;background:var(--hop);font-style:normal}
`;

export default (s, { n, total }) => `
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="slide">
    <div class="center">
      <div class="biglogo">Beer<em>Ops</em><span>BREWERY OS</span></div>
      <h2>${rich(s.title)}</h2>
      ${s.lede ? `<p class="lede">${rich(s.lede)}</p>` : ''}
      <div class="url">${rich(s.url || 'beerops.com.br')}</div>
      ${s.proof ? `<div class="proof"><i></i>${rich(s.proof)}</div>` : ''}
    </div>
    ${brand(n, total, { semLogo: true })}
  </div>`;
