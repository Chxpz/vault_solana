use anchor_lang::prelude::*;

use crate::errors::VaultError;
use crate::state::{Strategy, Vault};

#[derive(Accounts)]
pub struct SetStrategy<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(mut, has_one = manager)]
    pub vault: Account<'info, Vault>,
    pub strategy: Account<'info, Strategy>,
}

pub fn handle_set_strategy(ctx: Context<SetStrategy>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    // has_one enforces manager == signer; update strategy
    vault.strategy = ctx.accounts.strategy.key();
    Ok(())
}

