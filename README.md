<div align="center">

<img src="public/logo.png" width="96" alt="Qripto logo">

# Qripto

### Scan any UPI QR. Pay in USDC. The merchant gets INR.

A trust-minimised "Paytm for crypto" prototype: an on-chain escrow, staked liquidity providers, and a payer app that feels like a normal payments app.

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-363636.svg)](contracts/UpiEscrow.sol)
[![Tests](https://img.shields.io/badge/tests-21%20passing-2ea44f.svg)](#tests)
[![Network](https://img.shields.io/badge/network-testnet%20only-orange.svg)](#status-mock-vs-real)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-a78bfa.svg)](CONTRIBUTING.md)

**If this idea is useful to you, a ⭐ helps a lot.**

</div>

<p align="center">
  <img src="docs/screenshots/01-landing.png" width="190" alt="Landing">
  <img src="docs/screenshots/05-home.png" width="190" alt="Home">
  <img src="docs/screenshots/06-confirm.png" width="190" alt="Confirm payment">
  <img src="docs/screenshots/09-merchant.png" width="190" alt="Merchant page">
</p>

---

## Why

Crypto holders can't pay a corner chai stall. Merchants only accept UPI. Existing bridges either hold your funds, ask the merchant to touch crypto, or need you to trust a company.

Qripto keeps the merchant on plain UPI and keeps the payer's USDC inside a smart contract until someone has proven the merchant was paid.

## How it works

```mermaid
sequenceDiagram
    participant P as Payer
    participant E as Escrow contract
    participant L as Liquidity provider
    participant M as Merchant (UPI)
    P->>E: createOrder(USDC, INR amount, hash of UPI id)
    L->>E: acceptOrder (locks 50% stake)
    L->>M: pays INR over UPI
    L->>E: submitProof(UTR, attestor signature)
    alt payer confirms, or dispute window ends
        E->>L: release USDC
    else payer disputes
        E->>E: arbiter resolves, loser is slashed
    end
```

- **Payer** deposits USDC; funds are locked, not sent to anyone.
- **LP** fronts the INR, so the merchant sees a normal UPI credit.
- **Proof** of the UPI payout unlocks the USDC for the LP.
- **Protection:** the payer can dispute inside the window. LPs stake USDC and are slashed to the payer if they don't pay in time or lose a dispute.
- **Privacy:** only a hash of the merchant's UPI id goes on chain.

## Features

| | |
|---|---|
| 📷 **Scan or paste** any UPI QR / `upi://` link (EMV parser included) | 🔗 **One merchant link + QR** with a live "Paid ✓" ledger |
| 🔐 **Own your wallet:** create (12 words) or import, password-encrypted in the browser | 👤 **Profile:** name, avatar, saved merchants, history, recovery export |
| 💱 **Best-rate matching:** LPs publish rates, payers get the best staked offer | 🧾 **Receipts**, order notifications, daily streak and points |
| 🛡️ **Stake + slashing + disputes + arbiter** | 🌐 **Hindi toggle**, auto-lock, PWA install |
| 🤖 **LP bot** that quotes and fills orders | 🧪 **21 tests** for the contract and parser |

## Screens

<p align="center">
  <img src="docs/screenshots/02-country.png" width="170" alt="Country picker">
  <img src="docs/screenshots/03-signin.png" width="170" alt="Sign in">
  <img src="docs/screenshots/04-create-wallet.png" width="170" alt="Create wallet">
  <img src="docs/screenshots/07-order-proven.png" width="170" alt="Order proven">
  <img src="docs/screenshots/10-lp.png" width="170" alt="LP console">
</p>

One app, four roles, switched with the tabs at the top:

| Tab | Who | What they do |
|---|---|---|
| **Pay** `/` | Anyone with USDC | Scan, confirm, pay, dispute or confirm |
| **Merchant** `/merchant` | Shop owner | Create a payment link or QR, see payments |
| **Earn (LP)** `/lp` | Liquidity provider | Stake, publish a rate, fill orders |
| **Arbiter** `/arbiter` | Dev only | Resolve disputed orders |

## Quick start

Requires Node 20+.

```bash
git clone https://github.com/Spyder15/Qripto.git
cd Qripto
npm install
DISPUTE_WINDOW=60 npm run dev     # local chain + contracts + app on http://localhost:8788
node app/lp-bot.js                # optional: an automated LP (mock payout)
```

Open <http://localhost:8788>, create a wallet, tap **Get test USDC**, then open `/merchant` in another tab, create a link, and pay it.

### Tests

```bash
npm test
```

## Project layout

```
contracts/   UpiEscrow.sol, MockUSDC.sol
app/         server.js (API, RPC proxy, faucet), lp-bot.js, rate.js, providers.js, dev.js, prod.js
public/      payer.html, merchant.html, lp.html, arbiter.html, profile.html, common.js, emv.js
scripts/     deploy.js
test/        contract tests
docs/        screenshots
```

## Deploy

**Testnet (Base Sepolia):**

```bash
DEPLOYER_KEY=… BASE_SEPOLIA_RPC=… ATTESTOR_ADDRESS=… ARBITER_ADDRESS=… \
  npx hardhat run scripts/deploy.js --network baseSepolia
RPC_URL=… ATTESTOR_KEY=… node app/prod.js
```

**Public demo:** GitHub Pages can't host this (it needs a Node backend and a chain). Use the included `render.yaml` + `Dockerfile` on Render, or run `cloudflared tunnel --url http://localhost:8788` for a temporary link. The demo chain resets on every restart.

## Status: mock vs real

This is a **testnet prototype. Do not use real money.**

| Piece | State |
|---|---|
| Escrow, stake, slashing, disputes | ✅ Implemented and tested |
| Wallet vault, profile, merchant page, best-rate matching | ✅ Working |
| UPI payout proof | ⚠️ **Mock.** The attestor signs whatever UTR the LP submits |
| VPA name verification | ⚠️ Mock (only the QR `pn=` name is shown) |
| Social login (Google, email, phone, passkey) | ⏳ Not connected (needs Privy / Web3Auth) |
| Security audit, legal / RBI review | ❌ Not done |

## Roadmap

- [ ] Real payout proof (zkTLS / bank-statement attestation)
- [ ] Social login and passkeys
- [ ] Base Sepolia public deployment
- [ ] Verified VPA name lookup
- [ ] More corridors: PIX (Brazil), QRIS (Indonesia)
- [ ] Decentralised arbiter and LP reputation
- [ ] Independent contract audit

## Contributing

PRs and ideas are very welcome, especially on the **real proof** problem. See [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues: translations, new country payout modules, UI polish, extra contract tests.

## Disclaimer

Experimental software for education and testnet use. It is not a licensed payment service, is unaudited, and is not legal or financial advice.

## License

[MIT](LICENSE) © 2026 Spyder15
