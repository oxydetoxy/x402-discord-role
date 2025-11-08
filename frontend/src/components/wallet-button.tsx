"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaWallet } from "react-icons/fa";

const WalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
                height: "full",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <div className="flex items-center gap-4 h-full">
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="cursor-pointer border-2 h-[35px] border-[#22A6F0] text-[#22A6F0] text-[16px] lg:text-[20px]  bg-[#002D7E] font-medium rounded-[8px] px-2"
                    >
                      <span className="hidden sm:block">Connect Wallet</span>
                      <FaWallet className="sm:hidden" />
                    </button>
                  </div>
                );
              }
              if (chain.unsupported) {
                return (
                  <div className="flex items-center gap-4 h-full">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="cursor-pointer border-2 h-[35px] border-[#22A6F0] text-[#22A6F0] text-[16px] lg:text-[20px]  bg-[#002D7E] font-medium rounded-[8px] px-2"
                    >
                      <span className="hidden sm:block">Wrong network</span>
                      <FaWallet className="sm:hidden" />
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-start gap-2 h-full relative">
                  <button
                    className="cursor-pointer border-2 h-[35px] border-[#22A6F0] text-[#22A6F0] text-[16px] lg:text-[20px]  bg-[#002D7E] font-medium rounded-[8px] px-2"
                    onClick={openAccountModal}
                  >
                    <span className="hidden sm:block">
                      {account.address.slice(0, 4)}...
                      {account.address.slice(-4)}
                    </span>
                    <FaWallet className="sm:hidden" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
