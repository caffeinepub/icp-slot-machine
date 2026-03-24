# ICP Slot Machine

## Current State
Fully functional casino slot machine with Internet Identity login, real ICP via ICRC-2/ICRC-1, pool balance shown in sidebar and slot machine, player stats, leaderboard, recent wins. Backend exposes getMyICPBalance() but frontend does not use it. No way to donate ICP to the pool from within the app.

## Requested Changes (Diff)

### Add
- Player ICP balance display (from getMyICPBalance()) shown in the Header next to principal ID.
- Donate-to-pool feature: button near pool balance in Sidebar that opens a dialog where user enters an ICP amount and transfers it directly to the casino canister via ICRC-1.
- useMyBalance hook in useQueries.ts.
- transferICP utility (ICRC-1 direct transfer from frontend identity to target principal).

### Modify
- Header.tsx: show live ICP balance when logged in.
- Sidebar.tsx: add donate button to pool card.
- useQueries.ts: add useMyBalance, invalidate after spin and donation.

### Remove
- Nothing.

## Implementation Plan
1. Add transferICP(identity, toPrincipalText, amountE8s) to utils/icrc2.ts using ICP ledger icrc1_transfer.
2. Add useMyBalance() hook to useQueries.ts calling actor.getMyICPBalance().
3. Update useInvalidateAfterSpin to also invalidate myBalance query.
4. Show player balance in Header.tsx next to principal ID when logged in.
5. Add Pool auffuellen button in Sidebar pool card opening a shadcn Dialog with ICP amount input and confirm button. On confirm call transferICP to backend canister ID, then invalidate pool and balance queries.
6. Validate and build.
