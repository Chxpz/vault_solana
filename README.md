# Tokenized Vault (Anchor on Solana)

A minimalist, modular share-based vault program. Users deposit a base SPL token (single-asset), receive vault shares, and can withdraw proportionally. Each vault is initialized with an arbitrary Strategy, and managers can switch the vault’s strategy post-launch.

## Features (v1)
- Single base asset custody (e.g., USDC or WSOL)
- Share mint controlled by a Vault PDA
- Proportional deposit/withdraw math
- Strategy registry (data-only) and manager-controlled strategy switching
- Generic CPI adapter entrypoint `kamino_exec` for strategy programs (allowlisted per `Strategy.program_id`)
- Anchor program + TS scripts + tests (local + mainnet-clone WSOL)

## Roadmap (next)
- Concrete strategy adapters (Kamino Lend deposit/withdraw)
- Harvest/sync with HWM and management fees (mint shares to treasury)
- Pyth price feeds for AUM and fair share price
- Whitelist for accepted mints (v2 multi-asset)
- Governance (multisig) and pausability

## Program
- Program name: `tokenized_vault`
- PDA seeds:
  - Vault: `["vault", base_mint, authority]`
  - Strategy: `["strategy", authority, program_id_target, meta, [kind]]`
- Accounts:
  - Vault: `authority`, `manager`, `base_mint`, `share_mint`, `custody`, `strategy`, `bump`, `paused`
  - Strategy: `authority`, `program_id`, `meta`, `kind`, `bump`
  - Share mint: SPL mint with mint authority = Vault PDA
  - Custody: ATA of base_mint owned by Vault PDA
- Instructions:
  - `create_strategy(kind)` → defines target DeFi program and optional meta
  - `initialize_vault(share_decimals)` with `strategy`
  - `set_strategy()` (manager only)
  - `deposit(amount)` / `withdraw(shares)`
  - `kamino_exec(data)` (manager only): generic CPI forwarder to `Strategy.program_id` using `remaining_accounts`

### Math
- Deposit: `shares = amount * total_shares / total_assets` (1:1 if first)
- Withdraw: `amount = shares * total_assets / total_shares`

## Requirements
- Solana CLI 2.x
- Anchor CLI 0.31.x
- Rust stable, Node 18+

## Setup
```bash
cd tokenized-vault
yarn install
```

## Build
```bash
yarn build
```

## Test
- Local + mainnet-clone WSOL test + CPI adapter test:
```bash
yarn test
```
The `Anchor.toml` config uses `--url https://api.mainnet-beta.solana.com` and clones minimal accounts (e.g., WSOL mint). Extend clones for future protocol tests.

## Environment Variables
These are used by scripts/tests:
- `BASE_MINT`: base token mint (e.g., WSOL `So1111...` or local mint in tests)
- `SHARE_DECIMALS`: decimals for share mint (e.g., 6 or 9)
- `VAULT_AUTHORITY`: public key used on `initialize_vault` (derives the vault PDA)
- `STRATEGY`: strategy PDA to use when initializing the vault or switching
- `TARGET_PROGRAM_ID`: target program for `create_strategy` (e.g., a DeFi protocol program id)
- `META_PDA`: optional protocol meta account (pool/market/etc.) for `create_strategy`
- Script-specific:
  - `AMOUNT`: amount in base token units for `deposit.ts`
  - `SHARES`: share amount for `withdraw.ts`

## Scripts
- Create strategy:
```bash
TARGET_PROGRAM_ID=<defi_program_id> META_PDA=<meta_or_111..> STRATEGY_KIND=1 \
yarn script:create-strategy
```
- Initialize vault:
```bash
STRATEGY=<strategy_pda> BASE_MINT=<base_mint_pubkey> SHARE_DECIMALS=6 \
yarn script:init-vault
```
- Deposit:
```bash
BASE_MINT=<base_mint> SHARE_MINT=<share_mint> VAULT_AUTHORITY=<creator_pubkey> AMOUNT=1000 \
anchor run node scripts/deposit.ts
```
- Withdraw:
```bash
BASE_MINT=<base_mint> SHARE_MINT=<share_mint> VAULT_AUTHORITY=<creator_pubkey> SHARES=1000 \
anchor run node scripts/withdraw.ts
```
- Change strategy (manager only):
```bash
BASE_MINT=<base_mint> VAULT_AUTHORITY=<creator_pubkey> STRATEGY=<new_strategy_pda> \
yarn script:set-strategy
```

Notes:
- `VAULT_AUTHORITY` is the public key used at `initialize_vault`. PDA is derived from `["vault", base_mint, authority]`.
- User ATAs must exist and hold sufficient balance for deposit.

## Project Layout
- `programs/tokenized-vault/src/lib.rs` – Anchor program (module-wired)
- `programs/tokenized-vault/src/instructions/*` – modular instructions
- `tests/` – Mocha tests
- `scripts/` – Utility scripts
- `Anchor.toml` – Build/test configuration (includes mainnet-clone setup)

## Security
- PDA-only authority for mint and custody
- Strict account constraints and seeds
- Strategies are data-only in v1; CPI adapters use allowlisted program ids

## Development Tips
- Rerun build after program edits: `yarn build`
- View IDL: `target/idl/tokenized_vault.json`
- Run a focused test: `mocha -g "initialize" tests/`

## License
MIT
