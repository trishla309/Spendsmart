import { Router, Response } from "express";
import mongoose from "mongoose";
import { MoneyToPay, Notification, Expense } from "./db";
import { authMiddleware, AuthenticatedRequest } from "./auth";
import { NotificationQueueManager } from "./notificationQueue";

const router = Router();

// Helper to determine status and dueSoon flag
export function computeObligationStatus(
  amount: number,
  amountPaid: number,
  dueDate: string,
  todayStr: string
): { status: "Pending" | "Partially Paid" | "Paid" | "Overdue"; isDueSoon: boolean; daysDifference: number } {
  const remaining = Math.max(0, Math.round((amount - amountPaid) * 100) / 100);

  if (remaining <= 0) {
    return { status: "Paid", isDueSoon: false, daysDifference: 0 };
  }

  // Calculate day difference
  const due = new Date(dueDate + "T00:00:00");
  const today = new Date(todayStr + "T00:00:00");
  const diffTime = due.getTime() - today.getTime();
  const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysDifference < 0) {
    return { status: "Overdue", isDueSoon: false, daysDifference };
  }

  const isDueSoon = daysDifference <= 3; // within 3 days or today
  const status = amountPaid > 0 ? "Partially Paid" : "Pending";
  return { status, isDueSoon, daysDifference };
}

// GET /api/money-to-pay - List all money to pay records for current user
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const records = await MoneyToPay.find({ userId });
    const todayStr = new Date().toISOString().split("T")[0];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let totalDue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    const enriched = await Promise.all(
      records.map(async (r: any) => {
        const amt = Number(r.amount) || 0;
        const paid = Number(r.amountPaid) || 0;
        const remaining = Math.max(0, Math.round((amt - paid) * 100) / 100);

        const { status, isDueSoon, daysDifference } = computeObligationStatus(
          amt,
          paid,
          r.dueDate || todayStr,
          todayStr
        );

        totalDue += amt;
        totalPaid += paid;
        totalRemaining += remaining;

        if (status === "Paid") {
          paidCount++;
        } else if (status === "Overdue") {
          overdueCount++;
          totalOverdue += remaining;
        } else {
          pendingCount++;
        }

        if (isDueSoon) {
          dueSoonCount++;
        }

        // Send non-duplicate in-app reminder if due soon or overdue (at most once per day)
        if (remaining > 0 && (status === "Overdue" || isDueSoon)) {
          try {
            const notifTitle =
              status === "Overdue"
                ? `Payment Overdue: ${r.payeeName}`
                : `Payment Due Soon: ${r.payeeName}`;

            const existingNotif = await Notification.findOne({
              userId,
              title: notifTitle,
              createdAt: { $gte: startOfDay.toISOString() } as any,
            });

            if (!existingNotif) {
              const msg =
                status === "Overdue"
                  ? `Payment of ₹${remaining} to "${r.payeeName}" is overdue since ${r.dueDate}. Please clear it as soon as possible.`
                  : daysDifference === 0
                  ? `Payment of ₹${remaining} to "${r.payeeName}" is due TODAY!`
                  : `Payment of ₹${remaining} to "${r.payeeName}" is due in ${daysDifference} day${daysDifference > 1 ? "s" : ""} (${r.dueDate}).`;

              NotificationQueueManager.enqueueNotification(
                userId,
                status === "Overdue" ? "warning" : "info",
                notifTitle,
                msg
              );
            }
          } catch (e) {
            console.error("Reminder check error:", e);
          }
        }

        return {
          ...r,
          remainingAmount: remaining,
          status,
          isDueSoon,
          daysDifference,
        };
      })
    );

    // Sort: Overdue & Due soon first, then by dueDate asc
    enriched.sort((a: any, b: any) => {
      if (a.status === "Paid" && b.status !== "Paid") return 1;
      if (a.status !== "Paid" && b.status === "Paid") return -1;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });

    totalDue = Math.round(totalDue * 100) / 100;
    totalPaid = Math.round(totalPaid * 100) / 100;
    totalRemaining = Math.round(totalRemaining * 100) / 100;
    totalOverdue = Math.round(totalOverdue * 100) / 100;

    res.json({
      records: enriched,
      summary: {
        totalDue,
        totalPaid,
        totalRemaining,
        totalOverdue,
        overdueCount,
        dueSoonCount,
        paidCount,
        pendingCount,
        totalCount: enriched.length,
      },
    });
  } catch (error) {
    console.error("Error fetching money to pay records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/money-to-pay - Create new Money to Pay record
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { payeeName, amount, dueDate, dateAdded, category, note } = req.body;

  if (!payeeName || !payeeName.trim()) {
    res.status(400).json({ error: "Payee or organisation name is required." });
    return;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Please enter a valid amount greater than 0." });
    return;
  }

  if (!dueDate || !dueDate.trim()) {
    res.status(400).json({ error: "Payment due date is mandatory." });
    return;
  }

  const safeAmount = Math.round(numAmount * 100) / 100;
  const todayStr = new Date().toISOString().split("T")[0];
  const safeDateAdded = (dateAdded || todayStr).trim();
  const safeDueDate = dueDate.trim();
  const safeCategory = (category || "Other").trim();

  const { status } = computeObligationStatus(safeAmount, 0, safeDueDate, todayStr);

  try {
    const newRecord = await MoneyToPay.create({
      userId,
      payeeName: payeeName.trim(),
      amount: safeAmount,
      dateAdded: safeDateAdded,
      dueDate: safeDueDate,
      category: safeCategory,
      note: (note || "").trim(),
      amountPaid: 0,
      remainingAmount: safeAmount,
      status,
      payments: [],
      updatedAt: new Date().toISOString(),
    });

    NotificationQueueManager.enqueueNotification(
      userId,
      "info",
      "Payment Obligation Added",
      `Added payment obligation of ₹${safeAmount} to ${payeeName.trim()} due on ${safeDueDate}.`
    );

    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Error creating money to pay record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/money-to-pay/:id - Update Money to Pay record
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { payeeName, amount, dueDate, dateAdded, category, note } = req.body;

  try {
    const record = await MoneyToPay.findOne({ _id: id, userId });
    if (!record) {
      res.status(404).json({ error: "Money to pay record not found." });
      return;
    }

    if (payeeName !== undefined && !payeeName.trim()) {
      res.status(400).json({ error: "Payee name cannot be empty." });
      return;
    }

    let safeAmount = record.amount;
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: "Please enter a valid amount greater than 0." });
        return;
      }
      if (numAmount < record.amountPaid) {
        res.status(400).json({
          error: `Total due amount cannot be less than the already settled payment of ₹${record.amountPaid}.`,
        });
        return;
      }
      safeAmount = Math.round(numAmount * 100) / 100;
    }

    const safeDueDate = dueDate !== undefined ? dueDate.trim() : record.dueDate;
    if (!safeDueDate) {
      res.status(400).json({ error: "Payment due date is mandatory." });
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const { status } = computeObligationStatus(safeAmount, record.amountPaid, safeDueDate, todayStr);
    const newRemaining = Math.max(0, Math.round((safeAmount - record.amountPaid) * 100) / 100);

    const updateData: any = {
      ...(payeeName !== undefined ? { payeeName: payeeName.trim() } : {}),
      amount: safeAmount,
      remainingAmount: newRemaining,
      dueDate: safeDueDate,
      status,
      ...(dateAdded !== undefined ? { dateAdded: dateAdded.trim() } : {}),
      ...(category !== undefined ? { category: category.trim() } : {}),
      ...(note !== undefined ? { note: (note || "").trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    await MoneyToPay.updateOne({ _id: id, userId }, updateData);
    const updated = await MoneyToPay.findOne({ _id: id, userId });
    res.json(updated);
  } catch (error) {
    console.error("Error updating money to pay record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/money-to-pay/:id/payments - Record payment
router.post("/:id/payments", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const { amount, date, note, paidUsing } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Please enter a valid payment amount greater than 0." });
    return;
  }

  const safeAmount = Math.round(numAmount * 100) / 100;

  try {
    const record = await MoneyToPay.findOne({ _id: id, userId });
    if (!record) {
      res.status(404).json({ error: "Money to pay record not found." });
      return;
    }

    if (record.status === "Paid" || record.remainingAmount <= 0) {
      res.status(400).json({ error: "This obligation has already been fully paid." });
      return;
    }

    if (safeAmount > record.remainingAmount) {
      res.status(400).json({
        error: `Payment amount of ₹${safeAmount} exceeds remaining balance of ₹${record.remainingAmount}.`,
      });
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const safePaidUsing: "online" | "cash" = (paidUsing || "online").toLowerCase() === "cash" ? "cash" : "online";

    // Auto-create an Expense so paying bills automatically deducts from the user's spendable Google Pay / Cash balance
    const exp = await Expense.create({
      userId,
      amount: safeAmount,
      category: (record.category || "other").toLowerCase().trim(),
      description: `Payment to ${record.payeeName}${record.category ? ` (${record.category})` : ""}`,
      date: (date || todayStr).trim(),
      note: (note || "").trim() || `Paid obligation to ${record.payeeName}`,
      paidUsing: safePaidUsing,
    });

    const newPayment = {
      _id: new mongoose.Types.ObjectId().toString(),
      amount: safeAmount,
      date: (date || todayStr).trim(),
      note: (note || "").trim(),
      paidUsing: safePaidUsing,
      expenseId: exp._id.toString(),
      createdAt: new Date().toISOString(),
    };

    const newAmountPaid = Math.round((record.amountPaid + safeAmount) * 100) / 100;
    const newRemaining = Math.max(0, Math.round((record.amount - newAmountPaid) * 100) / 100);
    const { status: newStatus } = computeObligationStatus(record.amount, newAmountPaid, record.dueDate, todayStr);
    const updatedPayments = [...(record.payments || []), newPayment];

    await MoneyToPay.updateOne(
      { _id: id, userId },
      {
        amountPaid: newAmountPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        payments: updatedPayments,
        updatedAt: new Date().toISOString(),
      }
    );

    const message =
      newRemaining === 0
        ? `₹${safeAmount} paid to ${record.payeeName}. Obligation is fully settled!`
        : `₹${safeAmount} paid to ${record.payeeName}. ₹${newRemaining} remaining due by ${record.dueDate}.`;

    NotificationQueueManager.enqueueNotification(userId, "success", "Payment Recorded", message);

    const updated = await MoneyToPay.findOne({ _id: id, userId });
    res.json(updated);
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/money-to-pay/:id - Delete record
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const record = await MoneyToPay.findOne({ _id: id, userId });
    if (!record) {
      res.status(404).json({ error: "Money to pay record not found." });
      return;
    }

    // Clean up any linked auto-created expenses for this obligation
    if (record.payments && record.payments.length > 0) {
      const expenseIds = record.payments.map((p: any) => p.expenseId).filter(Boolean);
      if (expenseIds.length > 0) {
        await Expense.deleteMany({ _id: { $in: expenseIds }, userId } as any);
      }
    }

    await MoneyToPay.deleteOne({ _id: id, userId });
    res.json({ success: true, message: "Obligation deleted successfully." });
  } catch (error) {
    console.error("Error deleting money to pay record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
