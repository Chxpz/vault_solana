const anchor = require("@coral-xyz/anchor");
const { Keypair, PublicKey, SystemProgram } = require("@solana/web3.js");
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
} = require("@solana/spl-token");
const { expect } = require("chai");

describe("tokenized-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault;

  it("create strategy, initialize vault with strategy, deposit, withdraw", async () => {
    // Create a local base mint (decimals 6)
    const baseMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6
    );

    // Create a simple strategy pointing to a placeholder program/meta
    const kind = 2; // ensure PDA doesn't collide with e2e test
    const targetProgram = new PublicKey("11111111111111111111111111111111");
    const meta = new PublicKey("11111111111111111111111111111111");
    const [strategyPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("strategy"),
        provider.wallet.publicKey.toBuffer(),
        targetProgram.toBuffer(),
        meta.toBuffer(),
        Buffer.from([kind]),
      ],
      program.programId
    );

    await program.methods
      .createStrategy(kind)
      .accounts({
        authority: provider.wallet.publicKey,
        strategy: strategyPda,
        programIdTarget: targetProgram,
        meta,
      })
      .rpc();

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), baseMint.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const shareMint = Keypair.generate();
    const vaultCustody = getAssociatedTokenAddressSync(baseMint, vaultPda, true);

    await program.methods
      .initializeVault(6)
      .accounts({
        authority: provider.wallet.publicKey,
        vault: vaultPda,
        baseMint,
        shareMint: shareMint.publicKey,
        vaultCustody,
        strategy: strategyPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([shareMint])
      .rpc();

    const userBaseAtaAcc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      baseMint,
      provider.wallet.publicKey
    );
    const userShareAtaAcc = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      shareMint.publicKey,
      provider.wallet.publicKey
    );

    // Mint base tokens to user
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      baseMint,
      userBaseAtaAcc.address,
      provider.wallet.publicKey,
      1000000n
    );

    const amount = new anchor.BN(1000);
    await program.methods
      .deposit(amount)
      .accounts({
        user: provider.wallet.publicKey,
        vault: vaultPda,
        baseMint,
        shareMint: shareMint.publicKey,
        vaultCustody,
        userBaseAta: userBaseAtaAcc.address,
        userShareAta: userShareAtaAcc.address,
      })
      .rpc();

    await program.methods
      .withdraw(amount)
      .accounts({
        user: provider.wallet.publicKey,
        vault: vaultPda,
        baseMint,
        shareMint: shareMint.publicKey,
        vaultCustody,
        userShareAta: userShareAtaAcc.address,
        userBaseAta: userBaseAtaAcc.address,
      })
      .rpc();
  });
});
