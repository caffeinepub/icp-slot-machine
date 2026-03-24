import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { Identity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { loadConfig } from "../config";

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const ICP_FEE = BigInt(10_000);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const approveIdlFactory = ({ IDL }: { IDL: any }) => {
  const Subaccount = IDL.Vec(IDL.Nat8);
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount),
  });
  const ApproveArgs = IDL.Record({
    from_subaccount: IDL.Opt(Subaccount),
    spender: Account,
    amount: IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const ApproveError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
    Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });
  const ApproveResult = IDL.Variant({ Ok: IDL.Nat, Err: ApproveError });
  return IDL.Service({
    icrc2_approve: IDL.Func([ApproveArgs], [ApproveResult], []),
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transferIdlFactory = ({ IDL }: { IDL: any }) => {
  const Subaccount = IDL.Vec(IDL.Nat8);
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount),
  });
  const TransferArg = IDL.Record({
    from_subaccount: IDL.Opt(Subaccount),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });
  const TransferResult = IDL.Variant({ Ok: IDL.Nat, Err: TransferError });
  return IDL.Service({
    icrc1_transfer: IDL.Func([TransferArg], [TransferResult], []),
  });
};

export async function approveICP(
  identity: Identity,
  spenderCanisterId: string,
  approvalAmount: bigint,
): Promise<void> {
  const config = await loadConfig();
  const agent = new HttpAgent({
    identity,
    host: config.backend_host,
  });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(console.warn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ledger = Actor.createActor(approveIdlFactory, {
    agent,
    canisterId: ICP_LEDGER_CANISTER_ID,
  }) as any;

  const result = await ledger.icrc2_approve({
    from_subaccount: [],
    spender: {
      owner: Principal.fromText(spenderCanisterId),
      subaccount: [],
    },
    amount: approvalAmount,
    expected_allowance: [],
    expires_at: [],
    fee: [ICP_FEE],
    memo: [],
    created_at_time: [BigInt(Date.now()) * BigInt(1_000_000)],
  });

  if (result && "Err" in result) {
    const errKey = Object.keys(result.Err)[0] ?? "Unknown";
    const errVal = result.Err[errKey];
    const errMsg =
      errKey === "GenericError" && errVal?.message
        ? `${errKey}: ${errVal.message}`
        : errKey;
    throw new Error(`ICP Approve fehlgeschlagen: ${errMsg}`);
  }
}

export async function transferICP(
  identity: Identity,
  toPrincipalText: string,
  amountE8s: bigint,
  backendHost?: string,
): Promise<void> {
  const config = await loadConfig();
  const host = backendHost ?? config.backend_host;
  const agent = new HttpAgent({
    identity,
    host,
  });
  if (host?.includes("localhost")) {
    await agent.fetchRootKey().catch(console.warn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ledger = Actor.createActor(transferIdlFactory, {
    agent,
    canisterId: ICP_LEDGER_CANISTER_ID,
  }) as any;

  const result = await ledger.icrc1_transfer({
    from_subaccount: [],
    to: {
      owner: Principal.fromText(toPrincipalText),
      subaccount: [],
    },
    amount: amountE8s,
    fee: [ICP_FEE],
    memo: [],
    created_at_time: [],
  });

  if (result && "Err" in result) {
    const errKey = Object.keys(result.Err)[0] ?? "Unknown";
    const errVal = result.Err[errKey];
    let errMsg = errKey;
    if (errKey === "InsufficientFunds") {
      errMsg = "Nicht genug ICP auf deinem Konto";
    } else if (errKey === "BadFee") {
      errMsg = "Ungültige Transaktionsgebühr";
    } else if (errKey === "GenericError" && errVal?.message) {
      errMsg = `Fehler: ${errVal.message}`;
    } else if (errKey === "TemporarilyUnavailable") {
      errMsg = "Ledger vorübergehend nicht verfügbar";
    }
    throw new Error(`ICP Transfer fehlgeschlagen: ${errMsg}`);
  }
}
