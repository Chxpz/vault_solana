use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::errors::VaultError;
use crate::state::{Strategy, Vault};

#[derive(Accounts)]
pub struct KaminoExec<'info> {
    pub manager: Signer<'info>,
    #[account(mut, has_one = manager)]
    pub vault: Account<'info, Vault>,
    pub strategy: Account<'info, Strategy>,
    /// CHECK: Kamino program id; validated against strategy.program_id
    pub kamino_program: UncheckedAccount<'info>,
    /// Vault custody is often needed as source/authority for transfers
    #[account(mut, address = vault.custody)]
    pub vault_custody: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_kamino_exec(ctx: Context<KaminoExec>, data: Vec<u8>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.strategy.program_id,
        ctx.accounts.kamino_program.key(),
        VaultError::Unauthorized
    );

    let base_mint_key = ctx.accounts.vault.base_mint;
    let authority_key = ctx.accounts.vault.authority;
    let bump_bytes = [ctx.accounts.vault.bump];
    let seeds: &[&[u8]] = &[b"vault", base_mint_key.as_ref(), authority_key.as_ref(), &bump_bytes];

    // Remaining accounts must be exactly what Kamino expects for the instruction encoded in `data`.
    let ix = anchor_lang::solana_program::instruction::Instruction {
        program_id: ctx.accounts.kamino_program.key(),
        accounts: ctx
            .remaining_accounts
            .iter()
            .map(|a| anchor_lang::solana_program::instruction::AccountMeta {
                pubkey: a.key(),
                is_signer: a.is_signer,
                is_writable: a.is_writable,
            })
            .collect(),
        data,
    };

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        ctx.remaining_accounts,
        &[seeds],
    )?;

    Ok(())
}

