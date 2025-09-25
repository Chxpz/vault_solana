import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault as anchor.Program;

  const wallet = provider.wallet as anchor.Wallet;

  const baseMint = new PublicKey(process.env.BASE_MINT!);
  const shareDecimals = Number(process.env.SHARE_DECIMALS ?? 6);
  const strategy = new PublicKey(process.env.STRATEGY!);

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), baseMint.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  );

  const shareMintKeypair = anchor.web3.Keypair.generate();
  const vaultCustody = getAssociatedTokenAddressSync(baseMint, vaultPda, true);

  const tx = await program.methods
    .initializeVault(shareDecimals)
    .accounts({
      authority: wallet.publicKey,
      vault: vaultPda,
      baseMint,
      shareMint: shareMintKeypair.publicKey,
      vaultCustody,
      strategy,
      systemProgram: SystemProgram.programId,
    })
    .signers([shareMintKeypair])
    .rpc();

  console.log("vault:", vaultPda.toBase58());
  console.log("shareMint:", shareMintKeypair.publicKey.toBase58());
  console.log("vaultCustody:", vaultCustody.toBase58());
  console.log("tx:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

