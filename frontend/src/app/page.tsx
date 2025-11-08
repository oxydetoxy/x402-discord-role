"use client";

import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const {
    sendTransaction,
    data: hash,
    isPending,
    error,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [paymentAddress] = useState(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  ); // Replace with your payment address

  // Role purchase data - you can replace this with actual data from props or API
  const roleData = useMemo(() => {
    return {
      roleName: "Premium Member",
      roleDescription:
        "Unlock exclusive channels, special permissions, and premium features",
      roleColor: "#5865F2", // Discord blurple
      price: 0.027, // ETH amount
      usdPrice: 81.0, // USD equivalent
      features: [
        "Access to exclusive channels",
        "Special role badge",
        "Priority support",
        "Early access to new features",
      ],
    };
  }, []);

  const handlePay = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!address) {
      alert("Wallet not connected");
      return;
    }

    try {
      sendTransaction({
        to: paymentAddress as `0x${string}`,
        value: parseEther(roleData.price.toString()),
      });
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Wallet Connect */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Buy Discord Role
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Unlock premium features with Web3
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Role Badge Section */}
          <div
            className="relative p-8 sm:p-12 text-center"
            style={{
              background: `linear-gradient(135deg, ${roleData.roleColor}15 0%, ${roleData.roleColor}05 100%)`,
            }}
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 shadow-lg"
              style={{ backgroundColor: roleData.roleColor }}
            >
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {roleData.roleName}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {roleData.roleDescription}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Wallet Info */}
            {isConnected && address && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Connected Wallet
                    </p>
                    <p className="text-xs sm:text-sm font-mono text-gray-900 dark:text-white truncate">
                      {address}
                    </p>
                  </div>
                  {balance && (
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                        Balance
                      </p>
                      <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                        {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-4 tracking-wide">
                What&apos;s Included
              </h3>
              <div className="space-y-3">
                {roleData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <svg
                      className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                      {roleData.price} ETH
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400">
                      ≈ ${roleData.usdPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Status */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                      Transaction Failed
                    </p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80">
                      {error.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                      Role Purchased Successfully! 🎉
                    </p>
                    {hash && (
                      <a
                        href={`https://sepolia-explorer.base.org/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 dark:text-green-300 underline hover:no-underline break-all"
                      >
                        View Transaction: {hash.slice(0, 20)}...
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <div className="space-y-3">
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-base sm:text-lg"
                    >
                      Connect Wallet to Purchase
                    </button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-base sm:text-lg"
                >
                  {isPending
                    ? "Confirm in Wallet..."
                    : isConfirming
                    ? "Processing Transaction..."
                    : `Purchase Role - ${roleData.price} ETH`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
