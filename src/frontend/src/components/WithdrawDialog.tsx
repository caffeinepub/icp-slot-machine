import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Identity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { transferICP } from "../utils/icrc2";

const ICP_FEE = BigInt(10_000);

function formatICP(e8s: bigint): string {
  return (Number(e8s) / 100_000_000).toFixed(4);
}

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: bigint;
  identity: Identity | null;
  onSuccess: () => void;
}

export default function WithdrawDialog({
  open,
  onOpenChange,
  balance,
  identity,
  onSuccess,
}: WithdrawDialogProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxSendable = balance > ICP_FEE ? balance - ICP_FEE : BigInt(0);

  function handleMax() {
    setAmount((Number(maxSendable) / 100_000_000).toFixed(4));
  }

  function handleClose(val: boolean) {
    if (!loading) {
      onOpenChange(val);
      if (!val) {
        setDestination("");
        setAmount("");
        setError(null);
        setSuccess(false);
      }
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!identity) {
      setError("Nicht eingeloggt.");
      return;
    }

    let principal: Principal;
    try {
      principal = Principal.fromText(destination.trim());
    } catch {
      setError("Ungültige Principal ID. Bitte prüfe die Ziel-Adresse.");
      return;
    }

    const amountNum = Number.parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Bitte gib einen gültigen Betrag ein.");
      return;
    }

    const amountE8s = BigInt(Math.round(amountNum * 100_000_000));
    if (amountE8s + ICP_FEE > balance) {
      setError(
        `Nicht genug Guthaben. Verfügbar: ${formatICP(maxSendable)} ICP (nach Gebühr).`,
      );
      return;
    }

    setLoading(true);
    try {
      await transferICP(identity, principal.toText(), amountE8s);
      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        handleClose(false);
      }, 1500);
    } catch (e: any) {
      setError(e?.message ?? "Transfer fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="withdraw.dialog"
        className="bg-[#0d0d0d] border border-gold/20 text-white max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gold font-brand text-lg tracking-widest uppercase">
            <ArrowUpRight className="h-5 w-5" />
            ICP Auszahlen
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div
            data-ocid="withdraw.success_state"
            className="py-8 text-center text-green-400 font-semibold text-base"
          >
            Transfer erfolgreich!
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold/5 border border-gold/10 text-xs">
              <span className="text-muted-foreground">Verfügbar</span>
              <span className="font-bold text-gold tabular-nums">
                {formatICP(balance)} ICP
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                Ziel-Adresse (Principal ID)
              </Label>
              <Input
                data-ocid="withdraw.input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="abc12-xyz99-..."
                disabled={loading}
                className="bg-black/40 border-gold/20 text-white placeholder:text-white/20 focus:border-gold/50 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                Betrag (ICP)
              </Label>
              <div className="flex gap-2">
                <Input
                  data-ocid="withdraw.textarea"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0000"
                  disabled={loading}
                  className="bg-black/40 border-gold/20 text-white placeholder:text-white/20 focus:border-gold/50 tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMax}
                  disabled={loading || maxSendable <= BigInt(0)}
                  data-ocid="withdraw.secondary_button"
                  className="border-gold/30 text-gold hover:bg-gold/10 shrink-0 text-xs uppercase tracking-widest"
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Transaktionsgebühr: 0.0001 ICP
              </p>
            </div>

            {error && (
              <p
                data-ocid="withdraw.error_state"
                className="text-red-400 text-sm"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={loading}
                data-ocid="withdraw.cancel_button"
                className="flex-1 border-gold/20 text-muted-foreground hover:text-white hover:bg-white/5"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !destination || !amount}
                data-ocid="withdraw.submit_button"
                className="flex-1 spin-button text-background font-bold uppercase tracking-widest text-xs gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
                Senden
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
