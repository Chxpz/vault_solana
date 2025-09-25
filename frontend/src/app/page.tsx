"use client";
import Link from "next/link";
import { useVaults } from "../hooks/useVaults";
import { useAnchor } from "../hooks/useAnchor";
import { useQuery } from "@tanstack/react-query";
import { fetchVaultStats } from "../hooks/useVaults";

export default function Home() {
  // const { connection } = useAnchor();
  const { data: vaults, isLoading } = useVaults();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vaults</h1>
      {isLoading && <div>Loading vaults...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vaults?.map((v) => (
          <VaultCard key={v.pubkey} vaultPubkey={v.pubkey} />
        ))}
      </div>
    </div>
  );
}

function VaultCard({ vaultPubkey }: { vaultPubkey: string }) {
  const { data: vault } = useVaults();
  const { connection } = useAnchor();
  const item = vault?.find((x) => x.pubkey === vaultPubkey);

  const { data: stats } = useQuery({
    queryKey: ["vault-stats", vaultPubkey],
    queryFn: async () => {
      if (!item) return null;
      return fetchVaultStats(connection, item);
    },
    enabled: !!item,
  });

  if (!item) return null;
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <div className="font-medium">{item.pubkey.slice(0, 4)}…{item.pubkey.slice(-4)}</div>
        <span className="text-xs px-2 py-0.5 rounded bg-black/5">{item.paused ? "Paused" : "Active"}</span>
      </div>
      <div className="text-sm text-black/70">Base: {item.baseMint.slice(0, 4)}…{item.baseMint.slice(-4)}</div>
      <div className="text-sm">TVL: {stats ? (Number(stats.totalAssets) / 10 ** stats.assetDecimals).toLocaleString() : "-"}</div>
      <div className="text-sm">Price / Share: {stats ? stats.price.toFixed(6) : "-"}</div>
      <Link className="inline-block text-blue-600 hover:underline text-sm" href={`/vault/${item.pubkey}`}>Invest →</Link>
    </div>
  );
}
