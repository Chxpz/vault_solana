use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub authority: Pubkey,      // creator / governance authority
    pub manager: Pubkey,        // manager allowed to rebalance/set strategy
    pub base_mint: Pubkey,
    pub share_mint: Pubkey,
    pub custody: Pubkey,
    pub strategy: Pubkey,       // current strategy PDA
    pub bump: u8,
    pub paused: bool,
}

impl Vault {
    pub const SPACE: usize = 32 + 32 + 32 + 32 + 32 + 32 + 1 + 1;
}

#[account]
pub struct Strategy {
    pub authority: Pubkey,    // who can update this strategy definition
    pub program_id: Pubkey,   // target DeFi program id
    pub meta: Pubkey,         // optional PDA/meta account of the target
    pub kind: u8,             // enum-like discriminator for client UX
    pub bump: u8,
}

impl Strategy {
    pub const SPACE: usize = 32 + 32 + 32 + 1 + 1;
}

