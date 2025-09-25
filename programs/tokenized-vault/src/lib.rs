use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HVbaZivsgTAgB11NMNrfEvPMmvnVfdSA2XzaHaCTjq3g");

#[program]
pub mod tokenized_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, share_decimals: u8) -> Result<()> {
        handle_initialize_vault(ctx, share_decimals)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        handle_deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        handle_withdraw(ctx, shares)
    }

    pub fn create_strategy(ctx: Context<CreateStrategy>, kind: u8) -> Result<()> {
        handle_create_strategy(ctx, kind)
    }

    pub fn set_strategy(ctx: Context<SetStrategy>) -> Result<()> {
        handle_set_strategy(ctx)
    }

    pub fn kamino_exec(ctx: Context<KaminoExec>, data: Vec<u8>) -> Result<()> {
        handle_kamino_exec(ctx, data)
    }
    
}
