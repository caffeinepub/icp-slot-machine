import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Symbol as SlotSymbol, type SpinResult } from "../backend";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useInvalidateAfterSpin,
  useMyStats,
  usePoolBalance,
} from "../hooks/useQueries";
import { useSlotSounds } from "../hooks/useSlotSounds";
import { approveICP } from "../utils/icrc2";
import Reel from "./Reel";

const BET_OPTIONS = [
  { label: "0.01", e8s: BigInt(1_000_000) },
  { label: "0.1", e8s: BigInt(10_000_000) },
  { label: "0.5", e8s: BigInt(50_000_000) },
  { label: "1", e8s: BigInt(100_000_000) },
  { label: "2.5", e8s: BigInt(250_000_000) },
  { label: "10", e8s: BigInt(1_000_000_000) },
];

const ICP_FEE = BigInt(10_000);
const COIN_POSITIONS = [15, 33, 51, 69, 87];
const MAX_SPIN_MS = 3000;

function formatICP(e8s: bigint): string {
  return (Number(e8s) / 100_000_000).toFixed(4);
}

function getWinLabel(multiplier: bigint, reels: SlotSymbol[]): string {
  const sym = reels[1] ?? reels[0];
  const symLabel: Record<string, string> = {
    [SlotSymbol.seven]: "7 7 7",
    [SlotSymbol.bar]: "BAR BAR BAR",
    [SlotSymbol.bell]: "BELL BELL BELL",
    [SlotSymbol.cherry]: "CHERRY CHERRY CHERRY",
    [SlotSymbol.orange]: "ORANGE ORANGE ORANGE",
    [SlotSymbol.lemon]: "LEMON LEMON LEMON",
  };
  const mult = Number(multiplier) / 100;
  return `${sym ? (symLabel[sym] ?? "WIN") : "WIN"} • ${mult.toFixed(0)}×`;
}

export default function SlotMachine() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const poolBalanceQuery = usePoolBalance();
  const myStatsQuery = useMyStats();
  const invalidate = useInvalidateAfterSpin();
  const { startSpinSound, stopSpinSound, playReelStop, playWin, playLose } =
    useSlotSounds();

  const [selectedBetIdx, setSelectedBetIdx] = useState(2);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [reelResults, setReelResults] = useState<
    [SlotSymbol, SlotSymbol, SlotSymbol]
  >([SlotSymbol.cherry, SlotSymbol.cherry, SlotSymbol.cherry]);
  const [showResult, setShowResult] = useState(false);
  const [animState, setAnimState] = useState<"idle" | "win" | "lose">("idle");
  const [lastWin, setLastWin] = useState<bigint>(BigInt(0));
  const stoppedReels = useRef(0);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResultRef = useRef<SpinResult | null>(null);

  const selectedBet = BET_OPTIONS[selectedBetIdx];
  const poolBalance = poolBalanceQuery.data ?? BigInt(0);
  const canSpin =
    !spinning &&
    !!identity &&
    !!actor &&
    poolBalance > (selectedBet?.e8s ?? BigInt(0));

  const handleReelStopped = useCallback(() => {
    playReelStop();
    stoppedReels.current += 1;
    if (stoppedReels.current >= 3) {
      setTimeout(() => {
        setShowResult(true);
        if (pendingResultRef.current) {
          const r = pendingResultRef.current;
          pendingResultRef.current = null;
          if (r.won) {
            setAnimState("win");
            setLastWin(r.payout);
            playWin();
            toast.success(`You won! +${formatICP(r.payout)} ICP`);
          } else {
            setAnimState("lose");
            playLose();
          }
          setSpinResult(r);
          invalidate();
        }
        setTimeout(() => {
          setShowResult(false);
          setAnimState("idle");
        }, 2500);
      }, 100);
    }
  }, [playReelStop, playWin, playLose, invalidate]);

  async function handleSpin() {
    if (!canSpin || !identity || !actor || !selectedBet) return;
    setShowResult(false);
    setAnimState("idle");
    stoppedReels.current = 0;
    pendingResultRef.current = null;

    try {
      const config = await loadConfig();
      const backendCanisterId = config.backend_canister_id;

      setSpinning(true);
      startSpinSound();

      spinTimeoutRef.current = setTimeout(() => {
        stopSpinSound();
        setSpinning(false);
      }, MAX_SPIN_MS);

      toast.info("Requesting ICP approval...", { duration: 3000 });
      const approvalAmount = selectedBet.e8s + ICP_FEE * 2n;
      await approveICP(identity, backendCanisterId, approvalAmount);

      toast.info("Spinning...", { duration: 2000 });
      const result = await actor.spin(selectedBet.e8s);

      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }

      const r0 = (result.reels[0] ?? SlotSymbol.lemon) as SlotSymbol;
      const r1 = (result.reels[1] ?? SlotSymbol.lemon) as SlotSymbol;
      const r2 = (result.reels[2] ?? SlotSymbol.lemon) as SlotSymbol;
      setReelResults([r0, r1, r2]);
      setSpinResult(result);

      if (!spinning || stoppedReels.current >= 3) {
        if (result.won) {
          setAnimState("win");
          setLastWin(result.payout);
          playWin();
          toast.success(`You won! +${formatICP(result.payout)} ICP`);
        } else {
          setAnimState("lose");
          playLose();
        }
        invalidate();
      } else {
        pendingResultRef.current = result;
        if (result.won) {
          setLastWin(result.payout);
        }
        stopSpinSound();
        setSpinning(false);
      }
    } catch (e) {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }
      stopSpinSound();
      const msg = e instanceof Error ? e.message : "Spin failed";
      toast.error(msg);
      setSpinning(false);
      setAnimState("idle");
    }
  }

  const myStats = myStatsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      {myStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="casino-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Spins
            </p>
            <p className="text-base font-black text-foreground">
              {myStats.totalSpins.toString()}
            </p>
          </div>
          <div className="casino-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Won
            </p>
            <p className="text-base font-black text-neon-green">
              {formatICP(myStats.totalWon)} ICP
            </p>
          </div>
          <div className="casino-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Wagered
            </p>
            <p className="text-base font-black text-muted-foreground">
              {formatICP(myStats.totalSpent)} ICP
            </p>
          </div>
        </div>
      )}

      {/* Pool + last win */}
      <div className="grid grid-cols-2 gap-3">
        <div className="casino-card p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Pool Balance
          </p>
          <p className="text-base font-black text-gold glow-gold">
            {formatICP(poolBalance)} ICP
          </p>
        </div>
        <div className="casino-card p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Last Win
          </p>
          <p className="text-base font-bold text-foreground">
            {lastWin > 0n ? `+${formatICP(lastWin)} ICP` : "—"}
          </p>
        </div>
      </div>

      {/* Slot machine frame */}
      <div
        data-ocid="slot.panel"
        className={`relative casino-card p-4 sm:p-6 shadow-card ${
          animState === "win" ? "animate-win-flash" : ""
        } ${animState === "lose" ? "animate-shake" : ""}`}
        style={{
          border:
            animState === "win"
              ? "1px solid oklch(0.71 0.090 73 / 80%)"
              : undefined,
          boxShadow:
            animState === "win"
              ? "0 0 60px oklch(0.71 0.090 73 / 50%), 0 0 120px oklch(0.71 0.090 73 / 20%)"
              : undefined,
        }}
      >
        <div className="text-center mb-4">
          <p className="font-brand text-xs font-bold uppercase tracking-[0.3em] text-gold/60">
            ✦ SpinLuxe Casino ✦
          </p>
          <div className="h-px mt-2 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        <div className="relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-20">
            <div className="w-2 h-0.5 bg-gold/80" />
          </div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-20">
            <div className="w-2 h-0.5 bg-gold/80" />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {([0, 1, 2] as const).map((i) => (
              <Reel
                key={i}
                spinning={spinning}
                result={reelResults[i]}
                stopDelay={i * 400}
                onStopped={handleReelStopped}
              />
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showResult && spinResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg z-30 ${
                spinResult.won
                  ? "bg-gold/15 border border-gold/60"
                  : "bg-destructive/10 border border-destructive/30"
              }`}
              data-ocid={
                spinResult.won ? "slot.success_state" : "slot.error_state"
              }
            >
              {spinResult.won ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <p className="font-brand text-4xl sm:text-5xl font-black text-gold glow-gold uppercase">
                      WIN!
                    </p>
                  </motion.div>
                  <p className="font-brand text-2xl sm:text-3xl font-bold text-gold-light mt-1">
                    +{formatICP(spinResult.payout)} ICP
                  </p>
                  <p className="text-sm text-gold/80 mt-2">
                    {getWinLabel(
                      spinResult.multiplier,
                      spinResult.reels as SlotSymbol[],
                    )}
                  </p>
                  {COIN_POSITIONS.map((left, j) => (
                    <div
                      key={left}
                      className="absolute text-2xl"
                      style={{
                        left: `${left}%`,
                        bottom: "20%",
                        animation: `float-up 1s ease-out ${j * 0.15}s forwards`,
                      }}
                    >
                      🪙
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="font-brand text-3xl font-black text-destructive uppercase">
                    LOST
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Better luck next time!
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </div>

      {/* Controls */}
      <div className="casino-card p-4 sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Select Bet
          </p>
          <div className="grid grid-cols-5 gap-2" data-ocid="slot.tab">
            {BET_OPTIONS.map((bet, idx) => (
              <button
                type="button"
                key={bet.label}
                onClick={() => setSelectedBetIdx(idx)}
                disabled={spinning}
                data-ocid={`slot.item.${idx + 1}`}
                className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all duration-150 ${
                  selectedBetIdx === idx
                    ? "border-gold bg-gold/15 glow-gold-box"
                    : "border-gold/20 bg-accent/30 hover:border-gold/40 hover:bg-accent/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span
                  className={`text-sm font-black ${selectedBetIdx === idx ? "text-gold glow-gold" : "text-foreground"}`}
                >
                  {bet.label}
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  ICP
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={!canSpin}
          data-ocid="slot.primary_button"
          className="spin-button w-full h-16 sm:h-20 rounded-2xl text-background font-brand text-2xl sm:text-3xl font-black uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          style={{
            animation:
              !spinning && canSpin
                ? "pulse-glow 2s ease-in-out infinite"
                : "none",
          }}
        >
          {spinning ? (
            <span className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              Spinning...
            </span>
          ) : (
            "SPIN"
          )}
        </button>

        {identity && poolBalance < (selectedBet?.e8s ?? 0n) && (
          <p
            data-ocid="slot.error_state"
            className="text-center text-xs text-destructive mt-3"
          >
            Pool is empty — Please try again later
          </p>
        )}
        {!identity && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Please log in first
          </p>
        )}
      </div>
    </div>
  );
}
