import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";



describe("Tests for the vault program", () => {

  const provider = anchor.getProvider()
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;


  it("Should create a vault", async () => {
    const name = "test vault";
    const description = "test description";

    const [vaultPDA2, bump2] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), provider.publicKey.toBuffer()],
      program.programId
    );

    await program.methods.createVault(name, description)
      .accounts({
        vault: vaultPDA2,
        user: provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPDA2);
    assert.equal(vaultAccount.name, name);
    assert.equal(vaultAccount.description, description);
    expect(vaultAccount.owner).to.eql(provider.publicKey);
    expect(vaultAccount.balance.toString()).to.eql("0");

  });
});
