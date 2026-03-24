import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type SlotSymbol = { 'bar': null } | { 'bell': null } | { 'cherry': null } | { 'lemon': null } | { 'orange': null } | { 'seven': null };
export interface SpinResult {
  multiplierBps: bigint;
  payout: bigint;
  reels: Array<SlotSymbol>;
  won: boolean;
}
export interface PlayerStats {
  hasPaid: boolean;
  totalSpent: bigint;
  totalSpins: bigint;
  totalWon: bigint;
}
export interface UserProfile {
  email: [] | [string];
  name: string;
}
export interface WinRecord {
  payout: bigint;
  player: Principal;
  reels: Array<SlotSymbol>;
  timestamp: bigint;
}
export type UserRole = { 'admin': null } | { 'guest': null } | { 'user': null };

export interface _SERVICE {
  _initializeAccessControlWithSecret: ActorMethod<[string], undefined>;
  assignCallerUserRole: ActorMethod<[Principal, UserRole], undefined>;
  getCallerUserProfile: ActorMethod<[], [] | [UserProfile]>;
  getCallerUserRole: ActorMethod<[], UserRole>;
  getLeaderboard: ActorMethod<[], Array<[Principal, PlayerStats]>>;
  getMyICPBalance: ActorMethod<[], bigint>;
  getMyInfo: ActorMethod<[], PlayerStats>;
  getMyStats: ActorMethod<[], PlayerStats>;
  getPoolBalance: ActorMethod<[], bigint>;
  getRecentWins: ActorMethod<[], Array<WinRecord>>;
  getUserProfile: ActorMethod<[Principal], [] | [UserProfile]>;
  isCallerAdmin: ActorMethod<[], boolean>;
  saveCallerUserProfile: ActorMethod<[UserProfile], undefined>;
  spin: ActorMethod<[bigint], SpinResult>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
