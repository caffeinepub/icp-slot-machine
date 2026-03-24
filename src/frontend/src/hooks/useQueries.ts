import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlayerStats, WinRecord } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function usePoolBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["poolBalance"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getPoolBalance();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useMyBalance() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<bigint>({
    queryKey: ["myBalance", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return BigInt(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getMyICPBalance() as Promise<bigint>;
    },
    enabled: !!actor && !!identity && !isFetching,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useMyStats() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<PlayerStats | null>({
    queryKey: ["myStats", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getMyInfo();
    },
    enabled: !!actor && !!identity && !isFetching,
    staleTime: 30_000,
  });
}

// Alias for backwards compat
export function useMyInfo() {
  return useMyStats();
}

export function useRecentWins() {
  const { actor, isFetching } = useActor();
  return useQuery<WinRecord[]>({
    queryKey: ["recentWins"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentWins();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[Principal, PlayerStats]>>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard() as Promise<Array<[Principal, PlayerStats]>>;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useInvalidateAfterSpin() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["poolBalance"] });
    queryClient.invalidateQueries({ queryKey: ["recentWins"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({
      queryKey: ["myStats", identity?.getPrincipal().toString()],
    });
    queryClient.invalidateQueries({
      queryKey: ["myBalance", identity?.getPrincipal().toString()],
    });
  };
}
