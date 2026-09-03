import { Router, Response } from "express";
import { Budget, Expense, SavingsMovement } from "./db";
import { authMiddleware, AuthenticatedRequest } from "./auth";
import { NotificationQueueManager } from "./notificationQueue";

const router = Router();

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
    .filter((e) => e.category !== "income" && e.category !== "savings")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 3. All Savings Movements across user history
  const movements = await SavingsMovement.find({ userId });
  const totalMovedToSavings = movements
    .filter((m) => m.direction === "to_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const totalMovedFromCurrentBalance = movements
    .filter((m) => m.direction === "to_savings" && m.fundingSource !== "previous_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const totalPreviousSavingsRecorded = movements
    .filter((m) => m.direction === "to_savings" && m.fundingSource === "previous_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const totalReturnedFromSavings = movements
    .filter((m) => m.direction === "from_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  // Available Balance: Main spendable money (Income - Spending Expenses).
  // Has NO relation with savings balances or previous savings.
  const availableBalance = allIncome - allSpendingExpenses;

  // Cumulative Cash Savings
  const cashSavings = movements
    .filter((m) => m.source === "cash")
    .reduce(
      (acc, m) =>
        m.direction === "to_savings" ? acc + Number(m.amount) : acc - Number(m.amount),
      0
    );

  // Cumulative GPay / UPI Savings
  const gpaySavings = movements
    .filter((m) => m.source === "gpay_upi")
    .reduce(
      (acc, m) =>
        m.direction === "to_savings" ? acc + Number(m.amount) : acc - Number(m.amount),
      0
    );

  // Total Savings
  const totalSavings = cashSavings + gpaySavings;

  // Total Money (Reference: Available Balance + Total Savings)
  const totalMoney = availableBalance + totalSavings;

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
    .filter((m) => m.direction === "to_savings" && m.source === "cash")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthMovedToGpay = monthMovements
    .filter((m) => m.direction === "to_savings" && m.source === "gpay_upi")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthReturnedFromCash = monthMovements
    .filter((m) => m.direction === "from_savings" && m.source === "cash")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthReturnedFromGpay = monthMovements
    .filter((m) => m.direction === "from_savings" && m.source === "gpay_upi")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthMovedFromCurrentBalance = monthMovements
    .filter((m) => m.direction === "to_savings" && m.fundingSource !== "previous_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const monthPreviousSavingsRecorded = monthMovements
    .filter((m) => m.direction === "to_savings" && m.fundingSource === "previous_savings")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

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
    allSpendingExpenses,
    totalMovedToSavings,
    totalMovedFromCurrentBalance,
    totalPreviousSavingsRecorded,
    totalReturnedFromSavings,
    availableBalance,
    cashSavings,
    gpaySavings,
    totalSavings,
    totalMoney,
    monthSavingsGoal,
    monthMovedToSavings,
    monthMovedFromCurrentBalance,
    monthPreviousSavingsRecorded,
    monthReturnedFromSavings,
    monthMovedToCash,
    monthMovedToGpay,
    monthReturnedFromCash,
    monthReturnedFromGpay,
    netMonthSavings,
    monthSavingsProgress,
    savingsGoalPercentage,
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
      gpaySavings: data.gpaySavings,
      totalSavings: data.totalSavings,
      availableBalance: data.availableBalance,
      totalMoney: data.totalMoney,
      month: data.month,
      monthSavingsGoal: data.monthSavingsGoal,
      monthMovedToSavings: data.monthMovedToSavings,
      monthReturnedFromSavings: data.monthReturnedFromSavings,
      monthMovedToCash: data.monthMovedToCash,
      monthMovedToGpay: data.monthMovedToGpay,
      monthReturnedFromCash: data.monthReturnedFromCash,
      monthReturnedFromGpay: data.monthReturnedFromGpay,
      previousSavingsRecorded: data.totalPreviousSavingsRecorded,
      monthPreviousSavingsRecorded: data.monthPreviousSavingsRecorded,
      netMonthSavings: data.netMonthSavings,
      monthSavingsProgress: data.monthSavingsProgress,
      savingsGoalPercentage: data.savingsGoalPercentage,
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

  const { amount, direction, source, fundingSource = "current_balance", date, note } = req.body;

  // 1. Validate Amount
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Please enter a valid amount greater than 0." });
    return;
  }
  // Safe precision (cents/paisa)
  const safeAmount = Math.round(numAmount * 100) / 100;

  // 2. Validate Direction
  if (direction !== "to_savings" && direction !== "from_savings") {
    res.status(400).json({ error: "Invalid transfer direction. Must be 'to_savings' or 'from_savings'." });
    return;
  }

  // 3. Validate Source
  if (source !== "cash" && source !== "gpay_upi") {
    res.status(400).json({ error: "Invalid savings location. Must be 'cash' or 'gpay_upi'." });
    return;
  }

  try {
    // Check current cumulative balances
    const current = await getUserCumulativeFinancials(userId);

    // Validate transfer limits
    if (direction === "to_savings") {
      // Adding savings has NO relation with current available balance in dashboard or analytics.
      // User can add any amount freely.
    } else if (direction === "from_savings") {
      // Withdraw bound check
      const maxAvailableInSource = source === "cash" ? current.cashSavings : current.gpaySavings;
      const sourceName = source === "cash" ? "Cash Savings" : "GPay / UPI Savings";

      if (safeAmount > maxAvailableInSource) {
        res.status(400).json({
          error: `Cannot withdraw ₹${safeAmount} from ${sourceName}. You only have ₹${maxAvailableInSource} saved there.`,
        });
        return;
      }
    }

    // Record movement in Database
    const newMovement = await SavingsMovement.create({
      userId,
      amount: safeAmount,
      direction,
      source,
      fundingSource: direction === "to_savings" ? (fundingSource || "current_balance") : "current_balance",
      date: date || new Date().toISOString().split("T")[0],
      note: note || "",
    });

    const sourceLabel = source === "cash" ? "Cash Savings" : "GPay / UPI Savings";

    // Enqueue notification
    if (direction === "to_savings") {
      if (fundingSource === "previous_savings") {
        NotificationQueueManager.enqueueNotification(
          userId,
          "success",
          "Previous Savings Recorded",
          `Recorded ₹${safeAmount} of previous/starting savings in ${sourceLabel}. Future savings added in new months will build on top of this.`
        );
      } else {
        NotificationQueueManager.enqueueNotification(
          userId,
          "success",
          "Moved to Savings",
          `Moved ₹${safeAmount} from Available Balance to ${sourceLabel}.`
        );
      }
    } else {
      NotificationQueueManager.enqueueNotification(
        userId,
        "info",
        "Returned to Available Balance",
        `Returned ₹${safeAmount} from ${sourceLabel} to Available Balance.`
      );
    }

    // Return fresh updated snapshot
    const updated = await getUserCumulativeFinancials(userId);
    res.status(201).json({
      message:
        direction === "to_savings"
          ? fundingSource === "previous_savings"
            ? `Recorded ₹${safeAmount} as previous savings in ${sourceLabel}.`
            : `Moved ₹${safeAmount} to ${sourceLabel}.`
          : `Returned ₹${safeAmount} from ${sourceLabel} to Available Balance.`,
      movement: newMovement,
      cashSavings: updated.cashSavings,
      gpaySavings: updated.gpaySavings,
      totalSavings: updated.totalSavings,
      availableBalance: updated.availableBalance,
      totalMoney: updated.totalMoney,
      netMonthSavings: updated.netMonthSavings,
    });
  } catch (error) {
    console.error("Error executing savings transfer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
