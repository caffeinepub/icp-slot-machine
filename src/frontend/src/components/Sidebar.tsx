import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock,
  Coins,
  Copy,
  Crown,
  Gift,
  Loader2,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Symbol as SlotSymbol } from "../backend";
import type { PlayerStats } from "../backend";
import { loadConfig } from "../config";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useLeaderboard,
  useMyBalance,
  usePoolBalance,
  useRecentWins,
} from "../hooks/useQueries";
import { transferICP } from "../utils/icrc2";
import { SymbolDisplay } from "./Reel";

/** Format e8s as ICP with exactly 5 decimal places, no floating-point errors */
function formatICP(e8s: bigint): string {
  const isNeg = e8s < 0n;
  const abs = isNeg ? -e8s : e8s;
  const intPart = abs / 100_000_000n;
  const fracPart = abs % 100_000_000n;
  const frac5 = fracPart.toString().padStart(8, "0").slice(0, 5);
  return `${isNeg ? "-" : ""}${intPart}.${frac5}`;
}

function shortPrincipal(p: Principal): string {
  const str = p.toString();
  return `${str.slice(0, 5)}...${str.slice(-3)}`;
}

const SKELETON_ROWS_4 = ["a", "b", "c", "d"];
const SKELETON_ROWS_3 = ["a", "b", "c"];
const ICP_FEE_E8S = BigInt(10_000);

function ReelMini({ symbols }: { symbols: SlotSymbol[] }) {
  return (
    <div className="flex gap-0.5">
      {symbols.slice(0, 3).map((s, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: symbol positions are stable display order
        <span key={i} className="text-base leading-none">
          <SymbolDisplay symbol={s} />
        </span>
      ))}
    </div>
  );
}

function DepositAddressCard() {
  const { identity } = useInternetIdentity();
  const [copied, setCopied] = useState(false);

  if (!identity) return null;

  const principal = identity.getPrincipal().toString();

  function handleCopy() {
    navigator.clipboard.writeText(principal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied!");
    });
  }

  return (
    <div
      className="casino-card p-5 shadow-card border-amber-500/30"
      data-ocid="deposit.card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-4 w-4 text-amber-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Deposit Address
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        Send ICP from your{" "}
        <span className="text-amber-300 font-semibold">NNS Wallet</span> to this
        address. Each app gets its own Principal ID — this one is exclusively
        for SpinLuxe.
      </p>

      <div className="rounded-lg bg-black/40 border border-amber-500/20 p-3 mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
          Your Principal ID
        </p>
        <p
          className="font-mono text-[11px] text-amber-200 break-all leading-relaxed"
          data-ocid="deposit.panel"
        >
          {principal}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        data-ocid="deposit.button"
        className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 gap-2 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy Address
          </>
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground/60 mt-2.5 text-center">
        In NNS: "Send" → choose Principal format
      </p>
    </div>
  );
}

function DonateDialog() {
  const { identity } = useInternetIdentity();
  const balanceQuery = useMyBalance();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const balanceE8s = balanceQuery.data ?? BigInt(0);
  const amountFloat = Number.parseFloat(amount);
  const amountE8s =
    Number.isFinite(amountFloat) && amountFloat > 0
      ? BigInt(Math.floor(amountFloat * 100_000_000))
      : BigInt(0);
  const totalNeeded = amountE8s + ICP_FEE_E8S;
  const isValid = amountE8s > BigInt(0) && totalNeeded <= balanceE8s;

  async function handleDonate() {
    if (!identity || !isValid) return;
    setIsSending(true);
    try {
      const config = await loadConfig();
      await transferICP(
        identity,
        config.backend_canister_id,
        amountE8s,
        config.backend_host,
      );
      queryClient.invalidateQueries({ queryKey: ["poolBalance"] });
      queryClient.invalidateQueries({
        queryKey: ["myBalance", identity.getPrincipal().toString()],
      });
      toast.success(
        `${formatICP(amountE8s)} ICP successfully added to the pool!`,
      );
      setAmount("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  }

  if (!identity) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ocid="sidebar.open_modal_button"
          className="w-full mt-3 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold gap-2"
        >
          <Gift className="h-3.5 w-3.5" />
          Fund Pool
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="sidebar.dialog"
        className="bg-casino-bg2 border-gold/30 text-foreground"
      >
        <DialogHeader>
          <DialogTitle className="text-gold font-brand text-lg">
            Fund Pool
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send any amount of ICP directly into the Casino Pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/20">
            <Coins className="h-4 w-4 text-gold shrink-0" />
            <span className="text-sm text-muted-foreground">Your Balance:</span>
            {balanceQuery.isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold/60" />
            ) : (
              <span className="text-sm font-bold text-gold tabular-nums">
                {formatICP(balanceE8s)} ICP
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="donate-amount"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Amount in ICP
            </Label>
            <Input
              id="donate-amount"
              data-ocid="sidebar.input"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 1.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-accent/20 border-gold/20 text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50"
            />
            {amount && !isValid && amountE8s > BigInt(0) && (
              <p
                data-ocid="sidebar.error_state"
                className="text-xs text-red-400"
              >
                Insufficient ICP. Available: {formatICP(balanceE8s)} ICP (incl.{" "}
                {formatICP(ICP_FEE_E8S)} fee)
              </p>
            )}
            {amount && amountE8s > BigInt(0) && isValid && (
              <p className="text-xs text-muted-foreground">
                + {formatICP(ICP_FEE_E8S)} ICP network fee
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="sidebar.cancel_button"
            className="border-gold/20 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDonate}
            disabled={!isValid || isSending}
            data-ocid="sidebar.confirm_button"
            className="spin-button text-background font-bold"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Sending...
              </>
            ) : (
              "Send Now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Sidebar() {
  const poolQuery = usePoolBalance();
  const winsQuery = useRecentWins();
  const leaderboardQuery = useLeaderboard();

  return (
    <div className="flex flex-col gap-4">
      <DepositAddressCard />

      {/* Pool Balance Card */}
      <div className="casino-card p-5 shadow-card" data-ocid="sidebar.card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-gold" />
          <p className="text-xs font-bold uppercase tracking-widest text-gold">
            ICP Pool Balance
          </p>
        </div>
        <div className="text-center py-4">
          {poolQuery.isLoading ? (
            <div
              data-ocid="sidebar.loading_state"
              className="h-10 w-32 mx-auto rounded-lg bg-accent/50 animate-pulse"
            />
          ) : (
            <>
              <p className="font-brand text-3xl font-black text-gold glow-gold">
                {formatICP(poolQuery.data ?? BigInt(0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">ICP in Pool</p>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="text-center p-2 rounded-lg bg-accent/30">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Status
            </p>
            <p className="text-xs font-bold text-neon-green mt-0.5">● Live</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/30">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Network
            </p>
            <p className="text-xs font-bold text-neon-cyan mt-0.5">ICP</p>
          </div>
        </div>
        <DonateDialog />
      </div>

      {/* Recent Wins */}
      <div className="casino-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-gold" />
          <p className="text-xs font-bold uppercase tracking-widest text-gold">
            Recent Wins
          </p>
        </div>

        {winsQuery.isLoading ? (
          <div className="space-y-2">
            {SKELETON_ROWS_4.map((k) => (
              <div
                key={k}
                className="h-10 rounded-lg bg-accent/50 animate-pulse"
              />
            ))}
          </div>
        ) : !winsQuery.data || winsQuery.data.length === 0 ? (
          <div data-ocid="sidebar.empty_state" className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No wins yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Be the first!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-1.5 pr-2">
              {winsQuery.data.slice(0, 10).map((win, i) => (
                <div
                  key={win.timestamp.toString()}
                  data-ocid={`sidebar.item.${i + 1}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="scale-75 origin-left">
                      <ReelMini symbols={win.reels as SlotSymbol[]} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gold">
                    +{formatICP(win.payout)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Leaderboard */}
      <div className="casino-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-gold" />
          <p className="text-xs font-bold uppercase tracking-widest text-gold">
            Leaderboard
          </p>
        </div>

        {leaderboardQuery.isLoading ? (
          <div className="space-y-2">
            {SKELETON_ROWS_3.map((k) => (
              <div
                key={k}
                className="h-10 rounded-lg bg-accent/50 animate-pulse"
              />
            ))}
          </div>
        ) : !leaderboardQuery.data || leaderboardQuery.data.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No entries yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {(leaderboardQuery.data as Array<[Principal, PlayerStats]>)
              .slice(0, 5)
              .map(([principal, stats], i) => (
                <div
                  key={principal.toString()}
                  data-ocid={`sidebar.row.${i + 1}`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-accent/20"
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      i === 0
                        ? "bg-gold text-background"
                        : i === 1
                          ? "bg-muted-foreground/60 text-background"
                          : i === 2
                            ? "bg-neon-red/60 text-background"
                            : "bg-accent text-muted-foreground"
                    }`}
                  >
                    {i === 0 ? <Crown className="h-3 w-3" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground truncate">
                      {shortPrincipal(principal)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {stats.totalSpins.toString()} Spins
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gold shrink-0">
                    {formatICP(stats.totalWon)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
