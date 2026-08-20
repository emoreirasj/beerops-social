# beerops-social

Gerador de carrosséis do Instagram do BeerOps. O conteúdo mora num `post.json`
versionado, a arte é renderizada por Playwright a partir dos tokens da marca, e o
Cloudflare Pages publica os JPEGs numa URL pública que o Make consome pra postar.

```
posts/<slug>/post.json          você escreve
        ↓  npm run render
public/<slug>/01..NN.jpg        arte 1080×1350
public/feed.json                fila que o Make lê
        ↓  git push
Cloudflare Pages                URL pública
        ↓  cenário do Make (1×/dia)
Instagram                       carrossel publicado
```

## Por que assim

- **Texto versionado.** A legenda entra em review junto com a arte, e o histórico
  mostra o que foi publicado e quando.
- **Arte regenerável.** `src/tokens.css` espelha `beerops-landing/src/pages/index.astro`.
  Se a identidade mudar, atualize os tokens e rode `npm run render:all` — todos os
  posts antigos saem repintados.
- **URL pública é requisito, não escolha.** O módulo Instagram do Make manda a Meta
  buscar a imagem. Google Drive e Dropbox não servem; Cloudflare Pages serve, é
  grátis, e o repositório pode continuar privado.

## Comandos

```bash
npm install                                  # playwright 1.60.0 (o Chromium já está na máquina)
npm run shots                                # captura as telas do /demo -> assets/shots/
npm run render -- 2026-08-25-custo-por-litro # renderiza um post
npm run render:all                           # renderiza todos (use após mexer nos tokens)
```

`npm run shots -- http://localhost:4321/demo` aponta pro demo local em vez do que
está no ar.

## Escrever um post

Crie `posts/<AAAA-MM-DD-slug>/post.json`. Campos do post:

| campo | efeito |
|---|---|
| `status` | `draft` (padrão) ou `ready`. **O Make só publica `ready`.** |
| `scheduledAt` | ISO com fuso, ex. `2026-08-25T12:00:00-03:00` |
| `slides` | 1 a 10 — a API de carrossel da Meta não passa de 10 |
| `caption` | legenda; o total com hashtags precisa caber em 2200 caracteres |
| `hashtags` | array, no máximo 30 |

Todo slide precisa de `alt` (texto alternativo). Marcação disponível em qualquer
texto: `*palavra*` pinta de âmbar, `**frase**` aplica o gradiente âmbar→cobre,
`|` quebra linha.

### Tipos de slide

| `type` | usa | para |
|---|---|---|
| `capa` | `kicker`, `title`, `lede` | abertura — o gancho |
| `texto` | `kicker`, `title`, `items[{text,note}]` | lista didática |
| `dado` | `kicker`, `value`, `unit`, `caption`, `delta` | um número grande |
| `antes-depois` | `title`, `leftLabel`, `rightLabel`, `left[]`, `right[]` | comparação |
| `shot` | `title`, `image`, `url`, `note` | tela real do produto |
| `citacao` | `quote`, `author`, `role` | depoimento |
| `cta` | `title`, `lede`, `url`, `proof` | fechamento |

`accent` opcional em qualquer slide: `"hop"` (verde, para ganho) ou `"red"`
(para perda). Sem `accent`, o slide usa âmbar. Trocar o acento entre slides é o
que impede o feed de virar uma parede monocromática.

## O que o render recusa

O `render.mjs` falha em vez de gerar arte quebrada quando:

- o post passa de 10 slides, 30 hashtags ou 2200 caracteres de legenda;
- um slide não tem `alt`;
- um `shot` aponta pra imagem que não existe em `assets/shots/`;
- um `dado` tem `value` com mais de 9 caracteres (vaza da margem);
- um `antes-depois` tem listas de tamanhos diferentes (quebra o alinhamento par a par);
- **a copy usa promessa absoluta** — `ilimitado`, `sem limite`, `garantido`, `100%`,
  `nunca mais` e afins. Regra do projeto: preferir o número verificável ao
  superlativo. A lista está em `PROMESSAS_PROIBIDAS`, no topo do `render.mjs`.

## Formato e enquadramento

- **JPEG, qualidade 92.** Não é preferência: *"JPEG is the only image format supported"*
  na API de content publishing da Meta. PNG faz o módulo do Instagram falhar.
- **1080×1350 (4:5)** em todos os slides. A Meta recorta o carrossel inteiro pelo
  primeiro slide, então misturar proporção estraga o post.
- **Padding de 80px.** O grid do perfil recorta o 4:5 num 3:4, comendo ~34px de cada
  lado; nada importante pode encostar na borda.
- Slides de produto saem do `/demo`, capturado a 1180px de largura e 2× de escala —
  a 1440px o texto do app fica ilegível depois de reduzido pra dentro da moldura.

## Publicação

Os JPEGs e o `feed.json` ficam em `public/`, que é o diretório de saída do
Cloudflare Pages. Um `git push` publica; nenhum build command é necessário.

O cenário do Make roda 1×/dia e faz: `HTTP GET {baseUrl}/feed.json` → filtra
`status == "ready"` e `scheduledAt <= agora` → confere o `id` num Data Store pra
não repostar → `Instagram for Business: Create a Carousel Post` com o array
`images` e o `caption` → grava o `id` no Data Store.

Detalhes e limites em [`docs/make.md`](docs/make.md).

## Estrutura

```
src/tokens.css          tokens da marca (espelho do index.astro da landing)
src/shell.mjs           moldura do slide, escape e marcação mínima
src/templates/*.mjs     um arquivo por tipo de slide
src/render.mjs          post.json -> JPEG + caption.txt + feed.json
src/shots.mjs           /demo -> assets/shots/
posts/<slug>/           post.json (fonte) + caption.txt (gerado)
public/                 artefato de deploy — gerado, não editar à mão
assets/shots/           telas do produto — geradas, não editar à mão
```
