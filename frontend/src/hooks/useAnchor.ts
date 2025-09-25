"use client";
import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createAnchorEnv } from "../lib/anchorClient";

export function useAnchor() {
  const wallet = useWallet();
  return useMemo(() => {
    return createAnchorEnv(wallet);
  }, [wallet]);
}


