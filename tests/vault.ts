import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";



describe("Tests for the vault program", () => {

  const provider = anchor.getProvider()
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;

  const [vaultPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), provider.publicKey.toBuffer()],
    program.programId
  );

  const BN = (n: any) => new anchor.BN(n);

  it("Should create a vault", async () => {
    const name = "test vault";
    const description = "test description";

    await program.methods.createVault(name, description)
      .accounts({
        vault: vaultPDA,
        user: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPDA);
    assert.equal(vaultAccount.name, name);
    assert.equal(vaultAccount.description, description);
    expect(vaultAccount.owner).to.eql(provider.publicKey);
    expect(vaultAccount.balance.toString()).to.eql("0");

  });

  it("Should deposit into a vault", async () => {
    const [vaultPDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), provider.publicKey.toBuffer()],
      program.programId
    );

    const amount = BN(100);

    await program.methods.depositSol(amount)
      .accounts({
        vault: vaultPDA,
        user: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPDA);
    assert.equal(vaultAccount.balance.toString(), amount.toString());
  });
});
