use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::VaultError;
use crate::state::{Strategy, Vault};

#[derive(Accounts)]
#[instruction(share_decimals: u8)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// Vault PDA as program state
    #[account(
        init,
        payer = authority,
        seeds = [b"vault", base_mint.key().as_ref(), authority.key().as_ref()],
        bump,
        space = 8 + Vault::SPACE,
    )]
    pub vault: Account<'info, Vault>,
    /// Base asset mint (e.g., USDC)
    pub base_mint: Account<'info, Mint>,
    /// Share mint created and controlled by the vault
    #[account(
        init,
        payer = authority,
        mint::decimals = share_decimals,
        mint::authority = vault,
        mint::freeze_authority = vault,
    )]
    pub share_mint: Account<'info, Mint>,
    /// Vault custody ATA for the base asset (owner = vault PDA)
    #[account(
        init,
        payer = authority,
        associated_token::mint = base_mint,
        associated_token::authority = vault,
    )]
    pub vault_custody: Account<'info, TokenAccount>,
    /// Strategy that this vault starts with
    pub strategy: Account<'info, Strategy>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_initialize_vault(
    ctx: Context<InitializeVault>,
    _share_decimals: u8,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.manager = ctx.accounts.authority.key();
    vault.base_mint = ctx.accounts.base_mint.key();
    vault.share_mint = ctx.accounts.share_mint.key();
    vault.custody = ctx.accounts.vault_custody.key();
    vault.strategy = ctx.accounts.strategy.key();
    vault.bump = ctx.bumps.vault;
    vault.paused = false;
    Ok(())
}

