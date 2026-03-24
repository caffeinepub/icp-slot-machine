import { Button } from "@/components/ui/button";
import {
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  Shield,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  {
    icon: Shield,
    label: "Sichere Authentifizierung",
    desc: "Internet Identity auf ICP",
  },
  {
    icon: Zap,
    label: "True Randomness",
    desc: "On-chain Zuf\u00e4lligkeit via ICP Random Beacon",
  },
  {
    icon: Trophy,
    label: "Echter ICP Jackpot",
    desc: "Echte ICP Auszahlungen aus dem Pool",
  },
];

const BET_SIZES = ["0.1", "0.5", "1", "2.5", "10"];

const FLOATING_SYMBOLS = [
  { symbol: "\uD83C\uDFB0", id: "slot" },
  { symbol: "7\uFE0F\u20E3", id: "seven" },
  { symbol: "\uD83C\uDF52", id: "cherry" },
  { symbol: "\uD83D\uDD14", id: "bell" },
  { symbol: "\uD83C\uDF4B", id: "lemon" },
  { symbol: "\uD83C\uDF4A", id: "orange" },
];

export default function LoginScreen() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/3 blur-[200px]" />
        {FLOATING_SYMBOLS.map(({ symbol, id }, i) => (
          <div
            key={id}
            className="absolute text-4xl opacity-10"
            style={{
              top: `${10 + i * 14}%`,
              left: `${5 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animation: "float-up 6s ease-in-out infinite alternate",
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-gold/40 mb-6 glow-gold-box"
          >
            <Crown className="h-10 w-10 text-gold" />
          </motion.div>
          <h1 className="font-brand text-5xl font-black uppercase tracking-[0.2em] text-gold glow-gold mb-2">
            SpinLuxe
          </h1>
          <p className="text-muted-foreground text-sm tracking-wider uppercase">
            Premium Casino on Internet Computer
          </p>
        </div>

        <div className="casino-card p-8 shadow-card">
          <div className="flex justify-center gap-2 mb-6">
            {BET_SIZES.map((b) => (
              <div
                key={b}
                className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-accent/50 border border-gold/20"
              >
                <span className="text-xs font-bold text-gold">{b}</span>
                <span className="text-[9px] text-muted-foreground">ICP</span>
              </div>
            ))}
          </div>

          <h2 className="text-center text-lg font-bold text-foreground mb-2">
            Anmelden zum Spielen
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Verwende deine Internet Identity f\u00fcr sichere, anonyme
            Authentifizierung.
          </p>

          {isLoginError && loginError && (
            <div
              data-ocid="login.error_state"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {loginError.message}
            </div>
          )}

          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.submit_button"
            className="w-full spin-button h-14 text-base font-bold uppercase tracking-widest text-background"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Verbinde...
              </>
            ) : (
              <>
                <InfinityIcon className="h-5 w-5 mr-2" />
                Mit Internet Identity anmelden
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="casino-card p-3 text-center">
              <Icon className="h-5 w-5 text-gold mx-auto mb-2" />
              <p className="text-[10px] font-semibold text-foreground mb-1">
                {label}
              </p>
              <p className="text-[9px] text-muted-foreground leading-tight">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
