use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::errors::VaultError;
use crate::state::{Strategy, Vault};

#[derive(Accounts)]
pub struct Deposit<'info> {
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
    #[account(mut, associated_token::mint = base_mint, associated_token::authority = user)]
    pub user_base_ata: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = share_mint, associated_token::authority = user)]
    pub user_share_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(!ctx.accounts.vault.paused, VaultError::Paused);
    require!(amount > 0, VaultError::InvalidAmount);

    let total_shares: u128 = ctx.accounts.share_mint.supply as u128;
    let total_assets: u128 = ctx.accounts.vault_custody.amount as u128;
    let amount_u128: u128 = amount as u128;

    let shares_to_mint: u64 = if total_shares == 0 || total_assets == 0 {
        amount
    } else {
        ((amount_u128 * total_shares) / total_assets)
            .try_into()
            .map_err(|_| error!(VaultError::MathOverflow))?
    };
    require!(shares_to_mint > 0, VaultError::ZeroShares);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_base_ata.to_account_info(),
                to: ctx.accounts.vault_custody.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    let base_mint_key = ctx.accounts.base_mint.key();
    let authority_key = ctx.accounts.vault.authority;
    let bump_bytes = [ctx.accounts.vault.bump];
    let seeds: &[&[u8]] = &[b"vault", base_mint_key.as_ref(), authority_key.as_ref(), &bump_bytes];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.share_mint.to_account_info(),
                to: ctx.accounts.user_share_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[seeds],
        ),
        shares_to_mint,
    )?;

    Ok(())
}

