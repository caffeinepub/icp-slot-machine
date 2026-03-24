import { Toaster } from "@/components/ui/sonner";
import { Crown } from "lucide-react";
import { useEffect } from "react";
import GameScreen from "./components/GameScreen";
import LoginScreen from "./components/LoginScreen";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-card border border-gold/40 flex items-center justify-center glow-gold-box">
          <Crown className="h-8 w-8 text-gold" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-gold/40 animate-ping" />
      </div>
      <div className="text-center">
        <p className="font-brand text-sm font-bold uppercase tracking-[0.3em] text-gold/70">
          SpinLuxe
        </p>
        <p className="text-xs text-muted-foreground mt-1">Lade...</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();

  if (isInitializing || isActorFetching) {
    return (
      <>
        <Toaster />
        <LoadingScreen />
      </>
    );
  }

  if (!identity) {
    return (
      <>
        <Toaster />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <GameScreen />
    </>
  );
}
