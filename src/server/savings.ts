import { Router, Response } from "express";
import { Budget, Expense, SavingsMovement } from "./db";
import { authMiddleware, AuthenticatedRequest } from "./auth";
import { NotificationQueueManager } from "./notificationQueue";

const router = Router();

// Helper to classify movement source & destination
export function getMovementInfo(m: any) {
  const isToSavings = m.direction === "to_savings";
  const rawSource = (m.source || "").toLowerCase();
  const rawDest = (m.destination || "").toLowerCase();

  let dest = rawDest;
  let src = rawSource;

  if (isToSavings) {
    if (rawDest === "cash" || rawDest === "cash_savings" || rawSource === "cash" || rawSource === "cash_savings") {
      dest = "cash_savings";
    } else {
      dest = "online_savings";
    }
    src = m.fundingSource === "previous_savings" ? "previous_savings" : "online_money";
  } else {
    if (rawSource === "cash" || rawSource === "cash_savings") {
      src = "cash_savings";
    } else {
      src = "online_savings";
    }
    dest = "online_money";
  }

  return { src, dest, isToSavings };
}

// Helper to compute cumulative financial snapshot for a user
export async function getUserCumulativeFinancials(userId: string, selectedMonth?: string) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = selectedMonth || currentMonthStr;

  // 1. All Budgets across user history
  const allBudgets = await Budget.find({ userId });
  const totalPocketMoney = allBudgets.reduce(
    (sum, b) => sum + (Number(b.pocketMoney) || 0),
    0
  );

  // 2. All Expenses across user history
  const allExpenses = await Expense.find({ userId });
  const totalIncomeExpenses = allExpenses
    .filter((e) => e.category === "income")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const allIncome = totalPocketMoney + totalIncomeExpenses;

  const allSpendingExpenses = allExpenses
    .filter((e) => e.category !== "income" && e.category !== "savings");

  const allOnlineExpenses = allSpendingExpenses
    .filter((e) => (e.paidUsing || "online").toLowerCase() !== "cash")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const allCashExpenses = allSpendingExpenses
    .filter((e) => (e.paidUsing || "online").toLowerCase() === "cash")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalSpendingExpenses = allOnlineExpenses + allCashExpenses;

  // 3. All Savings Movements across user history
  const movements = await SavingsMovement.find({ userId });

  let totalOnlineSavingsIn = 0;
  let totalOnlineSavingsOut = 0;
  let totalCashSavingsIn = 0;
  let totalCashSavingsOut = 0;
  let totalMovedFromOnlineMoney = 0;
  let totalPreviousSavingsRecorded = 0;

  movements.forEach((m) => {
    const amt = Number(m.amount) || 0;
    const info = getMovementInfo(m);

    if (info.dest === "online_savings") {
      totalOnlineSavingsIn += amt;
    } else if (info.dest === "cash_savings") {
      totalCashSavingsIn += amt;
    }

    if (info.src === "online_savings") {
      totalOnlineSavingsOut += amt;
    } else if (info.src === "cash_savings") {
      totalCashSavingsOut += amt;
    }

    if (info.src === "online_money") {
      totalMovedFromOnlineMoney += amt;
    } else if (info.src === "previous_savings") {
      totalPreviousSavingsRecorded += amt;
    }
  });

  const totalReturnedToOnlineMoney = totalOnlineSavingsOut + totalCashSavingsOut;

  // Cumulative Buckets
  // 1. Online Savings (Intentionally kept aside digitally)
  const onlineSavings = Math.max(0, Math.round((totalOnlineSavingsIn - totalOnlineSavingsOut) * 100) / 100);
  const gpaySavings = onlineSavings; // backward compatibility

  // 2. Cash Savings (Physical cash kept aside; cash expenses deduct from here)
  const cashSavings = Math.max(0, Math.round((totalCashSavingsIn - totalCashSavingsOut - allCashExpenses) * 100) / 100);

  // Total Savings = Online Savings + Cash Savings
  const totalSavings = Math.round((onlineSavings + cashSavings) * 100) / 100;

  // 3. Online Money (Spendable funds for online expenses and savings deposits)
  const onlineMoney = Math.round((allIncome - allOnlineExpenses - totalMovedFromOnlineMoney + totalReturnedToOnlineMoney) * 100) / 100;
  const availableBalance = onlineMoney; // backward compatibility

  // Total Money (Reference: Online Money + Total Savings == Total Income - All Expenses)
  const totalMoney = Math.round((onlineMoney + totalSavings) * 100) / 100;

  // Month-specific calculations (for monthly goals and monthly movements)
  const monthBudget = allBudgets.find((b) => b.month === month);
  const monthSavingsGoal = monthBudget ? Number(monthBudget.savingsGoal) || 0 : 0;

  const monthMovements = movements.filter((m) => m.date && m.date.startsWith(month));
  const monthMovedToSavings = monthMovements
    .filter((m) => m.direction === "to_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthReturnedFromSavings = monthMovements
    .filter((m) => m.direction === "from_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthMovedToCash = monthMovements
    .filter((m) => m.direction === "to_savings" && getMovementInfo(m).dest === "cash_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthMovedToOnline = monthMovements
    .filter((m) => m.direction === "to_savings" && getMovementInfo(m).dest === "online_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthReturnedFromCash = monthMovements
    .filter((m) => m.direction === "from_savings" && getMovementInfo(m).src === "cash_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthReturnedFromOnline = monthMovements
    .filter((m) => m.direction === "from_savings" && getMovementInfo(m).src === "online_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthMovedFromCurrentBalance = monthMovements
    .filter((m) => m.direction === "to_savings" && m.fundingSource !== "previous_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthPreviousSavingsRecorded = monthMovements
    .filter((m) => m.direction === "to_savings" && m.fundingSource === "previous_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  // Cash expenses spent directly from cash savings in this month
  const monthCashExpenses = allSpendingExpenses
    .filter((e) => (e.paidUsing || "online").toLowerCase() === "cash" && e.date && e.date.startsWith(month))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Total spent from savings this month (money moved back to main online account to spend + direct cash expenses)
  const monthSpentFromSavings = Math.round((monthReturnedFromSavings + monthCashExpenses) * 100) / 100;

  // Net Savings for Selected Month = Money Moved from current income/pocket money - Money Returned
  const netMonthSavings = monthMovedFromCurrentBalance - monthReturnedFromSavings;
  const monthSavingsProgress = Math.max(0, netMonthSavings);
  const savingsGoalPercentage =
    monthSavingsGoal > 0
      ? Math.min(100, Math.round((monthSavingsProgress / monthSavingsGoal) * 100))
      : 0;
  const remainingSavingsRequired = Math.max(0, monthSavingsGoal - monthSavingsProgress);

  return {
    month,
    allIncome,
    allSpendingExpenses: totalSpendingExpenses,
    allOnlineExpenses,
    allCashExpenses,
    totalMovedToSavings: totalOnlineSavingsIn + totalCashSavingsIn,
    totalMovedFromCurrentBalance: totalMovedFromOnlineMoney,
    totalPreviousSavingsRecorded,
    totalReturnedFromSavings: totalReturnedToOnlineMoney,
    onlineMoney,
    availableBalance,
    cashSavings,
    onlineSavings,
    gpaySavings,
    totalSavings,
    totalMoney,
    monthSavingsGoal,
    monthMovedToSavings,
    monthMovedFromCurrentBalance,
    monthPreviousSavingsRecorded,
    monthReturnedFromSavings,
    monthMovedToCash,
    monthMovedToOnline,
    monthMovedToGpay: monthMovedToOnline,
    monthReturnedFromCash,
    monthReturnedFromOnline,
    monthReturnedFromGpay: monthReturnedFromOnline,
    netMonthSavings,
    monthSavingsProgress,
    savingsGoalPercentage,
    monthCashExpenses,
    monthSpentFromSavings,
    remainingSavingsRequired,
    movements,
  };
}

// GET /api/savings - Returns complete savings summary and activity
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const selectedMonth = req.query.month as string | undefined;

  try {
    const data = await getUserCumulativeFinancials(userId, selectedMonth);

    // Sort movements newest first by date, then createdAt
    const sortedMovements = [...data.movements].sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    res.json({
      cashSavings: data.cashSavings,
      onlineSavings: data.onlineSavings,
      gpaySavings: data.onlineSavings,
      totalSavings: data.totalSavings,
      onlineMoney: data.onlineMoney,
      availableBalance: data.onlineMoney,
      totalMoney: data.totalMoney,
      month: data.month,
      monthSavingsGoal: data.monthSavingsGoal,
      monthMovedToSavings: data.monthMovedToSavings,
      monthReturnedFromSavings: data.monthReturnedFromSavings,
      monthMovedToCash: data.monthMovedToCash,
      monthMovedToOnline: data.monthMovedToOnline,
      monthMovedToGpay: data.monthMovedToOnline,
      monthReturnedFromCash: data.monthReturnedFromCash,
      monthReturnedFromOnline: data.monthReturnedFromOnline,
      monthReturnedFromGpay: data.monthReturnedFromOnline,
      previousSavingsRecorded: data.totalPreviousSavingsRecorded,
      monthPreviousSavingsRecorded: data.monthPreviousSavingsRecorded,
      netMonthSavings: data.netMonthSavings,
      monthSavingsProgress: data.monthSavingsProgress,
      savingsGoalPercentage: data.savingsGoalPercentage,
      monthCashExpenses: data.monthCashExpenses,
      monthSpentFromSavings: data.monthSpentFromSavings,
      remainingSavingsRequired: data.remainingSavingsRequired,
      movements: sortedMovements,
    });
  } catch (error) {
    console.error("Error fetching savings data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/savings/transfer - Perform internal transfer to/from savings
router.post("/transfer", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { amount, direction, source, destination, fundingSource = "current_balance", date, note } = req.body;

  // 1. Validate Amount
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Please enter a valid amount greater than 0." });
    return;
  }
  const safeAmount = Math.round(numAmount * 100) / 100;

  // 2. Normalize and validate direction
  if (direction !== "to_savings" && direction !== "from_savings") {
    res.status(400).json({ error: "Invalid transfer direction. Must be 'to_savings' or 'from_savings'." });
    return;
  }

  // 3. Resolve source and destination
  let resolvedSource = (source || "").toLowerCase();
  let resolvedDest = (destination || "").toLowerCase();

  if (direction === "to_savings") {
    resolvedSource = fundingSource === "previous_savings" ? "previous_savings" : "online_money";
    // Destination can be passed as destination or source (legacy frontend passes source="cash" or "gpay_upi")
    const target = resolvedDest || (source || "").toLowerCase();
    if (target === "cash" || target === "cash_savings") {
      resolvedDest = "cash_savings";
    } else if (target === "online" || target === "online_savings" || target === "gpay_upi") {
      resolvedDest = "online_savings";
    } else {
      res.status(400).json({ error: "Invalid savings destination. Must be 'Cash Savings' or 'Online Savings'." });
      return;
    }
  } else {
    // from_savings: source is savings bucket, destination is online_money
    const fromTarget = resolvedSource || (source || "").toLowerCase();
    if (fromTarget === "cash" || fromTarget === "cash_savings") {
      resolvedSource = "cash_savings";
    } else if (fromTarget === "online" || fromTarget === "online_savings" || fromTarget === "gpay_upi") {
      resolvedSource = "online_savings";
    } else {
      res.status(400).json({ error: "Invalid savings source to withdraw from. Must be 'Cash Savings' or 'Online Savings'." });
      return;
    }
    resolvedDest = "online_money";
  }

  try {
    // Check current cumulative balances
    const current = await getUserCumulativeFinancials(userId);

    // Validate transfer limits for withdrawals
    if (direction === "from_savings") {
      const isCash = resolvedSource === "cash_savings";
      const maxAvailable = isCash ? current.cashSavings : current.onlineSavings;
      const sourceName = isCash ? "Cash Savings" : "Online Savings";

      if (safeAmount > maxAvailable) {
        res.status(400).json({
          error: `Cannot withdraw ₹${safeAmount} from ${sourceName}. You only have ₹${maxAvailable} saved there.`,
        });
        return;
      }
    }

    // Record movement in Database
    const newMovement = await SavingsMovement.create({
      userId,
      amount: safeAmount,
      direction,
      source: resolvedSource,
      destination: resolvedDest,
      fundingSource: direction === "to_savings" ? (fundingSource || "current_balance") : "current_balance",
      date: date || new Date().toISOString().split("T")[0],
      note: note || "",
    });

    const isCashDest = resolvedDest === "cash_savings";
    const isCashSrc = resolvedSource === "cash_savings";
    const destLabel = isCashDest ? "Cash Savings" : "Online Savings";
    const srcLabel = isCashSrc ? "Cash Savings" : "Online Savings";

    // Enqueue notification
    if (direction === "to_savings") {
      if (fundingSource === "previous_savings") {
        NotificationQueueManager.enqueueNotification(
          userId,
          "success",
          "Previous Savings Recorded",
          `Recorded ₹${safeAmount} of previous/starting savings in ${destLabel}. Future savings added in new months will build on top of this.`
        );
      } else {
        NotificationQueueManager.enqueueNotification(
          userId,
          "success",
          "Moved to Savings",
          `Moved ₹${safeAmount} from Online Money to ${destLabel}.`
        );
      }
    } else {
      NotificationQueueManager.enqueueNotification(
        userId,
        "info",
        "Moved to Online Money",
        `Moved ₹${safeAmount} from ${srcLabel} to Online Money.`
      );
    }

    // Return fresh updated snapshot
    const updated = await getUserCumulativeFinancials(userId);
    res.status(201).json({
      message:
        direction === "to_savings"
          ? fundingSource === "previous_savings"
            ? `Recorded ₹${safeAmount} as previous savings in ${destLabel}.`
            : `Moved ₹${safeAmount} from Online Money to ${destLabel}.`
          : `Moved ₹${safeAmount} from ${srcLabel} to Online Money.`,
      movement: newMovement,
      cashSavings: updated.cashSavings,
      onlineSavings: updated.onlineSavings,
      gpaySavings: updated.onlineSavings,
      totalSavings: updated.totalSavings,
      onlineMoney: updated.onlineMoney,
      availableBalance: updated.onlineMoney,
      totalMoney: updated.totalMoney,
      netMonthSavings: updated.netMonthSavings,
    });
  } catch (error) {
    console.error("Error executing savings transfer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
