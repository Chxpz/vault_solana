"use client";
import { useParams } from "next/navigation";
import { useAnchor } from "../../../hooks/useAnchor";
import { useQuery } from "@tanstack/react-query";
import { useVaults, fetchVaultStats } from "../../../hooks/useVaults";
import { useMemo, useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export default function VaultDetail() {
  const params = useParams<{ vault: string }>();
  const vaultPk = params.vault;
  const { connection, program, provider } = useAnchor();
  const { data: vaults } = useVaults();
  const v = vaults?.find((x) => x.pubkey === vaultPk);

  const { data: stats } = useQuery({
    queryKey: ["vault-stats", vaultPk],
    queryFn: async () => {
      if (!v) return null;
      return fetchVaultStats(connection, v);
    },
    enabled: !!v,
  });

  const [depAmount, setDepAmount] = useState("");
  const [wdAmount, setWdAmount] = useState("");

  const depPreview = useMemo(() => {
    if (!stats) return "-";
    const amount = Number(depAmount || 0);
    if (!amount) return "-";
    if (stats.totalShares === BigInt(0) || stats.totalAssets === BigInt(0)) return amount.toString();
    const shares = (amount * (Number(stats.totalShares) / 10 ** stats.shareDecimals)) / (Number(stats.totalAssets) / 10 ** stats.assetDecimals);
    return shares.toFixed(6);
  }, [depAmount, stats]);

  const wdPreview = useMemo(() => {
    if (!stats) return "-";
    const shares = Number(wdAmount || 0);
    if (!shares) return "-";
    if (stats.totalShares === BigInt(0) || stats.totalAssets === BigInt(0)) return "0";
    const assets = (shares * (Number(stats.totalAssets) / 10 ** stats.assetDecimals)) / (Number(stats.totalShares) / 10 ** stats.shareDecimals);
    return assets.toFixed(6);
  }, [wdAmount, stats]);

  async function onDeposit() {
    if (!v || !stats) return;
    const amountUi = Number(depAmount || 0);
    const amount = BigInt(Math.floor(amountUi * 10 ** stats.assetDecimals));
    const user = provider.wallet.publicKey as PublicKey;
    const baseMint = new PublicKey(v.baseMint);
    const shareMint = new PublicKey(v.shareMint);
    const vault = new PublicKey(v.pubkey);
    const custody = new PublicKey(v.custody);
    const userBaseAta = getAssociatedTokenAddressSync(baseMint, user);
    const userShareAta = getAssociatedTokenAddressSync(shareMint, user);
    await program.methods
      .deposit(new BN(amount.toString()))
      .accounts({
        user,
        vault,
        baseMint,
        shareMint,
        vaultCustody: custody,
        userBaseAta,
        userShareAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      })
      .rpc();
  }

  async function onWithdraw() {
    if (!v || !stats) return;
    const sharesUi = Number(wdAmount || 0);
    const shares = BigInt(Math.floor(sharesUi * 10 ** stats.shareDecimals));
    const user = provider.wallet.publicKey as PublicKey;
    const baseMint = new PublicKey(v.baseMint);
    const shareMint = new PublicKey(v.shareMint);
    const vault = new PublicKey(v.pubkey);
    const custody = new PublicKey(v.custody);
    const userShareAta = getAssociatedTokenAddressSync(shareMint, user);
    const userBaseAta = getAssociatedTokenAddressSync(baseMint, user);
    await program.methods
      .withdraw(new BN(shares.toString()))
      .accounts({
        user,
        vault,
        baseMint,
        shareMint,
        vaultCustody: custody,
        userShareAta,
        userBaseAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      })
      .rpc();
  }

  if (!v) return <div>Vault not found</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Vault {v.pubkey.slice(0, 4)}…{v.pubkey.slice(-4)}</h1>
        <div className="text-sm text-black/70">Strategy: {v.strategy.slice(0, 4)}…{v.strategy.slice(-4)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="TVL" value={stats ? (Number(stats.totalAssets) / 10 ** stats.assetDecimals).toLocaleString() : "-"} />
        <Stat title="Price / Share" value={stats ? stats.price.toFixed(6) : "-"} />
        <Stat title="Status" value={v.paused ? "Paused" : "Active"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="font-medium">Deposit</h2>
          <input value={depAmount} onChange={(e) => setDepAmount(e.target.value)} placeholder="Amount" className="w-full border rounded px-3 py-2" />
          <div className="text-sm text-black/70">You’ll receive: {depPreview} shares</div>
          <button onClick={onDeposit} className="px-4 py-2 bg-black text-white rounded">Deposit</button>
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="font-medium">Withdraw</h2>
          <input value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} placeholder="Shares" className="w-full border rounded px-3 py-2" />
          <div className="text-sm text-black/70">You’ll receive: {wdPreview} assets</div>
          <button onClick={onWithdraw} className="px-4 py-2 bg-black text-white rounded">Withdraw</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-xs text-black/60">{title}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}


