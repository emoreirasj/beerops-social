# Publicação via Make.com

Cenário **montado em 2026-08-20** e salvo. Este documento registra o que existe de
fato na conta, não um plano.

## Coordenadas da conta

| | |
|---|---|
| Zona | `us2` |
| Organização | 8725508 (`My Organization`) |
| Equipe | 2750730 (`My Team`) |
| Plano | **Free** |
| Cenário | 6002351 — `BeerOps - publicar carrossel no Instagram` |
| URL | https://us2.make.com/2750730/scenarios/6002351/edit |
| Data store | `beerops-publicados` — 1 MB, **sem data structure** |

O Data store foi criado sem data structure de propósito: assim ele guarda só a chave
primária, que é exatamente o que precisamos (saber se um `id` já foi publicado). O
próprio diálogo do Make descreve esse caso de uso.

## Estado do cenário

```
HTTP 2                      GET https://beerops-social.emsj89.workers.dev/feed.json
  │                         No authentication · Parse response: Yes
  ▼
Iterator 3                  Array: {{2.data.posts}}          ← um bundle por post
  │
  ├─ filtro "pronto e na data"
  │     {{3.status}}      Text: Equal to                     → ready
  │     {{3.scheduledAt}} Datetime: Earlier than or equal to → {{now}}
  ▼
Data store 4                Get a record · beerops-publicados · Key {{3.id}}
  │
  ├─ filtro "ainda nao publicado"
  │     {{4.key}}         Basic: Does not exist
  ▼
Iterator 7                  Array: {{3.images}}              ← um bundle por slide
  ▼
Array aggregator 8          Source: Iterator [7]
  │                         Target module: Instagram 5 · Target structure: Files
  │                         Media Type: Image · Photo URL: {{7.value}}
  ▼
Instagram 5                 Create a carousel post
  │                         Connection: BeerOps (Edson Moreira dos Santos)
  │                         Page: BeerOps (@beeropsoficial)
  │                         Files (Map):  {{8.array}}
  │                         Caption:      {{3.caption}}
  ▼
Data store 6                Add/replace a record · beerops-publicados
                            Key {{3.id}} · Overwrite: Yes
```

**Por que Iterator 7 + Array aggregator 8.** O campo `Files` do módulo do Instagram
não aceita um array de URLs: cada item é uma **collection** com `Media Type` e
`Photo URL`. Como o número de slides varia (6, 7, até 10), não dá para preencher itens
fixos. O par Iterator + Aggregator quebra `{{3.images}}` em um bundle por URL e
remonta o array já no formato que o módulo espera. É o padrão do Make para carrossel
de tamanho variável.

O `feed.json` continua entregando `images` como array simples de URLs — a conversão
mora no cenário, não no repositório.

**Escopo do aggregator:** a origem é o Iterator 7, então os valores do Iterator 3
(`{{3.caption}}`, `{{3.id}}`) continuam acessíveis depois da agregação. Por isso o
módulo 5 e o 6 conseguem referenciar o post.

**Agendamento:** Daily às **12:05**, fuso `America/Sao_Paulo`. Os posts usam
`scheduledAt` às 12:00, então os 5 minutos de folga evitam empate no limite do
`Earlier than or equal to`.

**Estado do interruptor: DESLIGADO.**

## O que falta

Só uma coisa: **publicar o feed**. `beerops-social.emsj89.workers.dev/feed.json` ainda não
existe — faltam o repo no GitHub e o projeto no Cloudflare Pages (output `public`,
sem build command). Enquanto isso o módulo 2 responde 404 e não há teste de ponta a
ponta possível.

Depois disso: marcar um post como `status: "ready"`, rodar `Run once` para validar, e
só então ligar o interruptor.

## Custo

Plano Free basta: 1.000 operações/mês, 2 cenários ativos, intervalo mínimo de 15 min.
Um carrossel de 7 slides gasta ~10–12 operações; 12 posts/mês ficam perto de 150.
Sem custo de AWS nem de Cloudflare.

**A API do Make não está disponível no Free** — token exige Core (US$ 10,59/mês). Por
isso o cenário foi montado pela interface.

## Armadilhas observadas

- **O diálogo de filtro não salva sozinho.** Fechar o painel sem clicar em **Save**
  perde o filtro em silêncio; o aviso só aparece ao salvar o cenário, como
  *"The filter contains unsaved changes"*. Aconteceu com o filtro
  "ainda nao publicado" na primeira tentativa.
- **O botão Save do filtro fica fora da viewport** em janelas baixas. Use o ícone de
  expandir no cabeçalho do diálogo.
- **10 slides no máximo** por carrossel na API (o app aceita 20). O `render.mjs` já
  falha antes de gerar o 11º.
- **100 posts por API a cada 24h** por conta.
- **A imagem precisa ser publicamente acessível** — quem baixa é o servidor da Meta.
  Drive, Dropbox ou qualquer URL com sessão retorna erro no módulo 5.
- **Todos os slides no mesmo aspect ratio**: a Meta recorta o carrossel inteiro pelo
  primeiro. Nossos templates são todos 1080×1350.
- **Só JPEG.** A doc da Meta diz *"JPEG is the only image format supported"*. O
  `render.mjs` gera `.jpg` em qualidade 92 desde 2026-08-20; antes gerava PNG, que
  teria falhado no primeiro `Run once`.
- **Alt-text:** o módulo do Make não expõe o campo. O `feed.json` traz `altTexts` na
  mesma ordem das `images`; aplicar pelo app depois de publicar (Editar →
  Configurações avançadas → Escrever texto alternativo).
- **Page Publishing Authorization (PPA):** o próprio módulo avisa que conta Instagram
  Business ligada a uma Página que exige PPA não consegue publicar até a PPA ser
  concluída. Se o primeiro `Run once` falhar por isso, é lá que se resolve.

## Fluxo de trabalho de um post

1. Escreve `posts/<slug>/post.json` com `status: "draft"`.
2. `npm run render -- <slug>` e confere os JPEGs em `public/<slug>/`.
3. Revisa `posts/<slug>/caption.txt`.
4. Troca para `status: "ready"`, define `scheduledAt`, roda o render de novo.
5. `git push`. O Cloudflare publica; o Make pega na execução das 12:05.

Enquanto o `status` for `draft`, o post fica visível na URL pública mas o filtro
"pronto e na data" o ignora — é o freio de mão contra publicar rascunho.
