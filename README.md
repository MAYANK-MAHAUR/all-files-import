# PayMemo

PayMemo is a private transaction memory, payment intent, and onchain accounting layer for human and AI-agent payments.

Wallets show what happened. PayMemo remembers why it happened.

## Problem

Wallet history proves that a transaction happened, but it usually cannot explain payroll context, invoice references, vendor names, bridge reasons, agent task IDs, receipts, project labels, or accounting notes. That becomes painful for freelancers, small businesses, remote teams, and AI-agent wallets when bookkeeping or review time arrives.

## Solution

PayMemo captures the purpose before or around signing, stores it as an encrypted pending intent, verifies the onchain transaction receipt, then finalizes the record only after success.

Private metadata is encrypted in the browser before storage. The backend receives ciphertext blobs, not plaintext notes.

## Modes

### dApp Mode

Users connect a wallet, sign an unlock message for the PayMemo vault, create a payment intent, sign the transaction, and PayMemo verifies the Morph Hoodi receipt before saving the final ledger entry.

### Wallet-Assist Extension Mode

The browser extension prototype targets supported EVM browser dApp flows that use `window.ethereum`. It asks “What is this transaction for?” before or around signing, stores a pending memory record, and can later sync the encrypted context back to PayMemo.

This prototype does not claim to intercept every wallet, mobile wallet, hardware wallet, or internal wallet send screen.

### AI-Agent Layer

Agents can call `/api/agent-memory` to create explainable spend records with agent ID, task ID, tool/API/service, amount, recipient, reason, policy status, and optional tx hash.

Agents spend money. PayMemo makes them explain why.

## Privacy Model

Public transaction facts can include tx hash, from, to, token, amount, chain ID, block, and timestamp.

Private metadata includes category, counterparty labels, notes, invoices, project names, receipts, tax labels, payroll context, task IDs, tools, and agent reasoning.

PayMemo encrypts private metadata client-side with AES-GCM. The demo derives the vault key from a wallet signature for:

```text
Unlock PayMemo Vault
```

The signature is not a transaction and does not grant spending permission.

## Morph Hackathon Fit

Primary track: Payroll + B2B.

PayMemo supports batch payout memory, vendor payment context, invoice records, ledger exports, and accounting-ready records on Morph Hoodi Testnet.

Secondary fit: SME Payments, FX Treasury, and x402 / agentic payments.

Morph Hoodi settings:

- Chain ID: `2910`
- RPC: `https://rpc-hoodi.morph.network`
- Explorer: `https://explorer-hoodi.morph.network`

## Tech Stack

- TanStack Start / React / TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react
- Web Crypto API AES-GCM
- EVM injected wallets via `window.ethereum`
- Chrome Manifest V3 extension prototype
- Minimal Solidity batch payout helper

## Local Setup

```bash
npm install
npm run dev
```

Open the app at the Vite URL shown in the terminal.

Copy `.env.example` to `.env` if you want live ERC-20 transfers. Native ETH test transfers on Morph Hoodi do not need token contract addresses.

## Demo Steps

1. Open PayMemo.
2. Launch the app.
3. Go to Morph Testnet and add Morph Hoodi to your wallet.
4. Go to Send Payment.
5. Connect wallet.
6. Enter a full recipient address.
7. Use ETH for the live Morph Hoodi demo unless ERC-20 addresses are configured.
8. Choose a category and private note.
9. Click Create Intent & Sign.
10. Sign the PayMemo vault unlock message.
11. Sign the wallet transaction.
12. Wait for onchain confirmation.
13. Open Ledger and export CSV.
14. Load the extension from `extension/` and test wallet-assist capture on a supported EVM dApp flow.

## API Prototype

- `POST /api/records` validates normalized payment records.
- `POST /api/vault-records` accepts encrypted vault blobs only.
- `GET /api/vault-records?wallet=0x...` returns encrypted records for a wallet.
- `POST /api/extension-intent` normalizes extension-captured intents.
- `POST /api/agent-memory` creates agent spend memory records.

## Extension Prototype

Load `extension/` as an unpacked Chrome extension. It injects a lightweight `window.ethereum.request` wrapper for supported EVM browser flows and shows the PayMemo context prompt before calling the original wallet request.

## Limitations

- PayMemo does not make public blockchain transactions invisible.
- PayMemo does not calculate official taxes.
- The extension initially targets supported EVM browser dApp flows using injected providers.
- Not every wallet or internal wallet send flow can be intercepted.
- The included server store is a demo adapter; use the SQL schema for a durable Postgres/Supabase deployment.
- AI is optional and should not receive private notes by default.

## Roadmap

- Durable Supabase/Postgres adapter with RLS
- Better wallet-assist coverage
- MCP server for AI agents
- Agent payment intent API keys and policies
- Swap and bridge auto-classification
- Multi-wallet profiles
- Selective sharing for accountants
- Arc deployment
- Team workspaces
- Optional local LLM note/category suggestions
