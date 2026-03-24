import { Button } from "@/components/ui/button";
import { Crown, Info, Loader2, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePoolBalance } from "../hooks/useQueries";
import { approveICP } from "../utils/icrc2";

const ENTRY_FEE_E8S = BigInt(500_000_000);
const ENTRY_FEE_APPROVE = BigInt(500_010_000);

function formatICP(e8s: bigint): string {
  return (Number(e8s) / 100_000_000).toFixed(2);
}

interface Props {
  onPaid: () => void;
}

export default function EntryFeeGate({ onPaid }: Props) {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const poolBalanceQuery = usePoolBalance();
  const [step, setStep] = useState<"idle" | "approving" | "paying" | "done">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!identity || !actor) return;
    setError(null);
    try {
      // Step 1: Get backend canister ID
      const config = await loadConfig();
      const backendCanisterId = config.backend_canister_id;

      // Step 2: Approve
      setStep("approving");
      toast.info("Schritt 1/2: ICP Freigabe wird beantragt...");
      await approveICP(identity, backendCanisterId, ENTRY_FEE_APPROVE);

      // Step 3: Pay entry fee
      setStep("paying");
      toast.info("Schritt 2/2: Einstiegsgebühr wird gezahlt...");
      await actor.payEntryFee();

      setStep("done");
      toast.success("Willkommen! Du kannst jetzt spielen! 🎰");
      onPaid();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      setError(msg);
      setStep("idle");
      toast.error(msg);
    }
  }

  const isLoading = step === "approving" || step === "paying";

  const stepLabel = {
    idle: null,
    approving: "ICP Freigabe läuft...",
    paying: "Einstiegsgebühr wird übertragen...",
    done: "Fertig!",
  }[step];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-gold/5 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-neon-cyan/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-gold/40 mb-4 glow-gold-box">
            <Crown className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-brand text-3xl font-black uppercase tracking-[0.15em] text-gold glow-gold mb-2">
            SpinLuxe
          </h1>
          <p className="text-muted-foreground text-sm">
            Willkommen im exklusiven Casino
          </p>
        </div>

        {/* Fee Card */}
        <div className="casino-card p-6 shadow-card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gold" />
            <h2 className="font-bold text-lg text-foreground uppercase tracking-wider">
              Einstiegsgebühr
            </h2>
          </div>

          {/* Fee amount */}
          <div className="text-center py-6 mb-4 rounded-xl bg-accent/30 border border-gold/20">
            <p className="text-muted-foreground text-sm mb-1">
              Einmalige Gebühr
            </p>
            <p className="font-brand text-5xl font-black text-gold glow-gold">
              5 ICP
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              = {formatICP(ENTRY_FEE_E8S)} ICP • nicht rückerstattbar
            </p>
          </div>

          {/* Pool balance */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-gold/15 mb-4">
            <span className="text-sm text-muted-foreground">
              Aktueller Pool
            </span>
            <span className="font-bold text-gold">
              {poolBalanceQuery.data !== undefined
                ? `${formatICP(poolBalanceQuery.data)} ICP`
                : "Laden..."}
            </span>
          </div>

          {/* Info */}
          <div className="flex gap-2 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 mb-5">
            <Info className="h-4 w-4 text-neon-cyan shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Die 5 ICP Einstiegsgebühr füllt den gemeinsamen Gewinnpool.
              Gewinne werden direkt aus diesem Pool ausgezahlt. Der Betrag kann
              nicht zurückgezogen werden.
            </p>
          </div>

          {/* Step indicator */}
          {isLoading && stepLabel && (
            <div
              data-ocid="entry_fee.loading_state"
              className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 border border-gold/30 mb-4"
            >
              <Loader2 className="h-4 w-4 animate-spin text-gold shrink-0" />
              <p className="text-sm text-gold">{stepLabel}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              data-ocid="entry_fee.error_state"
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive mb-4"
            >
              {error}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handlePay}
            disabled={isLoading || !identity || !actor}
            data-ocid="entry_fee.submit_button"
            className="w-full spin-button h-14 text-base font-bold uppercase tracking-widest text-background"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {stepLabel}
              </>
            ) : (
              "5 ICP Einzahlen & Spielen"
            )}
          </Button>
        </div>

        {/* Two-step explanation */}
        <div className="casino-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ablauf
          </p>
          <div className="space-y-2">
            {[
              {
                n: 1,
                t: "ICP Freigabe",
                d: "Erlaubt dem Canister, 5 ICP von deiner Wallet abzubuchen",
              },
              {
                n: 2,
                t: "Einzahlung",
                d: "Der Canister zieht die 5 ICP ein und aktiviert deinen Account",
              },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <span className="text-xs font-bold text-gold">{n}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
