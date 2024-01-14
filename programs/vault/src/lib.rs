use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("Ay5d6Rk1vosxx6ZwfJF9USETbGVuY6eJvo3rZWAVeE7t");

#[program]
pub mod vault {
    use super::*;

    pub fn create_vault(
        ctx: Context<CreateVault>,
        name: String,
        description: String,
    ) -> ProgramResult {
        let vault = &mut ctx.accounts.vault;
        vault.name = name;
        vault.description = description;
        vault.balance = 0;
        vault.owner = *ctx.accounts.user.key;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(init, payer = user, space = 9000, seeds=[b"vault".as_ref(), user.key.as_ref()], bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Vault {
    pub name: String,
    pub description: String,
    pub balance: u64,
    pub owner: Pubkey,
}
