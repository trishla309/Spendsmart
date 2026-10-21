import { Router, Response } from "express";
import mongoose from "mongoose";
import { MoneyLent, SavingsMovement } from "./db";
import { authMiddleware, AuthenticatedRequest } from "./auth";
import { NotificationQueueManager } from "./notificationQueue";

const router = Router();

// GET /api/money-lent - List all money lent records for current user
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const records = await MoneyLent.find({ userId });

    // Sort newest first by date, then createdAt
    const sorted = records.sort((a: any, b: any) => {
      const dateCmp = (b.date || "").localeCompare(a.date || "");
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    let totalLent = 0;
    let totalReceived = 0;
    let pendingCount = 0;
    let receivedCount = 0;

    sorted.forEach((r: any) => {
      const amt = Number(r.amount) || 0;
      const rec = Number(r.amountReceived) || 0;
      totalLent += amt;
      totalReceived += rec;
      if (r.status === "Received") {
        receivedCount++;
      } else {
        pendingCount++;
      }
    });

    totalLent = Math.round(totalLent * 100) / 100;
    totalReceived = Math.round(totalReceived * 100) / 100;
    const totalOwed = Math.max(0, Math.round((totalLent - totalReceived) * 100) / 100);

    res.json({
      records: sorted,
      summary: {
        totalLent,
        totalReceived,
        totalOwed,
        pendingCount,
        receivedCount,
        totalCount: sorted.length,
      },
    });
  } catch (error) {
    console.error("Error fetching money lent records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/money-lent - Create new Money Lent record
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { personName, amount, date, expectedReturnDate, note, paidUsing, lentFrom } = req.body;

  if (!personName || !personName.trim()) {
    res.status(400).json({ error: "Person's name is required." });
    return;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Please enter a valid amount greater than 0." });
    return;
  }

  if (!date || !date.trim()) {
    res.status(400).json({ error: "Date lent is required." });
    return;
  }

  const safeAmount = Math.round(numAmount * 100) / 100;
  const safePaidUsing = (paidUsing || "online").toLowerCase() === "cash" ? "cash" : "online";

  let safeLentFrom = (lentFrom || "").trim().toLowerCase();
  if (!safeLentFrom) {
    const noteLower = (note || "").toLowerCase();
    if (noteLower.includes("cash savings")) {
      safeLentFrom = "cash_savings";
    } else if (safePaidUsing === "cash" && !noteLower.includes("savings")) {
      safeLentFrom = "cash";
    } else {
      // Default rule: Money lending ALWAYS happens from the user's Online Savings account
      safeLentFrom = "online_savings";
    }
  }

  try {
    const newRecord = await MoneyLent.create({
      userId,
      personName: personName.trim(),
      amount: safeAmount,
      date: date.trim(),
      expectedReturnDate: (expectedReturnDate || "").trim(),
      note: (note || "").trim(),
      paidUsing: safePaidUsing,
      lentFrom: safeLentFrom,
      amountReceived: 0,
      remainingAmount: safeAmount,
      status: "Pending",
      repayments: [],
      updatedAt: new Date().toISOString(),
    });

    // If money was lent from savings, automatically register deduction from savings
    if (safeLentFrom === "online_savings" || safeLentFrom === "cash_savings") {
      await SavingsMovement.create({
        userId,
        amount: safeAmount,
        direction: "from_savings",
        source: safeLentFrom,
        destination: "lent",
        fundingSource: "current_balance",
        date: date.trim(),
        note: (note || "").trim() || `Lent to ${personName.trim()} from ${safeLentFrom === "cash_savings" ? "Cash Savings" : "Online Savings"}`,
      });
    }

    const sourceLabel =
      safeLentFrom === "online_savings"
        ? "Online Savings"
        : safeLentFrom === "cash_savings"
        ? "Cash Savings"
        : safeLentFrom === "cash"
        ? "Cash in Hand"
        : "Online Money";

    NotificationQueueManager.enqueueNotification(
      userId,
      "info",
      "Money Lent Recorded",
      `Recorded ₹${safeAmount} lent to ${personName.trim()} (from ${sourceLabel}).`
    );

    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Error creating money lent record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/money-lent/:id - Update Money Lent record
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { personName, amount, date, expectedReturnDate, note, paidUsing, lentFrom } = req.body;

  try {
    const record = await MoneyLent.findOne({ _id: id, userId });
    if (!record) {
      res.status(404).json({ error: "Money lent record not found." });
      return;
    }

    if (personName !== undefined && !personName.trim()) {
      res.status(400).json({ error: "Person's name cannot be empty." });
      return;
    }

    let safeAmount = record.amount;
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: "Please enter a valid amount greater than 0." });
        return;
      }
      if (numAmount < record.amountReceived) {
        res.status(400).json({
          error: `Total amount cannot be less than the already received repayment of ₹${record.amountReceived}.`,
        });
        return;
      }
      safeAmount = Math.round(numAmount * 100) / 100;
    }

    const newRemaining = Math.max(0, Math.round((safeAmount - record.amountReceived) * 100) / 100);
    const newStatus =
      newRemaining === 0
        ? "Received"
        : record.amountReceived > 0
        ? "Partially Received"
        : "Pending";

    const updateData: any = {
      ...(personName !== undefined ? { personName: personName.trim() } : {}),
      amount: safeAmount,
      remainingAmount: newRemaining,
      status: newStatus,
      ...(date !== undefined ? { date: date.trim() } : {}),
      ...(expectedReturnDate !== undefined ? { expectedReturnDate: (expectedReturnDate || "").trim() } : {}),
      ...(note !== undefined ? { note: (note || "").trim() } : {}),
      ...(paidUsing !== undefined ? { paidUsing: paidUsing === "cash" ? "cash" : "online" } : {}),
      ...(lentFrom !== undefined ? { lentFrom: String(lentFrom).trim().toLowerCase() } : {}),
      updatedAt: new Date().toISOString(),
    };

    await MoneyLent.updateOne({ _id: id, userId }, updateData);
    const updated = await MoneyLent.findOne({ _id: id, userId });
    res.json(updated);
  } catch (error) {
    console.error("Error updating money lent record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/money-lent/:id/repayments - Record repayment
router.post("/:id/repayments", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { amount, date, note, paidUsing, depositTo } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Please enter a valid repayment amount greater than 0." });
    return;
  }

  const safeAmount = Math.round(numAmount * 100) / 100;

  try {
    const record = await MoneyLent.findOne({ _id: id, userId });
    if (!record) {
      res.status(404).json({ error: "Money lent record not found." });
      return;
    }

    if (record.status === "Received" || record.remainingAmount <= 0) {
      res.status(400).json({ error: "This money lent record has already been fully received." });
      return;
    }

    if (safeAmount > record.remainingAmount) {
      res.status(400).json({
        error: `Repayment of ₹${safeAmount} exceeds the remaining balance of ₹${record.remainingAmount}.`,
      });
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const safePaidUsing: "online" | "cash" = (paidUsing || "online").toLowerCase() === "cash" ? "cash" : "online";
    const newRepayment = {
      _id: new mongoose.Types.ObjectId().toString(),
      amount: safeAmount,
      date: (date || todayStr).trim(),
      note: (note || "").trim(),
      paidUsing: safePaidUsing,
      createdAt: new Date().toISOString(),
    };

    const newAmountReceived = Math.round((record.amountReceived + safeAmount) * 100) / 100;
    const newRemainingAmount = Math.max(0, Math.round((record.amount - newAmountReceived) * 100) / 100);
    const newStatus = newRemainingAmount === 0 ? "Received" : "Partially Received";
    const updatedRepayments = [...(record.repayments || []), newRepayment];

    await MoneyLent.updateOne(
      { _id: id, userId },
      {
        amountReceived: newAmountReceived,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        repayments: updatedRepayments,
        updatedAt: new Date().toISOString(),
      }
    );

    // If money was lent from savings (or depositTo specifies savings), automatically restore back to savings
    const targetDeposit = (depositTo || record.lentFrom || "").trim().toLowerCase();
    const isFromSavings =
      targetDeposit === "online_savings" ||
      targetDeposit === "cash_savings" ||
      record.lentFrom === "online_savings" ||
      record.lentFrom === "cash_savings" ||
      (record.note && record.note.toLowerCase().includes("savings"));

    if (isFromSavings) {
      const destPot =
        targetDeposit === "cash_savings" || record.lentFrom === "cash_savings"
          ? "cash_savings"
          : "online_savings";

      await SavingsMovement.create({
        userId,
        amount: safeAmount,
        direction: "to_savings",
        source: "lent",
        destination: destPot,
        fundingSource: "loan_repayment",
        date: (date || todayStr).trim(),
        note: `Repayment received from ${record.personName} (Restored to ${destPot === "cash_savings" ? "Cash Savings" : "Online Savings"})`,
      });
    }

    const message =
      newRemainingAmount === 0
        ? `₹${safeAmount} received from ${record.personName}. Loan is now fully repaid!${isFromSavings ? " Automatically deposited back into your savings." : ""}`
        : `₹${safeAmount} received from ${record.personName}. ₹${newRemainingAmount} still remaining.${isFromSavings ? " Automatically deposited back into your savings." : ""}`;

    NotificationQueueManager.enqueueNotification(userId, "success", "Repayment Received", message);

    const updated = await MoneyLent.findOne({ _id: id, userId });
    res.json(updated);
  } catch (error) {
    console.error("Error recording repayment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/money-lent/:id - Delete Money Lent record
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const record = await MoneyLent.findOne({ _id: id, userId });
    if (!record) {
      res.status(404).json({ error: "Money lent record not found." });
      return;
    }

    // Clean up savings movements created when this money was lent
    if (record.lentFrom === "online_savings" || record.lentFrom === "cash_savings") {
      await SavingsMovement.deleteMany({
        userId,
        source: record.lentFrom,
        destination: "lent",
        amount: record.amount,
        date: record.date,
      });
    }

    // Also clean up any repayment movements recorded back into savings for this loan
    if (record.repayments && record.repayments.length > 0) {
      await SavingsMovement.deleteMany({
        userId,
        source: "lent",
        destination: { $in: ["online_savings", "cash_savings"] },
        note: { $regex: record.personName, $options: "i" },
      } as any);
    }

    await MoneyLent.deleteOne({ _id: id, userId });
    res.json({ success: true, message: "Record deleted successfully." });
  } catch (error) {
    console.error("Error deleting money lent record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
