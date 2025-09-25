use anchor_lang::prelude::*;

use crate::state::Strategy;

#[derive(Accounts)]
#[instruction(kind: u8)]
pub struct CreateStrategy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"strategy", authority.key().as_ref(), program_id_target.key().as_ref(), meta.key().as_ref(), &[kind]],
        bump,
        space = 8 + Strategy::SPACE,
    )]
    pub strategy: Account<'info, Strategy>,
    /// DeFi program id this strategy integrates with
    /// CHECK: stored for reference and CPI allowlist at higher layers
    pub program_id_target: UncheckedAccount<'info>,
    /// Optional meta account (e.g., market/reserve pool)
    /// CHECK: stored only
    pub meta: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_strategy(
    ctx: Context<CreateStrategy>,
    kind: u8,
) -> Result<()> {
    let strat = &mut ctx.accounts.strategy;
    strat.authority = ctx.accounts.authority.key();
    strat.program_id = ctx.accounts.program_id_target.key();
    strat.meta = ctx.accounts.meta.key();
    strat.kind = kind;
    strat.bump = ctx.bumps.strategy;
    Ok(())
}

