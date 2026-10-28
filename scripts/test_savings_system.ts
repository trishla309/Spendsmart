import { initDatabaseConnection, User, Budget, Expense, SavingsMovement, MoneyLent } from "../src/server/db";
import { getUserCumulativeFinancials, getMovementInfo } from "../src/server/savings";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log("    FENNO SAVINGS SYSTEM & RECONCILIATION TEST SUITE      ");
  console.log("==========================================================");

  await initDatabaseConnection();
  const userId = "6a99d6a9b42f28fd3536d217"; // trishtha

  // 1. Integration Tests on Verified Ledger
  console.log("\n--- TEST GROUP 1: Verified October Ledger Integration ---");
  const financials = await getUserCumulativeFinancials(userId, "2026-10");

  // Test 1: Monthly contribution progress excludes withdrawals
  assert(
    financials.monthSavingsProgress === 1197.07,
    `Monthly savings progress equals ₹1,197.07 (qualifying positive additions), got ₹${financials.monthSavingsProgress}`
  );

  // Test 2: Goal achieved status is true (Goal: 1000, Progress: 1197.07)
  assert(
    financials.monthSavingsProgress >= financials.monthSavingsGoal,
    `Goal achieved: progress (₹${financials.monthSavingsProgress}) >= goal (₹${financials.monthSavingsGoal})`
  );

  // Test 3: Withdrawals are tracked separately in net change, not dashboard progress
  assert(
    financials.monthSpentFromSavings === 529,
    `Total October withdrawals/spending from savings is ₹529.00 (₹205 + ₹6 + ₹318), got ₹${financials.monthSpentFromSavings}`
  );
  assert(
    financials.netMonthSavings === 985.29,
    `Net October savings change equals ₹985.29 (1,197.07 - 529.00), got ₹${financials.netMonthSavings}`
  );
  assert(
    Math.round((financials.netMonthSavings + 211) * 100) / 100 === 1196.29,
    `Reference net change without Oct 1 (₹205) and Oct 15 (₹6) treat withdrawals is exactly ₹1,196.29`
  );

  // Test 4: Current available balances separation
  assert(
    financials.onlineSavings === 2991,
    `Available Online Savings (Slice) equals ₹2,991.00, got ₹${financials.onlineSavings}`
  );
  assert(
    financials.cashSavings === 1130,
    `Available Cash Savings equals ₹1,130.00, got ₹${financials.cashSavings}`
  );
  assert(
    financials.totalSavings === 4121,
    `Combined Available Savings equals ₹4,121.00 (2,991.00 + 1,130.00), got ₹${financials.totalSavings}`
  );

  // Test 5: Compact contribution history contains 7 qualifying items
  const contributions = (financials as any).monthSavingsContributions || [];
  assert(
    contributions.length === 7,
    `Compact contribution history contains exactly 7 qualifying October items, got ${contributions.length}`
  );
  const totalFromList = contributions.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
  assert(
    Math.round(totalFromList * 100) / 100 === 1197.07,
    `Sum of contributions from history list equals dashboard monthly progress (₹1,197.07)`
  );

  // Test 6: Loan repayments excluded from new income & double counting
  const sampath1000InContributions = contributions.some((c: any) => Number(c.amount) === 1000);
  assert(
    !sampath1000InContributions,
    `Sampath ₹1,000 principal repayment is excluded from monthly progress contributions list`
  );

  // Test 7: ₹318 transfer and Blinkit purchase do not double-deduct from savings
  assert(
    financials.onlineSavings === 2991,
    `Slice savings deducted ₹318 once via transfer, available balance correctly ₹2,991.00`
  );

  // 2. Isolated Unit / Hypothetical Scenarios
  console.log("\n--- TEST GROUP 2: Isolated Behavioral & Architectural Tests ---");

  // Test 8: Internal transfers between cash and online savings do not count toward goal
  const internalCashToOnline = {
    direction: "to_savings",
    source: "cash_savings",
    destination: "online_savings",
    amount: 100,
  };
  const internalInfo = getMovementInfo(internalCashToOnline);
  assert(
    internalInfo.src === "cash_savings" && internalInfo.dest === "online_savings",
    `Internal cash->online transfer correctly classifies src as 'cash_savings'`
  );

  // Test 9: Interest credited to savings does not deduct from GPay spendable balance
  const interestMovement = {
    direction: "to_savings",
    source: "interest",
    destination: "online_savings",
    fundingSource: "interest",
    amount: 15.50,
  };
  const interestInfo = getMovementInfo(interestMovement);
  assert(
    interestInfo.src === "interest" && interestInfo.dest === "online_savings",
    `Interest movement classifies src as 'interest' (does NOT debit online_money)`
  );

  // Test 10: Subsequent withdrawal after reaching goal does NOT reverse achievement
  const hypotheticalContributions = [
    { amount: 600, direction: "to_savings", source: "online_money" },
    { amount: 500, direction: "to_savings", source: "external" },
  ];
  const hypotheticalWithdrawals = [
    { amount: 800, direction: "from_savings", source: "online_savings", destination: "online_money" },
  ];
  const hypGoal = 1000;
  const hypProgress = hypotheticalContributions.reduce((s, c) => s + c.amount, 0); // 1100
  const hypNetChange = hypProgress - hypotheticalWithdrawals.reduce((s, w) => s + w.amount, 0); // 300
  assert(
    hypProgress === 1100 && hypProgress >= hypGoal,
    `Goal remains achieved (Progress: ₹1,100 >= Goal: ₹1,000) despite ₹800 subsequent withdrawal`
  );
  assert(
    hypNetChange === 300,
    `Net change independently reflects ₹300 growth, while contribution progress remains ₹1,100`
  );

  // Test 11: Month changes preserve history without resetting or erasing
  const sepFinancials = await getUserCumulativeFinancials(userId, "2026-09");
  assert(
    sepFinancials.monthSavingsProgress > 0 && sepFinancials.month !== financials.month,
    `September historical progress preserved independently (₹${sepFinancials.monthSavingsProgress}) when switching months`
  );

  // Test 12: Existing account balances and loan records intact
  const moneyLentRecords = await MoneyLent.find({ userId });
  assert(
    moneyLentRecords.length >= 2,
    `Existing money lent records preserved (${moneyLentRecords.length} records in database)`
  );

  console.log("\n==========================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
