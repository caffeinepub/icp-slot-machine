import { useEffect, useRef, useState } from "react";
import { Symbol as SlotSymbol } from "../backend";
import { ALL_SYMBOLS, randomSymbol } from "../types/symbols";

export { ALL_SYMBOLS, randomSymbol };
export type { SlotSymbol as GameSymbol };

interface SymbolDisplayProps {
  symbol: SlotSymbol;
  size?: "normal" | "large";
}

export function SymbolDisplay({ symbol, size = "normal" }: SymbolDisplayProps) {
  const isLarge = size === "large";
  const textSizeClass = isLarge
    ? "text-4xl sm:text-5xl"
    : "text-3xl sm:text-4xl";

  switch (symbol) {
    case SlotSymbol.seven:
      return (
        <span
          className={`${textSizeClass} font-black text-neon-red glow-red select-none leading-none`}
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          7
        </span>
      );
    case SlotSymbol.bar:
      return (
        <span
          className={`${
            isLarge ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
          } font-black text-gold glow-gold select-none leading-none tracking-widest`}
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          BAR
        </span>
      );
    case SlotSymbol.bell:
      return (
        <span className={`${textSizeClass} select-none leading-none`}>🔔</span>
      );
    case SlotSymbol.cherry:
      return (
        <span className={`${textSizeClass} select-none leading-none`}>🍒</span>
      );
    case SlotSymbol.orange:
      return (
        <span className={`${textSizeClass} select-none leading-none`}>🍊</span>
      );
    case SlotSymbol.lemon:
      return (
        <span className={`${textSizeClass} select-none leading-none`}>🍋</span>
      );
    default:
      return (
        <span className={`${textSizeClass} select-none leading-none`}>⭐</span>
      );
  }
}

export interface ReelProps {
  spinning: boolean;
  result: SlotSymbol;
  stopDelay: number;
  onStopped?: () => void;
}

export default function Reel({
  spinning,
  result,
  stopDelay,
  onStopped,
}: ReelProps) {
  const [displaySymbols, setDisplaySymbols] = useState<
    [SlotSymbol, SlotSymbol, SlotSymbol]
  >([randomSymbol(), randomSymbol(), randomSymbol()]);
  const [isStopping, setIsStopping] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef(result);
  const onStoppedRef = useRef(onStopped);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    onStoppedRef.current = onStopped;
  }, [onStopped]);

  useEffect(() => {
    if (spinning) {
      setIsStopping(false);
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      intervalRef.current = setInterval(() => {
        setDisplaySymbols([randomSymbol(), randomSymbol(), randomSymbol()]);
      }, 80);
    } else {
      stopTimeoutRef.current = setTimeout(() => {
        setIsStopping(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplaySymbols([randomSymbol(), resultRef.current, randomSymbol()]);
        setTimeout(() => {
          setIsStopping(false);
          onStoppedRef.current?.();
        }, 200);
      }, stopDelay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, [spinning, stopDelay]);

  return (
    <div className="reel-container w-full" style={{ height: "288px" }}>
      <div
        className={`flex items-center justify-center h-24 transition-all duration-150 ${
          isStopping ? "blur-sm" : ""
        }`}
      >
        <SymbolDisplay symbol={displaySymbols[0]} />
      </div>

      <div className="payline-highlight flex items-center justify-center h-24 relative z-10">
        <div
          className={`transition-all duration-200 ${isStopping ? "scale-110" : "scale-100"}`}
        >
          <SymbolDisplay symbol={displaySymbols[1]} size="large" />
        </div>
      </div>

      <div
        className={`flex items-center justify-center h-24 transition-all duration-150 ${
          isStopping ? "blur-sm" : ""
        }`}
      >
        <SymbolDisplay symbol={displaySymbols[2]} />
      </div>
    </div>
  );
}
