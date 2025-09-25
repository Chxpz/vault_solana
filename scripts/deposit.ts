import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.tokenizedVault as anchor.Program;
  const wallet = provider.wallet as anchor.Wallet;

  const baseMint = new PublicKey(process.env.BASE_MINT!);
  const shareMint = new PublicKey(process.env.SHARE_MINT!);
  const authority = new PublicKey(process.env.VAULT_AUTHORITY!);

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), baseMint.toBuffer(), authority.toBuffer()],
    program.programId
  );

  const vaultCustody = getAssociatedTokenAddressSync(baseMint, vaultPda, true);
  const userBaseAta = getAssociatedTokenAddressSync(baseMint, wallet.publicKey);
  const userShareAta = getAssociatedTokenAddressSync(
    shareMint,
    wallet.publicKey
  );

  const amount = new anchor.BN(process.env.AMOUNT!);

  const tx = await program.methods
    .deposit(new anchor.BN(amount))
    .accounts({
      user: wallet.publicKey,
      vault: vaultPda,
      baseMint,
      shareMint,
      vaultCustody,
      userBaseAta,
      userShareAta,
    })
    .rpc();

  console.log("tx:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

