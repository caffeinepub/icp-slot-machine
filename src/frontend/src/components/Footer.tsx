import { Crown } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="mt-16 border-t border-gold/20">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold/60" />
          <span className="font-brand text-sm font-semibold tracking-widest text-gold/60 uppercase">
            SpinLuxe
          </span>
          <span className="text-muted-foreground/50">Casino on ICP</span>
        </div>
        <p>
          © {year}. Built with <span className="text-neon-red">♥</span> using{" "}
          <a
            href={utmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/70 hover:text-gold transition-colors"
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-muted-foreground/40">Powered by Internet Computer</p>
      </div>
    </footer>
  );
}
