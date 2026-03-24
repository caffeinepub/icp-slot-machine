import { Symbol as SlotSymbol } from "../backend";

export { SlotSymbol as GameSymbol };
export type SymbolKey =
  | "bar"
  | "bell"
  | "cherry"
  | "lemon"
  | "orange"
  | "seven";

export const ALL_SYMBOLS: SlotSymbol[] = [
  SlotSymbol.seven,
  SlotSymbol.bar,
  SlotSymbol.bell,
  SlotSymbol.cherry,
  SlotSymbol.orange,
  SlotSymbol.lemon,
];

export function randomSymbol(): SlotSymbol {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}
