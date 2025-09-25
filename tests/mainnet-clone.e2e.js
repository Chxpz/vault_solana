const anchor = require("@coral-xyz/anchor");
const { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const {
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const { expect } = require("chai");

describe("mainnet-clone e2e (WSOL)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault;

  it("initialize vault with strategy and deposit/withdraw WSOL", async () => {
    // Create strategy (placeholder target/meta)
    const kind = 1;
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

    const baseMint = NATIVE_MINT; // WSOL mint
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), baseMint.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    const shareMint = Keypair.generate();

    // create custody and init vault
    const vaultCustody = getAssociatedTokenAddressSync(baseMint, vaultPda, true);
    await program.methods
      .initializeVault(9)
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

    // Wrap some SOL to WSOL in user's ATA
    const user = provider.wallet.publicKey;
    const userWsolAta = getAssociatedTokenAddressSync(baseMint, user);
    const createAtaIx = createAssociatedTokenAccountInstruction(
      user,
      userWsolAta,
      user,
      baseMint
    );
    const wrapLamports = 2n * BigInt(LAMPORTS_PER_SOL);
    const txWrap = new anchor.web3.Transaction().add(
      createAtaIx,
      anchor.web3.SystemProgram.transfer({ fromPubkey: user, toPubkey: userWsolAta, lamports: Number(wrapLamports) }),
      createSyncNativeInstruction(userWsolAta)
    );
    await provider.sendAndConfirm(txWrap, []);

    const userShareAta = getAssociatedTokenAddressSync(shareMint.publicKey, user);
    // Ensure user share ATA exists
    const createUserShareAtaIx = createAssociatedTokenAccountInstruction(
      user,
      userShareAta,
      user,
      shareMint.publicKey
    );
    const amount = new anchor.BN(1_000_000_000); // 1 WSOL (9 decimals)
    const preDeposit = new anchor.web3.Transaction().add(createUserShareAtaIx);
    await provider.sendAndConfirm(preDeposit, []);

    await program.methods
      .deposit(amount)
      .accounts({
        user,
        vault: vaultPda,
        baseMint,
        shareMint: shareMint.publicKey,
        vaultCustody,
        userBaseAta: userWsolAta,
        userShareAta,
      })
      .rpc();

    await program.methods
      .withdraw(amount)
      .accounts({
        user,
        vault: vaultPda,
        baseMint,
        shareMint: shareMint.publicKey,
        vaultCustody,
        userShareAta,
        userBaseAta: userWsolAta,
      })
      .rpc();

    // Close WSOL ATA to unwrap back to SOL
    const txClose = new anchor.web3.Transaction().add(
      createCloseAccountInstruction(userWsolAta, user, user)
    );
    await provider.sendAndConfirm(txClose, []);
  });
});

