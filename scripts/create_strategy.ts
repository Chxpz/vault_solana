import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault as anchor.Program;
  const wallet = provider.wallet as anchor.Wallet;

  const programIdTarget = new PublicKey(process.env.TARGET_PROGRAM_ID!);
  const meta = new PublicKey(process.env.META_PDA ?? anchor.web3.PublicKey.default.toBase58());
  const kind = Number(process.env.STRATEGY_KIND ?? 0);

  const [strategyPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("strategy"),
      wallet.publicKey.toBuffer(),
      programIdTarget.toBuffer(),
      meta.toBuffer(),
      Buffer.from([kind & 0xff]),
    ],
    program.programId
  );

  const tx = await program.methods
    .createStrategy(kind)
    .accounts({
      authority: wallet.publicKey,
      strategy: strategyPda,
      programIdTarget,
      meta,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("strategy:", strategyPda.toBase58());
  console.log("tx:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

