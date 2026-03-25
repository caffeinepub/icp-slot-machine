import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  Shield,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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
    desc: "On-chain Zuf\u00e4lligkeit via ICP",
  },
  {
    icon: Trophy,
    label: "Echter ICP Jackpot",
    desc: "Echte ICP Auszahlungen",
  },
];

const BET_SIZES = ["0.01", "0.1", "0.5", "1", "2.5", "10"];

const AMBIENT_GLYPHS = [
  {
    glyph: "\u25c6",
    id: "d1",
    top: "8%",
    left: "4%",
    size: "2.5rem",
    delay: 0,
  },
  {
    glyph: "VII",
    id: "d2",
    top: "18%",
    left: "88%",
    size: "1.1rem",
    delay: 1.2,
  },
  {
    glyph: "\u25c7",
    id: "d3",
    top: "35%",
    left: "6%",
    size: "1.8rem",
    delay: 0.6,
  },
  {
    glyph: "BAR",
    id: "d4",
    top: "55%",
    left: "91%",
    size: "0.95rem",
    delay: 1.8,
  },
  {
    glyph: "\u2726",
    id: "d5",
    top: "72%",
    left: "3%",
    size: "2rem",
    delay: 0.3,
  },
  {
    glyph: "III",
    id: "d6",
    top: "80%",
    left: "85%",
    size: "1.1rem",
    delay: 2.1,
  },
  {
    glyph: "\u25c6",
    id: "d7",
    top: "88%",
    left: "12%",
    size: "1.4rem",
    delay: 0.9,
  },
  {
    glyph: "\u2727",
    id: "d8",
    top: "12%",
    left: "48%",
    size: "1.6rem",
    delay: 1.5,
  },
];

const SHIMMER_RAYS = [
  { id: "ray0", left: "10%", angle: -20 },
  { id: "ray1", left: "26%", angle: -12 },
  { id: "ray2", left: "42%", angle: -4 },
  { id: "ray3", left: "58%", angle: 4 },
  { id: "ray4", left: "74%", angle: 12 },
  { id: "ray5", left: "90%", angle: 20 },
];

const PULSE_DOTS = [
  { id: "dot0", delay: 0 },
  { id: "dot1", delay: 0.2 },
  { id: "dot2", delay: 0.4 },
];

const DISCLAIMER_SECTIONS = [
  {
    num: "1",
    title: "Application (Test Environment)",
    body: 'This application ("Application") is provided solely for testing, demonstration, and development purposes as a Minimum Viable Product ("MVP"). It does not constitute a fully developed, licensed, or regulated gambling platform.',
  },
  {
    num: "2",
    title: "No Licensed Gambling Service",
    body: "The Application does not represent a legally licensed gambling service in any jurisdiction. Any gameplay features, mechanics, or systems resembling gambling are purely experimental and intended for testing purposes only.",
  },
  {
    num: "3",
    title: "Jurisdictional Restrictions",
    body: "Access to and use of this Application may be illegal or restricted in certain countries or regions. Users are solely responsible for determining whether accessing or using the Application is lawful in their jurisdiction. By using this Application, you represent and warrant that you are doing so in compliance with all applicable local, national, and international laws.",
  },
  {
    num: "4",
    title: "Age Restriction",
    body: "This Application is intended only for individuals who are at least 18 years old (or the legal age in their jurisdiction, whichever is higher). By using the Application, you confirm that you meet the applicable legal age requirements.",
  },
  {
    num: "5",
    title: "No Real-Money Guarantee / Risk of Loss",
    body: "If the Application includes any form of monetary transactions, virtual currency, or items of value:\n\u2022 All participation is at the user's own risk\n\u2022 Losses may occur, including the complete loss of funds or virtual assets\n\u2022 There is no guarantee of winnings or returns\n\u2022 No refunds, reimbursements, or compensations are guaranteed under any circumstances",
  },
  {
    num: "6",
    title: "Virtual Currency & Assets",
    body: "Any virtual currency, tokens, or in-app items have no real-world monetary value unless explicitly stated otherwise. They are provided solely for testing and gameplay simulation purposes.",
  },
  {
    num: "7",
    title: "No Liability",
    body: "To the fullest extent permitted by law, the operator, developers, and affiliates shall not be liable for any:\n\u2022 Financial losses\n\u2022 Loss of data\n\u2022 System errors, bugs, or interruptions\n\u2022 Incorrect game outcomes\n\u2022 Indirect, incidental, or consequential damages\nUse of the Application is entirely at your own risk.",
  },
  {
    num: "8",
    title: '"As Is" and No Warranty',
    body: 'The Application is provided "as is" and "as available", without warranties of any kind, whether express or implied, including but not limited to:\n\u2022 Fitness for a particular purpose\n\u2022 Availability or uptime\n\u2022 Accuracy or reliability of results',
  },
  {
    num: "9",
    title: "Technical Risks",
    body: "Users acknowledge that the Application may contain:\n\u2022 Bugs or vulnerabilities\n\u2022 Incomplete or unstable features\n\u2022 Interruptions or unexpected shutdowns\nThe operator assumes no responsibility for such issues.",
  },
  {
    num: "10",
    title: "Responsible Use / No Encouragement of Gambling",
    body: "This Application is not intended to promote or encourage gambling behavior. Users should act responsibly and avoid financial risks.",
  },
  {
    num: "11",
    title: "Right to Modify or Terminate",
    body: "The operator reserves the right to:\n\u2022 Modify, suspend, or discontinue the Application at any time\n\u2022 Restrict or terminate access without prior notice\n\u2022 Change features, rules, or functionality at its sole discretion",
  },
  {
    num: "12",
    title: "No User Entitlement",
    body: "Users have no legal entitlement to continued access, features, winnings, balances, or any part of the Application.",
  },
  {
    num: "13",
    title: "Compliance Responsibility",
    body: "Users are solely responsible for compliance with:\n\u2022 Gambling laws\n\u2022 Financial regulations\n\u2022 Tax obligations\nin their respective jurisdiction.",
  },
  {
    num: "14",
    title: "No Financial or Legal Advice",
    body: "Nothing within the Application constitutes financial, legal, or investment advice.",
  },
  {
    num: "15",
    title: "Data & Privacy (Basic Notice)",
    body: "By using the Application, users acknowledge that limited technical data (e.g., logs, usage metrics) may be collected for testing and improvement purposes. No guarantee is made regarding data security in this MVP stage.",
  },
  {
    num: "16",
    title: "Indemnification",
    body: "Users agree to indemnify and hold harmless the operator from any claims, damages, or liabilities arising from misuse of the Application or violation of applicable laws.",
  },
  {
    num: "17",
    title: "Governing Law",
    body: "This disclaimer shall be governed by and interpreted in accordance with applicable laws as determined by the operator, without regard to conflict of law principles.",
  },
  {
    num: "18",
    title: "Acceptance of Terms",
    body: "By accessing or using this Application, you confirm that you have read, understood, and agreed to this disclaimer and all associated risks.",
  },
];

type SplashPhase = 0 | 1 | 2;

export default function LoginScreen() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();
  const [phase, setPhase] = useState<SplashPhase>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <img
          src="/assets/generated/casino-hero-bg.dim_1920x1080.jpg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
      </div>

      {/* Ambient glyph layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {AMBIENT_GLYPHS.map(({ glyph, id, top, left, size, delay }) => (
          <div
            key={id}
            className="absolute select-none font-playfair font-bold tracking-widest"
            style={{
              top,
              left,
              fontSize: size,
              color: "oklch(0.71 0.09 73 / 7%)",
              animation: "float-up 9s ease-in-out infinite alternate",
              animationDelay: `${delay}s`,
              letterSpacing: "0.15em",
            }}
          >
            {glyph}
          </div>
        ))}

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-[oklch(0.71_0.09_73/5%)] blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[oklch(0.71_0.09_73/4%)] blur-[130px]" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[oklch(0.55_0.06_73/4%)] blur-[100px]" />
      </div>

      {/* ─── CINEMATIC SPLASH OVERLAY ─── */}
      <AnimatePresence>
        {phase < 2 && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "oklch(0.04 0.005 267)" }}
          >
            {/* Shimmer light rays */}
            <div
              className="absolute inset-0 overflow-hidden opacity-30"
              aria-hidden="true"
            >
              {SHIMMER_RAYS.map(({ id, left, angle }, i) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={
                    phase >= 1 ? { opacity: [0, 0.6, 0], scaleY: 1 } : {}
                  }
                  transition={{ duration: 2, delay: 0.1 * i, ease: "easeOut" }}
                  className="absolute bottom-0 origin-bottom"
                  style={{
                    left,
                    width: "2px",
                    height: "60%",
                    background:
                      "linear-gradient(to top, transparent, oklch(0.71 0.09 73 / 80%), transparent)",
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: "bottom center",
                  }}
                />
              ))}
            </div>

            {/* Logo cluster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.72, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center"
            >
              {/* Crown */}
              <motion.div
                animate={{
                  filter:
                    phase >= 1
                      ? [
                          "drop-shadow(0 0 12px oklch(0.71 0.09 73 / 70%))",
                          "drop-shadow(0 0 40px oklch(0.87 0.09 83 / 95%))",
                          "drop-shadow(0 0 16px oklch(0.71 0.09 73 / 75%))",
                        ]
                      : "drop-shadow(0 0 8px oklch(0.71 0.09 73 / 50%))",
                }}
                transition={{
                  duration: 1.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="mb-6"
              >
                <Crown
                  className="h-16 w-16"
                  style={{ color: "oklch(0.71 0.09 73)" }}
                  strokeWidth={1.0}
                />
              </motion.div>

              {/* SPINLUXE wordmark */}
              <motion.h1
                animate={{
                  textShadow:
                    phase >= 1
                      ? "0 0 40px oklch(0.87 0.09 83 / 95%), 0 0 80px oklch(0.71 0.09 73 / 70%), 0 0 140px oklch(0.71 0.09 73 / 40%)"
                      : "0 0 20px oklch(0.71 0.09 73 / 60%), 0 0 40px oklch(0.71 0.09 73 / 30%)",
                }}
                transition={{ duration: 0.7 }}
                className="font-playfair text-7xl font-bold uppercase tracking-[0.3em] sm:text-8xl"
                style={{ color: "oklch(0.71 0.09 73)" }}
              >
                SPINLUXE
              </motion.h1>

              {/* Golden sweep line */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={phase >= 1 ? { scaleX: 1, opacity: 1 } : {}}
                transition={{
                  duration: 0.8,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="my-5 w-80 sm:w-[28rem]"
                style={{ transformOrigin: "left center" }}
              >
                <div
                  style={{
                    height: "1px",
                    background:
                      "linear-gradient(to right, transparent, oklch(0.87 0.09 83 / 90%), oklch(0.71 0.09 73 / 100%), oklch(0.87 0.09 83 / 90%), transparent)",
                    boxShadow: "0 0 10px 1px oklch(0.71 0.09 73 / 50%)",
                  }}
                />
                <div className="flex items-center justify-center gap-4 mt-1">
                  {["s0", "s1", "s2"].map((sid) => (
                    <span
                      key={sid}
                      style={{
                        color:
                          sid === "s1"
                            ? "oklch(0.71 0.09 73 / 40%)"
                            : "oklch(0.71 0.09 73 / 60%)",
                        fontSize: sid === "s1" ? "0.5rem" : "0.6rem",
                      }}
                    >
                      \u25c6
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="font-accent-italic text-xl tracking-[0.18em] sm:text-2xl"
                style={{ color: "oklch(0.82 0.06 73)" }}
              >
                Wo Exklusivit\u00e4t auf Fortune trifft
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={phase >= 1 ? { opacity: 1 } : {}}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="mt-3 text-xs uppercase tracking-[0.35em]"
                style={{ color: "oklch(0.55 0.04 73)" }}
              >
                Premium Casino \u00b7 Internet Computer Protocol
              </motion.p>
            </motion.div>

            {/* Pulsing diamond loader */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 1 ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="absolute bottom-12 flex items-center gap-3"
            >
              {PULSE_DOTS.map(({ id, delay }) => (
                <motion.span
                  key={id}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay,
                    ease: "easeInOut",
                  }}
                  style={{
                    color: "oklch(0.71 0.09 73)",
                    fontSize: "0.7rem",
                    display: "inline-block",
                  }}
                >
                  \u25c6
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-20 flex items-center justify-center pt-6 pb-4"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-playfair text-2xl font-bold tracking-[0.3em] text-gold glow-gold uppercase">
            SpinLuxe
          </span>
          <div className="ornament-divider w-48" />
        </div>
      </motion.header>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8"
      >
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              filter: [
                "drop-shadow(0 0 8px oklch(0.71 0.09 73 / 60%))",
                "drop-shadow(0 0 28px oklch(0.71 0.09 73 / 90%))",
                "drop-shadow(0 0 8px oklch(0.71 0.09 73 / 60%))",
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="inline-flex items-center justify-center mb-5"
          >
            <Crown className="h-20 w-20 text-gold" strokeWidth={1.2} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-playfair text-6xl font-bold uppercase tracking-[0.15em] text-gold glow-gold-strong leading-none mb-3 sm:text-7xl"
          >
            SPINLUXE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="text-[oklch(0.87_0.09_83)] text-sm tracking-[0.25em] uppercase font-light mb-2 sm:text-base"
          >
            Premium Casino auf dem Internet Computer
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-accent-italic text-[oklch(0.82_0.06_73)] text-lg italic sm:text-xl"
          >
            Wo Exklusivit\u00e4t auf Fortune trifft
          </motion.p>
        </motion.div>

        {/* Ornamental divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={phase >= 2 ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="ornament-divider w-72 mb-8 sm:w-96"
        />

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-10 sm:gap-5"
        >
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-black/40 backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0 text-gold" />
              <div className="text-left">
                <p className="text-[10px] font-semibold leading-none text-[oklch(0.87_0.09_83)]">
                  {label}
                </p>
                <p className="mt-0.5 text-[9px] leading-tight text-[oklch(0.65_0.04_73)]">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.75, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 sm:p-10">
            <div className="mb-6 text-center">
              <h2 className="mb-2 font-playfair text-2xl font-bold tracking-wider text-[oklch(0.87_0.09_83)]">
                Exklusiver Zugang
              </h2>
              <p className="text-sm leading-relaxed text-[oklch(0.65_0.04_73)]">
                Authentifiziere dich sicher mit deiner Internet Identity \u2014
                anonym und dezentral.
              </p>
            </div>

            <div className="ornament-divider-sm mb-6" />

            {/* Bet size chips */}
            <div className="mb-7 flex justify-center gap-2">
              {BET_SIZES.map((b) => (
                <div
                  key={b}
                  className="flex flex-col items-center rounded-full border border-gold/25 bg-gold/5 px-3 py-2 transition-colors hover:bg-gold/10"
                >
                  <span className="font-playfair text-xs font-bold text-gold">
                    {b}
                  </span>
                  <span className="text-[8px] tracking-wider text-[oklch(0.65_0.04_73)]">
                    ICP
                  </span>
                </div>
              ))}
            </div>

            {/* Error state */}
            {isLoginError && loginError && (
              <div
                data-ocid="login.error_state"
                className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
              >
                {loginError.message}
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={login}
              disabled={isLoggingIn || phase < 2}
              data-ocid="login.submit_button"
              className="spin-button h-14 w-full rounded-xl text-sm font-bold uppercase tracking-[0.2em] text-background"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Verbinde...
                </>
              ) : (
                <>
                  <InfinityIcon className="mr-3 h-5 w-5" />
                  Mit Internet Identity Anmelden
                </>
              )}
            </Button>

            <p className="mt-4 text-center text-[9px] uppercase tracking-wider text-[oklch(0.45_0.03_73)]">
              Kein Konto erforderlich \u00b7 Keine Passw\u00f6rter \u00b7 100%
              dezentral
            </p>
          </div>
        </motion.div>

        {/* Disclaimer notice block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.85, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md mt-4"
          data-ocid="disclaimer.panel"
        >
          <div
            className="rounded-xl border px-5 py-4 backdrop-blur-sm"
            style={{
              borderColor: "oklch(0.71 0.09 73 / 30%)",
              background: "oklch(0.06 0.005 267 / 80%)",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ color: "oklch(0.71 0.09 73)" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "oklch(0.71 0.09 73)" }}
                >
                  Wichtiger Hinweis
                </p>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "oklch(0.65 0.04 73)" }}
                >
                  Diese Anwendung ist ein experimentelles Testsystem (MVP).
                  Keine lizenzierte Gl\u00fccksspielplattform. Nur f\u00fcr
                  Personen ab 18 Jahren. Nutzung auf eigenes Risiko.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      data-ocid="disclaimer.open_modal_button"
                      className="mt-2 text-[11px] underline underline-offset-2 transition-colors hover:opacity-80"
                      style={{ color: "oklch(0.71 0.09 73)" }}
                    >
                      Vollst\u00e4ndige Nutzungsbedingungen lesen
                    </button>
                  </DialogTrigger>
                  <DialogContent
                    data-ocid="disclaimer.dialog"
                    className="max-w-2xl border-0 p-0 shadow-2xl"
                    style={{
                      background: "oklch(0.06 0.005 267)",
                      border: "1px solid oklch(0.71 0.09 73 / 25%)",
                    }}
                  >
                    <DialogHeader className="px-6 pt-6 pb-0">
                      <DialogTitle
                        className="font-playfair text-xl font-bold tracking-wide"
                        style={{ color: "oklch(0.71 0.09 73)" }}
                      >
                        Rechtlicher Hinweis &amp; Nutzungsbedingungen
                      </DialogTitle>
                      <div
                        style={{
                          height: "1px",
                          marginTop: "12px",
                          background:
                            "linear-gradient(to right, oklch(0.71 0.09 73 / 60%), transparent)",
                        }}
                      />
                      <p
                        className="text-[11px] uppercase tracking-widest pt-2"
                        style={{ color: "oklch(0.55 0.04 73)" }}
                      >
                        LEGAL DISCLAIMER, TERMS OF USE &amp; LIMITATION OF
                        LIABILITY (MVP TEST APPLICATION)
                      </p>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] px-6 pb-6">
                      <div className="space-y-5 pt-4">
                        {DISCLAIMER_SECTIONS.map(({ num, title, body }) => (
                          <div key={num}>
                            <h3
                              className="mb-1.5 font-playfair text-sm font-bold"
                              style={{ color: "oklch(0.71 0.09 73)" }}
                            >
                              {num}. {title}
                            </h3>
                            <p
                              className="text-[12px] leading-relaxed whitespace-pre-line"
                              style={{ color: "oklch(0.65 0.04 73)" }}
                            >
                              {body}
                            </p>
                          </div>
                        ))}
                        <div
                          className="mt-6 rounded-lg border px-4 py-3"
                          style={{
                            borderColor: "oklch(0.71 0.09 73 / 40%)",
                            background: "oklch(0.10 0.008 267 / 80%)",
                          }}
                        >
                          <p
                            className="text-[11px] font-semibold leading-relaxed"
                            style={{ color: "oklch(0.87 0.09 83)" }}
                          >
                            IMPORTANT NOTICE: This Application is an
                            experimental test system. Do not use it for real
                            financial activities unless explicitly authorized
                            and legally compliant.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                    <div
                      className="flex justify-end px-6 pb-5 pt-2"
                      style={{
                        borderTop: "1px solid oklch(0.71 0.09 73 / 15%)",
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          data-ocid="disclaimer.close_button"
                          variant="outline"
                          className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold text-xs uppercase tracking-wider"
                        >
                          Schlie\u00dfen
                        </Button>
                      </DialogTrigger>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom compliance notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
          transition={{ delay: 0.95, duration: 0.8 }}
          className="mt-5 text-center text-[10px] uppercase tracking-[0.18em]"
          style={{ color: "oklch(0.40 0.03 73)" }}
        >
          18+ \u00b7 MVP Testanwendung \u00b7 Nutzung auf eigenes Risiko \u00b7
          Keine Lizenzierte Gl\u00fccksspielplattform
        </motion.p>
      </motion.main>

      {/* Ambient glow bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48">
        <div className="absolute bottom-0 left-1/2 h-full w-full -translate-x-1/2 bg-gradient-to-t from-[oklch(0.71_0.09_73/8%)] to-transparent" />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="relative z-10 py-4 text-center text-[10px] tracking-wider text-[oklch(0.35_0.02_73)]"
      >
        \u00a9 {new Date().getFullYear()} SpinLuxe \u00b7{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gold/60"
        >
          Built with love using caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}
