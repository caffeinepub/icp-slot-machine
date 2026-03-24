import { IDL } from "@dfinity/candid";
import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

const Account = IDL.Record({
  owner: IDL.Principal,
  subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
});

const ledgerIdlFactory = () =>
  IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
  });

type LedgerActor = {
  icrc1_balance_of: (account: {
    owner: Principal;
    subaccount: [] | [Uint8Array];
  }) => Promise<bigint>;
};

export async function queryICPBalance(
  principal: Principal,
  host: string | undefined,
): Promise<bigint> {
  const agent = HttpAgent.createSync({ host });
  const actor = Actor.createActor(ledgerIdlFactory, {
    agent,
    canisterId: ICP_LEDGER_CANISTER_ID,
  }) as unknown as LedgerActor;

  return actor.icrc1_balance_of({ owner: principal, subaccount: [] });
}
