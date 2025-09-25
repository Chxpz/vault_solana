use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::errors::VaultError;
use crate::state::{Strategy, Vault};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [b"vault", base_mint.key().as_ref(), vault.authority.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    pub base_mint: Account<'info, Mint>,
    #[account(mut, address = vault.share_mint)]
    pub share_mint: Account<'info, Mint>,
    #[account(mut, address = vault.custody)]
    pub vault_custody: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = share_mint, associated_token::authority = user)]
    pub user_share_ata: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = base_mint, associated_token::authority = user)]
    pub user_base_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
    require!(!ctx.accounts.vault.paused, VaultError::Paused);
    require!(shares > 0, VaultError::InvalidAmount);

    let total_shares: u128 = ctx.accounts.share_mint.supply as u128;
    let total_assets: u128 = ctx.accounts.vault_custody.amount as u128;
    require!(total_shares > 0 && total_assets > 0, VaultError::EmptyVault);

    let shares_u128: u128 = shares as u128;
    let amount_out: u64 = ((shares_u128 * total_assets) / total_shares)
        .try_into()
        .map_err(|_| error!(VaultError::MathOverflow))?;
    require!(amount_out > 0, VaultError::ZeroAssetsOut);

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.share_mint.to_account_info(),
                from: ctx.accounts.user_share_ata.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        shares,
    )?;

    let base_mint_key = ctx.accounts.base_mint.key();
    let authority_key = ctx.accounts.vault.authority;
    let bump_bytes = [ctx.accounts.vault.bump];
    let seeds: &[&[u8]] = &[b"vault", base_mint_key.as_ref(), authority_key.as_ref(), &bump_bytes];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_custody.to_account_info(),
                to: ctx.accounts.user_base_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[seeds],
        ),
        amount_out,
    )?;

    Ok(())
}

