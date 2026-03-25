import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Coins,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyBalance } from "../hooks/useQueries";
import WithdrawDialog from "./WithdrawDialog";

/** Format e8s as ICP with exactly 5 decimal places, no floating-point errors */
function formatICP(e8s: bigint): string {
  const isNeg = e8s < 0n;
  const abs = isNeg ? -e8s : e8s;
  const intPart = abs / 100_000_000n;
  const fracPart = abs % 100_000_000n;
  const frac5 = fracPart.toString().padStart(8, "0").slice(0, 5);
  return `${isNeg ? "-" : ""}${intPart}.${frac5}`;
}

export default function Header() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const balanceQuery = useMyBalance();
  const queryClient = useQueryClient();
  const isLoggedIn = !!identity;
  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : null;
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  function handleRefreshBalance() {
    queryClient.invalidateQueries({
      queryKey: ["myBalance", identity?.getPrincipal().toString()],
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/20 bg-casino-bg2/95 backdrop-blur-md">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-gold" />
          <span className="font-brand text-xl font-bold tracking-[0.15em] text-gold glow-gold uppercase">
            SpinLuxe
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {["Home", "Slots", "Leaderboard"].map((item) => (
            <span
              key={item}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors cursor-pointer"
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {/* ICP Balance */}
              <div
                data-ocid="header.card"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20"
              >
                <Coins className="h-3.5 w-3.5 text-gold" />
                {balanceQuery.isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-gold/60" />
                ) : balanceQuery.isError ? (
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </span>
                ) : (
                  <span className="text-xs font-bold text-gold tabular-nums">
                    {formatICP(balanceQuery.data ?? BigInt(0))} ICP
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRefreshBalance}
                  disabled={balanceQuery.isFetching}
                  className="ml-1 text-gold/50 hover:text-gold transition-colors disabled:opacity-30"
                  title="Refresh balance"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      balanceQuery.isFetching ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
              {/* Principal */}
              <span className="hidden lg:block text-xs text-muted-foreground font-mono">
                {principalShort}
              </span>
              {/* Withdraw Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawOpen(true)}
                data-ocid="header.open_modal_button"
                className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold gap-1.5"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Withdraw</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clear}
                data-ocid="header.close_button"
                className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold-light gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <WithdrawDialog
                open={withdrawOpen}
                onOpenChange={setWithdrawOpen}
                balance={balanceQuery.data ?? BigInt(0)}
                identity={identity}
                onSuccess={handleRefreshBalance}
              />
            </div>
          ) : (
            <Button
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="header.primary_button"
              className="spin-button text-xs font-bold uppercase tracking-widest px-4 text-background"
            >
              {isLoggingIn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <InfinityIcon className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">
                {isLoggingIn ? "Connecting..." : "Login"}
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </header>
  );
}
