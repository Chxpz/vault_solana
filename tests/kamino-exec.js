const anchor = require("@coral-xyz/anchor");
const { PublicKey, ComputeBudgetProgram } = require("@solana/web3.js");
const { getAssociatedTokenAddressSync, createMint } = require("@solana/spl-token");

describe("kamino_exec adapter (generic CPI)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault;

  it("invokes ComputeBudget via kamino_exec with strategy allowlist", async () => {
    // Use ComputeBudget as a stand-in target (no accounts/signers required)
    const targetProgram = new PublicKey("ComputeBudget111111111111111111111111111111");
    const kind = 3;
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

    // Init a minimal vault to satisfy accounts (base mint local)
    const baseMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), baseMint.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    const shareMint = anchor.web3.Keypair.generate();
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
      })
      .signers([shareMint])
      .rpc();

    // Build a ComputeBudget instruction (no accounts)
    const ix = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });

    // Call kamino_exec with data and target program, no remaining accounts
    await program.methods
      .kaminoExec(Buffer.from(ix.data))
      .accounts({
        manager: provider.wallet.publicKey,
        vault: vaultPda,
        strategy: strategyPda,
        kaminoProgram: targetProgram,
        vaultCustody,
      })
      .remainingAccounts(ix.keys.map(k => ({ pubkey: k.pubkey, isWritable: k.isWritable, isSigner: k.isSigner })))
      .rpc();
  });
});

