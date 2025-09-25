use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Vault is paused")] 
    Paused,
    #[msg("Invalid amount")] 
    InvalidAmount,
    #[msg("Math overflow")] 
    MathOverflow,
    #[msg("Resulting shares is zero")] 
    ZeroShares,
    #[msg("Vault has no liquidity")] 
    EmptyVault,
    #[msg("Resulting assets is zero")] 
    ZeroAssetsOut,
    #[msg("Unauthorized manager")] 
    Unauthorized,
}

