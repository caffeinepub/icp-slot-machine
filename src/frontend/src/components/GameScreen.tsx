import { motion } from "motion/react";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SlotMachine from "./SlotMachine";

export default function GameScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Main slot machine — first on mobile */}
            <section className="flex-1 order-1" data-ocid="game.section">
              <div className="mb-4">
                <h1 className="font-brand text-2xl sm:text-3xl font-black uppercase tracking-[0.1em] text-gold glow-gold">
                  Classic Slots
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  3-Walzen • Echte ICP Gewinne • True Randomness
                </p>
              </div>
              <SlotMachine />
            </section>

            {/* Sidebar — second on mobile, first col on desktop */}
            <aside
              className="w-full lg:w-72 xl:w-80 order-2 lg:order-first"
              data-ocid="sidebar.panel"
            >
              <div className="mb-4 hidden lg:block">
                <h2 className="font-brand text-sm font-bold uppercase tracking-[0.15em] text-gold/70">
                  Casino Stats
                </h2>
              </div>
              <Sidebar />
            </aside>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
