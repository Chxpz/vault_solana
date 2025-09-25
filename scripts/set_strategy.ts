import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault as anchor.Program;
  const wallet = provider.wallet as anchor.Wallet;

  const baseMint = new PublicKey(process.env.BASE_MINT!);
  const authority = new PublicKey(process.env.VAULT_AUTHORITY!);
  const strategy = new PublicKey(process.env.STRATEGY!);

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), baseMint.toBuffer(), authority.toBuffer()],
    program.programId
  );

  const tx = await program.methods
    .setStrategy()
    .accounts({
      manager: wallet.publicKey,
      vault: vaultPda,
      strategy,
    })
    .rpc();

  console.log("tx:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

