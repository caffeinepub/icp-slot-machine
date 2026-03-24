// ICP Slot Machine - Real ICP transactions via ICRC-1/ICRC-2 ledger

import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor self {
  ///// ACCESS CONTROL /////
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  ///// UPGRADE COMPATIBILITY: kept from previous version /////
  // These vars existed in the old version and must stay to allow upgrade.
  let ENTRY_FEE : Nat = 500_000_000;
  let MAX_BET : Nat = 20;
  let SYMBOL_WEIGHTS : [Nat] = [2, 5, 8, 15, 20, 20];
  var poolBalance : Nat = 0;

  ///// LEDGER INTERFACE /////
  type Account = { owner : Principal; subaccount : ?[Nat8] };
  type TransferArg = {
    from_subaccount : ?[Nat8];
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };
  type TransferFromArg = {
    spender_subaccount : ?[Nat8];
    from : Account;
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };
  type TransferResult = { #Ok : Nat; #Err : TransferError };
  type TransferFromResult = { #Ok : Nat; #Err : TransferFromError };
  type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };
  type TransferFromError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #InsufficientAllowance : { allowance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  let ledger = actor "ryjl3-tyaaa-aaaaa-aaaba-cai" : actor {
    icrc1_balance_of : (Account) -> async Nat;
    icrc1_transfer : (TransferArg) -> async TransferResult;
    icrc2_transfer_from : (TransferFromArg) -> async TransferFromResult;
  };

  let ICP_FEE : Nat = 10_000;

  ///// TYPES /////
  // PlayerStats keeps old field names for upgrade compatibility.
  // totalWon = total ICP won (e8s), totalSpent = total ICP spent (e8s).
  type Symbol = { #seven; #bar; #bell; #cherry; #orange; #lemon };
  public type PlayerStats = {
    hasPaid : Bool;   // kept for upgrade compat (unused in new logic)
    totalSpins : Nat;
    totalWon : Nat;   // e8s
    totalSpent : Nat; // e8s
  };
  public type SpinResult = {
    reels : [Symbol];
    multiplierBps : Nat;
    payout : Nat;
    won : Bool;
  };
  type WinRecord = {
    player : Principal;
    payout : Nat;
    reels : [Symbol];
    timestamp : Int;
  };
  public type UserProfile = { name : Text; email : ?Text };

  ///// STATE /////
  type PlayerId = Principal;
  let players = Map.empty<PlayerId, PlayerStats>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var recentWins : [WinRecord] = [];
  let spinningPlayers = Map.empty<Principal, Bool>();

  ///// SYMBOL LOGIC /////
  let TOTAL_WEIGHT : Nat = 70;

  func getSymbol(rand : Nat) : Symbol {
    let r = rand % TOTAL_WEIGHT;
    if (r < 2) { #seven }
    else if (r < 7) { #bar }
    else if (r < 15) { #bell }
    else if (r < 30) { #cherry }
    else if (r < 50) { #orange }
    else { #lemon };
  };

  func symbolEq(a : Symbol, b : Symbol) : Bool {
    switch (a, b) {
      case (#seven, #seven) { true };
      case (#bar, #bar) { true };
      case (#bell, #bell) { true };
      case (#cherry, #cherry) { true };
      case (#orange, #orange) { true };
      case (#lemon, #lemon) { true };
      case _ { false };
    };
  };

  func calcMultiplierBps(s0 : Symbol, s1 : Symbol, s2 : Symbol) : Nat {
    if (symbolEq(s0, s1) and symbolEq(s1, s2)) {
      switch (s0) {
        case (#seven) { 10000 };
        case (#bar) { 2000 };
        case (#bell) { 800 };
        case (#cherry) { 1000 };
        case (#orange) { 500 };
        case (#lemon) { 500 };
      };
    } else {
      let twoMatch = symbolEq(s0, s1) or symbolEq(s1, s2) or symbolEq(s0, s2);
      if (twoMatch) {
        let s = if (symbolEq(s0, s1)) { s0 } else if (symbolEq(s1, s2)) { s1 } else { s0 };
        switch (s) {
          case (#seven) { 300 };
          case (#bar) { 200 };
          case (#cherry) { 150 };
          case _ { 0 };
        };
      } else if (symbolEq(s0, #cherry) or symbolEq(s1, #cherry) or symbolEq(s2, #cherry)) {
        50;
      } else {
        0;
      };
    };
  };

  func isValidBet(amount : Nat) : Bool {
    amount == 10_000_000 or amount == 50_000_000 or amount == 100_000_000 or amount == 250_000_000 or amount == 1_000_000_000;
  };

  func compareByWins(a : (Principal, PlayerStats), b : (Principal, PlayerStats)) : Order.Order {
    Nat.compare(b.1.totalWon, a.1.totalWon);
  };

  ///// PUBLIC ENDPOINTS /////

  public shared ({ caller }) func spin(betAmountE8s : Nat) : async SpinResult {
    if (caller.isAnonymous()) {
      Runtime.trap("Login required");
    };
    if (not isValidBet(betAmountE8s)) {
      Runtime.trap("Invalid bet. Use 0.1, 0.5, 1, 2.5 or 10 ICP");
    };
    if (spinningPlayers.get(caller) == ?true) {
      Runtime.trap("Spin already in progress");
    };
    spinningPlayers.add(caller, true);

    // Collect bet via ICRC-2
    let collectResult = await ledger.icrc2_transfer_from({
      spender_subaccount = null;
      from = { owner = caller; subaccount = null };
      to = { owner = Principal.fromActor(self); subaccount = null };
      amount = betAmountE8s - ICP_FEE;
      fee = ?ICP_FEE;
      memo = null;
      created_at_time = null;
    });

    switch (collectResult) {
      case (#Err(e)) {
        spinningPlayers.remove(caller);
        switch (e) {
          case (#InsufficientFunds _) { Runtime.trap("Insufficient ICP balance") };
          case (#InsufficientAllowance _) { Runtime.trap("Please approve the casino canister first") };
          case _ { Runtime.trap("Transfer failed") };
        };
      };
      case (#Ok(_)) {};
    };

    // Generate reel results using time + caller hash as entropy
    let seed = Int.abs(Time.now());
    let callerHash = caller.hash().toNat();
    let r0 = seed % TOTAL_WEIGHT;
    let r1 = (seed / TOTAL_WEIGHT + callerHash) % TOTAL_WEIGHT;
    let r2 = (seed / (TOTAL_WEIGHT * TOTAL_WEIGHT) + callerHash * 2 + 1) % TOTAL_WEIGHT;

    let s0 = getSymbol(r0);
    let s1 = getSymbol(r1);
    let s2 = getSymbol(r2);
    let reels = [s0, s1, s2];

    let multiplierBps = calcMultiplierBps(s0, s1, s2);
    let grossPayout = betAmountE8s * multiplierBps / 100;

    var actualPayout : Nat = 0;
    if (grossPayout > ICP_FEE * 2) {
      let payoutNet = grossPayout - ICP_FEE;
      let payResult = await ledger.icrc1_transfer({
        from_subaccount = null;
        to = { owner = caller; subaccount = null };
        amount = payoutNet;
        fee = ?ICP_FEE;
        memo = null;
        created_at_time = null;
      });
      switch (payResult) {
        case (#Ok(_)) { actualPayout := grossPayout };
        case (#Err(_)) {};
      };
    };

    // Update stats
    let stats = switch (players.get(caller)) {
      case (null) { { hasPaid = false; totalSpins = 0; totalWon = 0; totalSpent = 0 } };
      case (?s) { s };
    };
    players.add(caller, {
      hasPaid = stats.hasPaid;
      totalSpins = stats.totalSpins + 1;
      totalWon = stats.totalWon + actualPayout;
      totalSpent = stats.totalSpent + betAmountE8s;
    });

    if (actualPayout > 0) {
      let newRecord = { player = caller; payout = actualPayout; reels; timestamp = Time.now() };
      let oldSize = recentWins.size();
      let newSize = if (oldSize >= 50) { 50 } else { oldSize + 1 };
      recentWins := Array.tabulate<WinRecord>(newSize, func(i) {
        if (i == 0) { newRecord } else { recentWins[i - 1] };
      });
    };

    spinningPlayers.remove(caller);
    { reels; multiplierBps; payout = actualPayout; won = actualPayout > 0 };
  };

  public shared ({ caller }) func getMyICPBalance() : async Nat {
    if (caller.isAnonymous()) { return 0 };
    await ledger.icrc1_balance_of({ owner = caller; subaccount = null });
  };

  public shared func getPoolBalance() : async Nat {
    await ledger.icrc1_balance_of({ owner = Principal.fromActor(self); subaccount = null });
  };

  public query ({ caller }) func getMyStats() : async PlayerStats {
    switch (players.get(caller)) {
      case (null) { { hasPaid = false; totalSpins = 0; totalWon = 0; totalSpent = 0 } };
      case (?s) { s };
    };
  };

  // Kept for frontend compatibility
  public query ({ caller }) func getMyInfo() : async PlayerStats {
    switch (players.get(caller)) {
      case (null) { { hasPaid = false; totalSpins = 0; totalWon = 0; totalSpent = 0 } };
      case (?s) { s };
    };
  };

  public query func getRecentWins() : async [WinRecord] {
    let limit = if (recentWins.size() < 10) { recentWins.size() } else { 10 };
    Array.tabulate<WinRecord>(limit, func(i) { recentWins[i] });
  };

  public query func getLeaderboard() : async [(Principal, PlayerStats)] {
    let all = players.toArray();
    let sorted = all.sort(compareByWins);
    let limit = if (sorted.size() < 10) { sorted.size() } else { 10 };
    Array.tabulate<(Principal, PlayerStats)>(limit, func(i) { sorted[i] });
  };

  ///// USER PROFILE /////
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Login required") };
    userProfiles.add(caller, profile);
  };
};
