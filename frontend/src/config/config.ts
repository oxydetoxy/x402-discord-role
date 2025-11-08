"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia } from "viem/chains";
import { createConfig, createStorage, http } from "wagmi";

const storage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet],
    },
  ],
  {
    appName: "Discord Role Access",
    projectId: "6b160afd8d190502aae8559c94e7d799",
  }
);

export const config = createConfig({
  connectors,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
  storage,
});
