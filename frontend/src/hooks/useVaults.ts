"use client";
import { useQuery } from "@tanstack/react-query";
import { useAnchor } from "./useAnchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";

export type VaultAccount = {
  pubkey: string;
  authority: string;
  manager: string;
  baseMint: string;
  shareMint: string;
  custody: string;
  strategy: string;
  bump: number;
  paused: boolean;
};

export function useVaults() {
  const { program } = useAnchor();

  return useQuery({
    queryKey: ["vaults"],
    queryFn: async () => {
      type VaultRaw = {
        publicKey: PublicKey;
        account: {
          authority: PublicKey;
          manager: PublicKey;
          baseMint: PublicKey;
          shareMint: PublicKey;
          custody: PublicKey;
          strategy: PublicKey;
          bump: number;
          paused: boolean;
        };
      };
      const vaultNs = (program.account as Record<string, { all: () => Promise<VaultRaw[]> }>)[
        "vault"
      ];
      const accounts = await vaultNs.all();
      const mapped: VaultAccount[] = accounts.map((a) => ({
        pubkey: a.publicKey.toBase58(),
        authority: a.account.authority.toBase58(),
        manager: a.account.manager.toBase58(),
        baseMint: a.account.baseMint.toBase58(),
        shareMint: a.account.shareMint.toBase58(),
        custody: a.account.custody.toBase58(),
        strategy: a.account.strategy.toBase58(),
        bump: a.account.bump,
        paused: a.account.paused,
      }));
      return mapped;
    },
  });
}

export async function fetchVaultStats(connection: Connection, vault: VaultAccount) {
  const shareMintPk = new PublicKey(vault.shareMint);
  const custodyPk = new PublicKey(vault.custody);

  const shareMintInfo = await getMint(connection, shareMintPk);
  const shareDecimals = shareMintInfo.decimals;
  const totalShares = shareMintInfo.supply;

  const custodyInfo = await getAccount(connection, custodyPk);
  const baseMintPk = custodyInfo.mint;
  const baseMintInfo = await getMint(connection, baseMintPk);
  const assetDec = baseMintInfo.decimals;
  const totalAssets = custodyInfo.amount;

  const price = totalShares === BigInt(0) || totalAssets === BigInt(0)
    ? 1
    : Number(totalAssets) / 10 ** assetDec / (Number(totalShares) / 10 ** shareDecimals);

  return { totalShares, totalAssets, assetDecimals: assetDec, shareDecimals, price };
}


