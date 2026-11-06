# Contributing to Qripto

Thanks for helping. This is a testnet prototype, so small, focused PRs are best.

## Setup

```bash
npm install
npm test                          # contract + EMV parser tests
DISPUTE_WINDOW=60 npm run dev     # app on http://localhost:8788
node app/lp-bot.js                # optional LP bot
```

## Where help is most useful

1. **Real payout proof** (`app/providers.js` `verifyPayout`): zkTLS or bank attestation instead of the mock.
2. **New corridors:** PIX (Brazil), QRIS (Indonesia). Add a parser next to `public/emv.js` and a country in `public/common.js`.
3. **Social login / passkeys** via Privy or Web3Auth.
4. **Translations:** add a dictionary like `HI` in `public/common.js`.
5. **Tests** for edge cases in `contracts/UpiEscrow.sol`.

## Guidelines

- Open an issue first for large changes.
- Keep the contract change and its test in the same PR.
- Run `npm test` before pushing.
- No real funds, real keys, or real UPI ids in code, tests or screenshots.
- Never commit secrets (`.env`, private keys).

## Security

Found a vulnerability? Please don't open a public issue. Contact the maintainer privately through their GitHub profile.
