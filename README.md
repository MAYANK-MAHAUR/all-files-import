# PayMemo

> Private memory layer for every wallet transaction. Built on Morph.

PayMemo turns raw on-chain activity into reviewable, encrypted financial records. You see what happened on a wallet AND why you signed it: who, what category, what private note. Two modes (dApp + browser extension) capture context the moment a transaction lands, store it encrypted in your vault, and let you export a tax-ready CSV at year end.

Built for the **Morph Build Sprint**, **Payroll and B2B track**. Live on Morph Hoodi testnet at <https://paymemo.vercel.app>.

## Demo

<video src="./public/demo.mp4" controls width="100%"></video>

> If the inline video doesn't render on your GitHub view, watch it here: [public/demo.mp4](./public/demo.mp4)

See the live architecture page at [`public/architecture.html`](./public/architecture.html) (open in any browser).

---

## Why this exists

I sat down to file my crypto taxes earlier this year and stared at thousands of transactions across multiple wallets. Every one was just a hex string. I remembered nothing. I spent hours digging through old chats, emails, and DEX history just to figure out what each payment was for. Even professional accountants struggle when their clients hand them a year of on-chain activity with no context.

Wallets show you **what** happened. PayMemo records **why**. Encrypted, private, ready for your accountant.

---

## What it is

A two-mode "memory layer" wrapper over your Morph wallet activity:

- **Mode 1 — dApp**: Pay directly from `paymemo.vercel.app`. Connect wallet, fill in counterparty + category + private note + amount, sign once. The memo is encrypted client-side and persisted alongside the transaction in your vault.
- **Mode 2 — Browser extension**: Install once, paste the wallet you want to watch. Every Morph Hoodi transaction on that wallet (from any wallet app, any dApp) triggers an automatic popup asking what it was for. Save = encrypted memo lands in your dashboard.

Detection happens server-side in real time so transactions you receive while offline still surface in your Needs Review queue when you come back.

---

## Architecture

Think of PayMemo as five teammates passing notes to each other. Each one has a clear job, and together they make sure your private memos stay private while your transactions stay on-chain.

### 1. You and your wallet

You open PayMemo in any modern browser (Chrome, Brave, Edge, Arc) — either the website itself, or our small browser extension. You bring your own crypto wallet (MetaMask, Rabby, Phantom, Trust, Bitget, Coinbase, OKX, Binance, etc.). PayMemo doesn't store your keys, doesn't make you sign up with email, and doesn't use WalletConnect. It just finds whatever wallet you've already installed and talks to it directly.

### 2. The app running inside your browser

This is the most important part. Everything sensitive happens **here**, on your own computer, before anything is sent out:

- When you type a memo, category, or counterparty name, the app scrambles it into unreadable text using strong encryption (AES-GCM).
- The "password" used for that scrambling is derived from a one-time signature your wallet makes — so only you can ever unlock it again. Even PayMemo's own developers can't read it.
- The app then talks to the Morph blockchain (to send/read transactions) and to PayMemo's server (to save the encrypted note).

The browser extension is a small companion that does the same thing for wallets you don't use through the website — it watches for transactions and pops up a little form asking "what was this for?"

### 3. The server (hosted on Vercel)

A thin middle layer that:

- Receives the already-encrypted memos and stores them.
- Checks that requests really came from you (by verifying your wallet's signature).
- Powers public invoice pages (so someone can pay you without an account).
- Handles batch payouts, agent payment intents, and the watched-wallets list.

The server **never sees your real notes** — only the scrambled version. If someone ever broke into the server, they'd find a pile of gibberish.

### 4. The database (Supabase Postgres)

This is where the encrypted data actually lives long-term. It holds your ledger entries, invoices, batch payouts, the list of wallets you're watching, and agent records. Strict access rules (Row-Level Security) make sure no one but PayMemo's own API can touch the data, and even then, the contents are encrypted.

### 5. The worker + the Morph blockchain

A tiny background program (running on Railway or Fly.io) does one job: every 2 seconds it asks Morph "any new blocks?" When it sees a transaction from or to a wallet you're watching, it tells the server, which tells your extension, which pops up and asks you to add a memo. This is how PayMemo catches payments you made outside the website — almost in real time.

Morph is the Layer-2 blockchain PayMemo runs on (chain ID 2910, testnet). It supports normal ETH and tokens like L2USDC and WETH. We also deployed a small smart contract called **BatchPayout** that lets you pay many people in a single transaction — useful for payroll or splitting bills.

### How the pieces talk

```
You + Wallet
     │
     ▼
Browser app  ──(encrypts memo here)──►  Vercel server  ──►  Supabase database
     │                                         ▲
     │ (signs & sends tx)                      │
     ▼                                         │
  Morph chain  ◄── Worker checks every 2s ─────┘
```

### Two main ways to use PayMemo

- **Send with a memo (from the website):** You fill out the form, your browser encrypts the memo, your wallet signs the transaction, the tx goes to Morph, and the encrypted memo + transaction hash get saved. Open your ledger and there it is — readable only by you.
- **Capture wallets you use elsewhere (with the extension):** You make a payment in any wallet app. The worker spots it on-chain within seconds. The extension pops up, you type what the payment was for, it gets encrypted, and it lands in your ledger alongside everything else.

There's also a third path for AI agents and automated scripts: they can post a "payment intent" (a reason for a future payment) through a public, rate-limited endpoint. The reason is encrypted, and you review and approve everything from a dashboard.

See `public/architecture.html` for a full visual diagram if you want to see every line connecting every piece.

### Trust model

- Private fields (`category`, `counterparty`, `note`, `project`, agent reason) are encrypted in the browser with AES-GCM. The key is derived from the user's wallet signature via SHA-256. The server only ever sees ciphertext.
- Public on-chain fields (tx hash, from, to, amount, block number) are stored as plain JSON. They are already public on Morph — encrypting them adds no privacy.
- Supabase uses Row-Level Security with a service-role-only policy. PayMemo's API routes hold the service role key and authenticate callers via a wallet signature (dApp) or install token (extension).

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | TanStack Start (React 19 SSR, file-based routing) on Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui (Radix), framer-motion, lucide-react |
| Wallet | viem + EIP-6963 discovery (no wagmi / no walletconnect) |
| Encryption | Web Crypto API (AES-GCM, SHA-256 KDF from wallet signature) |
| Chain | Morph Hoodi testnet (chain id 2910) |
| Database | Supabase Postgres + RLS + REST adapter |
| Hosting | Vercel (Build Output API v3, Node 22 serverless function) |
| Real-time worker | Railway / Fly.io (Node 20+ tiny poller) |
| Extension | Chrome Manifest V3 (vanilla JS, no build step) |
| Contract | Solidity 0.8.x (`contracts/BatchPayout.sol`) |
| Validation | Zod schemas across client and server |

---

## Project layout

```
.
├── src/
│   ├── routes/                  TanStack Start file-based routes
│   │   ├── index.tsx            Landing page
│   │   ├── install.tsx          Extension install + sideload guide
│   │   ├── app.*.tsx            Authenticated dashboard pages
│   │   └── api.*.ts             Server route handlers
│   ├── components/              UI (brand/, app/, landing/, fx/, ui/)
│   ├── lib/
│   │   ├── crypto-vault.ts      AES-GCM encryption helpers
│   │   ├── paymemo-vault.ts     Vault record CRUD (server-only)
│   │   ├── paymemo-schema.ts    Zod schemas
│   │   ├── morph.ts             Morph chain + RPC helpers
│   │   ├── watched-wallets.ts   Partner-wallet client store + signed adds
│   │   ├── server/
│   │   │   ├── paymemo-db.ts    Supabase + JSON-file dual adapter
│   │   │   ├── morph-scanner.ts Server-side Morph sweep
│   │   │   └── wallet-auth.ts   Signature verification helper
│   │   └── amount-utils.ts      Robust amount parser (handles "0.0001 ETH")
│   ├── server.ts                SSR error wrapper
│   └── styles.css               Tailwind + design tokens
├── extension/                   Chrome MV3 extension (no build step)
│   ├── manifest.json
│   ├── popup.html / popup.js    Toolbar UI
│   ├── sidepanel.html / sidepanel.js   Wallet manager + capture form
│   ├── background.js            Chain watcher service worker
│   ├── content.js / inpage.js   In-page capture overlay + window.ethereum wrap
│   ├── settings.html / settings.js     Options page
│   ├── capture.css / popup.css
│   └── icons/                   16/32/48/128 PNG icons
├── worker/                      Railway/Fly real-time block trigger
│   ├── index.js                 Polls Morph eth_blockNumber every 2s
│   ├── railway.json
│   └── railway.env              Env template
├── contracts/
│   └── BatchPayout.sol          ETH + ERC-20 batch payout contract
├── database/
│   └── schema.sql               Full Postgres schema + RLS policies
├── agent-tools/
│   └── paymemo-agent-client.ts  Standalone TS SDK for AI agents
├── scripts/
│   ├── vercel-build.mjs         Build Output API v3 adapter
│   ├── generate-logo.ps1        Logo PNG generator
│   ├── generate-og.ps1          OG image generator
│   ├── strip-em-dashes.ps1
│   └── bump-text-opacity.ps1
├── public/
│   ├── architecture.html
│   ├── demo.mp4
│   ├── logo.svg / favicon.ico / og-image.png
│   ├── icons/                   App icons 16-512
│   └── paymemo-extension.zip    Sideload archive
├── vercel.json                  Vercel cron + custom build command
└── package.json
```

---

## Quick start

### Prerequisites

- Node.js 20+ (Node 22 recommended to match Vercel runtime)
- npm or bun
- A Supabase project (optional for local dev — falls back to a JSON file)

### Install + run locally

```bash
npm install
cp .env.example .env.local      # fill in Supabase keys (optional)
npm run dev                     # http://127.0.0.1:5174
```

The dev server uses `database/paymemo-dev-db.json` as a JSON-file fallback when Supabase env vars are absent — useful for iterating without a database.

### Build for production

```bash
npm run build                   # vite build → dist/client + dist/server
node scripts/vercel-build.mjs   # transforms dist/ into .vercel/output/
```

### Build the extension zip

```bash
npm run build:extension         # → public/paymemo-extension.zip
```

---

## Environment variables

Copy `.env.example` to `.env.local` for local dev. For production, set these in Vercel → Project Settings → Environment Variables.

### Required for persistence

| Key | Purpose |
|---|---|
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Never expose via VITE_* |

### Required for the Vercel cron + Railway worker

| Key | Purpose |
|---|---|
| `CRON_SECRET` | Bearer token shared between Vercel cron and the Railway worker so unauthenticated callers can't trigger scans |

### Optional Morph overrides (defaults baked in)

| Key | Default |
|---|---|
| `VITE_MORPH_CHAIN_ID` | `2910` |
| `VITE_MORPH_RPC_URL` | `https://rpc-hoodi.morph.network` |
| `VITE_MORPH_EXPLORER_URL` | `https://explorer-hoodi.morph.network` |
| `VITE_MORPH_USDC_ADDRESS` | `0x1178341838B764dCfFA5BCEAb1d41443Fd71a227` |
| `VITE_MORPH_WETH_ADDRESS` | `0x5300000000000000000000000000000000000011` |
| `VITE_MORPH_BGB_ADDRESS` | empty |

---

## Database setup

Run `database/schema.sql` once in your Supabase SQL Editor. It is idempotent (every statement uses `create ... if not exists`) so re-running it is safe.

Tables created:

- `vault_records` — encrypted memos. Source of truth for the Ledger.
- `extension_records` — chain-watch detections + extension popup saves.
- `watched_wallets` — per-user list of Morph addresses to scan.
- `extension_pairings` — install token to wallet pairing for the extension.
- `agent_memory_records` — AI agent payment intents and reasons.
- `paymemo_domain_records` — invoices, batch payouts, agent payment intents (encrypted metadata).
- `users`, `payment_intents`, `transactions`, `invoices`, `counterparties`, `batch_payouts`, `batch_payout_items`, `agent_payment_intents`, `linked_transactions` — relational support tables.

Every table has Row-Level Security enabled with a `service_role` policy. The Vercel API routes use the service role key. Direct anon access from the browser is denied.

---

## Deployment

### Vercel (main app + API)

1. `git push` to GitHub.
2. <https://vercel.com/new> → Import the repo.
3. Framework Preset: **Other**. Build / install commands come from `vercel.json`.
4. Add environment variables (see above), including `CRON_SECRET`.
5. Deploy.

Verify at `https://paymemo.vercel.app/api/health` — should report `database.reachable: true` and a recent Morph block height.

The build emits a Vercel Build Output API v3 layout under `.vercel/output/`:
- `static/` — every file from `dist/client/`
- `functions/_render.func/index.mjs` — esbuild-bundled SSR function (~5 MB, all node_modules inlined)
- `config.json` — routing rules including `Cache-Control: no-store` on HTML responses (prevents stale-chunk 404s after redeploy)

### Railway (real-time worker)

1. <https://railway.app/new> → Deploy from GitHub repo.
2. Service Settings → Source → Root Directory = `worker`.
3. Variables tab → paste the contents of `worker/railway.env` (replace `YOUR_VERCEL_CRON_SECRET_HERE` with the same `CRON_SECRET` you set on Vercel).
4. Deploy. Logs should show `block <n> -> scan ok` lines every ~2 seconds.

Fly.io and Render free tiers also work — see `worker/README.md` for those.

### Extension (sideload)

Production Chrome Web Store listing is pending. For now, ship as a sideload:

1. User visits `https://paymemo.vercel.app/install`.
2. Clicks Download → gets `paymemo-extension.zip`.
3. Unzips → `chrome://extensions` → Developer mode → Load unpacked → pick the folder.

---

## API surface

All API routes live under `src/routes/api.*.ts`. Authentication uses either the wallet-signature headers (`x-paymemo-wallet` + `x-paymemo-signature`) or the extension install token (`x-paymemo-install-token`).

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/vault-records` | GET / POST / DELETE | Encrypted vault CRUD. Source of truth for the Ledger. |
| `/api/extension-intent` | GET / POST / OPTIONS | Extension capture sync. CORS-enabled for `chrome-extension://` origin. Dedupes by txHash on write. |
| `/api/extension-pair` | POST | Pairs an install token with a wallet on first contact. |
| `/api/watched-wallets` | GET / POST / DELETE | Per-user server-side watch list. Used by the cron + Railway worker. |
| `/api/cron/scan-morph` | GET / POST | Sweep Morph for watched wallets. GET = whole-table cron. POST = per-owner catch-up scan triggered when the dashboard mounts. |
| `/api/agent-memory` | GET / POST | AI agent payment history. Public POST (rate-limited). |
| `/api/agent-payment-intent` | GET / POST | Encrypted agent payment intents (domain record). |
| `/api/batch-payouts` | GET / POST | Encrypted batch payout records. |
| `/api/invoices` | GET / POST | Encrypted invoice records. |
| `/api/public-invoice` | GET | Public read-only invoice page (`/pay/$invoiceId`). |
| `/api/database-reset` | DELETE | Wipe all records for a wallet (wallet-auth required). |
| `/api/health` | GET | Diagnostics: DB connectivity, Morph RPC reachability, cron secret status. |

---

## Agent integration

AI agents that spend money can attach context to every payment via a single HTTP POST:

```ts
import { createAgentPaymentIntent } from "./paymemo-agent-client";

await createAgentPaymentIntent({
  agentId: "research-agent",
  taskId: "btc-brief-2026-05",
  tool: "Market data API",
  paidFor: "API call",
  reason: "Live order book data for the BTC research task.",
  to: "0xRecipient...",
  amount: "0.0001",
  token: "ETH",
  policy: "needs-review",
});
```

Or curl:

```bash
curl -X POST https://paymemo.vercel.app/api/agent-memory \
  -H 'content-type: application/json' \
  -d '{
    "agentId": "research-agent",
    "taskId": "btc-brief",
    "paidFor": "API call",
    "reason": "Live order book data.",
    "to": "0xRecipient...",
    "amount": "0.0001"
  }'
```

The agent owner can later browse, edit, and export the full agent ledger from `/app/agents`.

---

## Demo flow (for hackathon submission)

1. Open `https://paymemo.vercel.app` — landing page renders the brand, the two modes, and the CTAs.
2. Click **Get Extension** → `/install` → download zip → sideload.
3. Click **Launch App** → `/app` → Connect wallet (PayMemo discovers MetaMask, Rabby, Bitget, Trust, Phantom, OKX, Coinbase, Binance via EIP-6963).
4. Add a wallet to watch (your own + a partner). Each add requires a `personal_sign` authorization to prevent accidental adds.
5. **Mode 1 — dApp**: Go to `/app/send`, pick category (Payroll, Vendor Payment, Invoice, etc.), fill in counterparty + note + amount, sign once. Tx confirms on Morph, encrypted record lands in `vault_records`, appears in the Ledger.
6. **Mode 2 — Extension**: Send a Morph Hoodi tx from any wallet. Within ~2 seconds the Railway worker triggers a scan, the extension popup opens asking for memo. Fill it, save, popup closes, record lands in `/app/review` Completed tab.
7. `/app/ledger` → filter by Financial Year (Apr-Mar) → click Export CSV → ready-for-accountant file with every memo.

---

## What's next

- Chrome Web Store listing once the v1 polish lands.
- Native Philippine peso conversion for Filipino freelancers paid in USDC.
- Partner review and reputation layer so SEA businesses can vouch for each other's wallets.
- Encryption audit + Morph mainnet launch.
- Full AI-agent ledger UX with per-agent reputation, monthly burn summaries, and direct export to popular accounting tools.

---

## Available scripts

```bash
npm run dev               # vite dev (http://127.0.0.1:5174)
npm run build             # production build (dist/client + dist/server)
npm run build:dev         # build in dev mode
npm run build:extension   # zip extension/ to public/paymemo-extension.zip
npm run preview           # preview built site
npm run lint              # eslint
npm run format            # prettier --write .
```

---

## License

MIT. See `LICENSE` (or the repo header) for details.

Built for Morph Build Sprint 2026 by Mayank Mahaur.
