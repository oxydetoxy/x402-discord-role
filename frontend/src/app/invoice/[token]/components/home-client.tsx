"use client";

import WalletButton from "@/components/wallet-button";
import { Channel, Invoice, Server, User } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { useAccount, useBalance, useWalletClient } from "wagmi";
import axios, { AxiosError } from "axios";
import { withPaymentInterceptor } from "x402-axios";
import { useRouter } from "next/navigation";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const baseClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

function HomeClient({
  invoice,
  user,
  server,
}: {
  invoice: Invoice;
  user: User;
  server: Server & { channels: Channel[] };
}) {
  const channel = server.channels.find(
    (channel) => channel.roleId === invoice.roleId
  );
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  });
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);

  const paymentAmount =
    (Number(channel?.costInUsdc) * invoice.roleApplicableTime) / 86400;

  const handlePay = async () => {
    setLoading(true);
    if (!baseURL) {
      toast.error("Base URL is not set");
      return;
    }

    if (!address || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if ((balance?.value || BigInt(0)) < BigInt(paymentAmount)) {
      toast.error(
        `You do not have enough USDC to purchase the role. You need ${paymentAmount} USDC to purchase the role.`
      );
      return;
    }

    setLoading(true);
    try {
      const endpointPath = "/api/user/access";
      // @ts-expect-error - walletClient is not typed
      const api = withPaymentInterceptor(baseClient, walletClient);

      await api.post(endpointPath, {
        discordId: user.discordId,
        networkId: "d243fc84-5d8a-40a3-9241-53413184fa20",
        serverId: server.serverId,
        channelId: channel?.channelId,
        roleApplicableTime: invoice.roleApplicableTime,
        token: invoice.token,
      });
      toast.success("Access granted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof AxiosError
          ? error.status === 429
            ? "You are being rate limited. Please try again later."
            : (error.response?.data as { error: string }).error
          : "Failed to grant access"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Wallet Connect */}
        <div className="mb-6 flex justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Buy Discord Role
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Unlock premium features with Web3
            </p>
          </div>
          <WalletButton />
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Role Badge Section */}
          <div
            className="relative p-8 sm:p-12 text-center"
            style={{
              background: `linear-gradient(135deg, #5865F215 0%, #5865F205 100%)`,
            }}
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 shadow-lg"
              style={{ backgroundColor: "#5865F2" }}
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
          </div>

          <div className="p-6 sm:p-8">
            {/* Wallet Info */}
            {isConnected && address && (
              <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
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
                        {parseFloat(formatUnits(balance.value, 6)).toFixed(4)}{" "}
                        USDC
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="mb-8 p-6 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                      {paymentAmount / 1000000} USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="space-y-3">
              {!isConnected ? (
                <p className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-base sm:text-lg">
                  Connect Wallet to Purchase
                </p>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={
                    loading ||
                    (balance?.value || BigInt(0)) < BigInt(paymentAmount)
                  }
                  className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-base sm:text-lg"
                >
                  {loading ? "Processing..." : "Purchase Role"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeClient;
