import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import type { Wallet as AnchorWallet } from "@coral-xyz/anchor/dist/cjs/provider.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idlJson from "../tokenized_vault.json";
import { PROGRAM_ID, DEFAULT_RPC } from "../config";

export type AnchorEnv = {
  connection: Connection;
  provider: AnchorProvider;
  program: Program<Idl>;
  programId: PublicKey;
};

export function createAnchorEnv(walletCtx: WalletContextState, rpcUrl?: string): AnchorEnv {
  const connection = new Connection(rpcUrl ?? DEFAULT_RPC, {
    commitment: "confirmed",
  });
  const anchorWallet: AnchorWallet = {
    publicKey: walletCtx.publicKey ?? new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx) => {
      if (!walletCtx.signTransaction) throw new Error("Wallet not connected");
      return walletCtx.signTransaction(tx);
    },
    signAllTransactions: async (txs) => {
      if (!walletCtx.signAllTransactions) throw new Error("Wallet not connected");
      return walletCtx.signAllTransactions(txs);
    },
  };
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: "confirmed",
  });
  const programId = new PublicKey(PROGRAM_ID);
  const idl = idlJson as Idl & { address?: string };
  if (!idl.address) idl.address = PROGRAM_ID;
  const program = new Program(idl as Idl, provider);
  return { connection, provider, program, programId };
}


