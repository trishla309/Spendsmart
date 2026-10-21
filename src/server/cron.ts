import cron from "node-cron";
import { User, Budget, Expense } from "./db";
import { sendDailySummaryEmail, sendMonthlySummaryEmail } from "./mailer";

export function initCronJobs() {
  // Run every day at 11:59 PM (server time)
  cron.schedule("59 23 * * *", async () => {
    console.log("[CRON] Starting daily expense summary job...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const monthStr = today.substring(0, 7);

      const users = await User.find();

      for (const user of users) {
        // Find budget for the month
        const budget = await Budget.findOne({ userId: user._id, month: monthStr });
        if (!budget) continue; // If no budget set up, skip

        // Find all expenses for the user this month
        const allExpenses = await Expense.find({ userId: user._id });
        const monthExpenses = allExpenses.filter((e: any) => e.date.startsWith(monthStr));
        
        // Find expenses for TODAY
        const todayExpenses = monthExpenses.filter((e: any) => e.date === today && e.category !== "income" && e.category !== "savings");
        
        // Calculate total spent today
        const totalSpentToday = todayExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

        // Even if they spent 0 today, we'll send them a summary so they know they stayed within budget!

        // Calculate remaining budget
        const incomeExpenses = monthExpenses.filter((e: any) => e.category === "income");
        const spendingExpenses = monthExpenses.filter((e: any) => e.category !== "income" && e.category !== "savings");
        
        const totalMoneyReceived = (budget.pocketMoney || 0) + incomeExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const totalExpenses = spendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        
        const remainingBudget = totalMoneyReceived - totalExpenses;

        // Map today's expenses for the email
        const formattedExpenses = todayExpenses.map((e: any) => ({
          category: e.category,
          amount: e.amount,
          description: e.description,
        }));

        // Send Email
        await sendDailySummaryEmail(
          user.email,
          user.name,
          totalSpentToday,
          formattedExpenses,
          remainingBudget
        );
      }
      console.log("[CRON] Daily expense summary job completed.");
    } catch (error) {
      console.error("[CRON] Error running daily expense summary job:", error);
    }
  });

  // Run on the 1st of every month at 10:00 AM (server time) for the previous month's summary
  cron.schedule("0 10 1 * *", async () => {
    console.log("[CRON] Starting monthly expense summary job...");
    try {
      const now = new Date();
      // Get the previous month by subtracting 1 from the current month
      now.setMonth(now.getMonth() - 1);
      const prevMonthStr = now.toISOString().substring(0, 7); // e.g. "2026-06"
      
      const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

      const users = await User.find();

      for (const user of users) {
        // Find budget for the previous month
        const budget = await Budget.findOne({ userId: user._id, month: prevMonthStr });
        if (!budget) continue;

        // Find all expenses for the user in the previous month
        const allExpenses = await Expense.find({ userId: user._id });
        const monthExpenses = allExpenses.filter((e: any) => e.date && e.date.startsWith(prevMonthStr));
        
        const spendingExpenses = monthExpenses.filter((e: any) => e.category !== "income" && e.category !== "savings");
        const savingsExpenses = monthExpenses.filter((e: any) => e.category === "savings");
        
        const totalSpent = spendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const actualSavings = savingsExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const savingsGoal = budget.savingsGoal || 0;

        // Aggregate by category
        const categoryMap: Record<string, number> = {};
        spendingExpenses.forEach((e: any) => {
          categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
        });

        const categoryBreakdown = Object.keys(categoryMap).map(cat => ({
          category: cat,
          amount: categoryMap[cat]
        })).sort((a, b) => b.amount - a.amount); // Sort by highest spend

        // Send Email
        await sendMonthlySummaryEmail(
          user.email,
          user.name,
          monthName,
          totalSpent,
          savingsGoal,
          actualSavings,
          categoryBreakdown
        );
      }
      console.log("[CRON] Monthly expense summary job completed.");
    } catch (error) {
      console.error("[CRON] Error running monthly expense summary job:", error);
    }
  });

  // Run every morning at 9:00 AM (server time) to check upcoming and overdue payment obligations
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Starting payment obligation reminder job...");
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { MoneyToPay, Notification } = await import("./db");
      const { NotificationQueueManager } = await import("./notificationQueue");
      const { computeObligationStatus } = await import("./moneyToPay");

      const allObligations = await MoneyToPay.find();

      for (const item of allObligations) {
        const amt = Number(item.amount) || 0;
        const paid = Number(item.amountPaid) || 0;
        const remaining = Math.max(0, Math.round((amt - paid) * 100) / 100);

        if (remaining <= 0) continue;

        const { status, isDueSoon, daysDifference } = computeObligationStatus(
          amt,
          paid,
          item.dueDate || todayStr,
          todayStr
        );

        if (status === "Overdue" || isDueSoon) {
          const notifTitle =
            status === "Overdue"
              ? `Payment Overdue: ${item.payeeName}`
              : `Payment Due Soon: ${item.payeeName}`;

          const existing = await Notification.findOne({
            userId: item.userId,
            title: notifTitle,
            createdAt: { $gte: startOfDay.toISOString() } as any,
          });

          if (!existing) {
            const msg =
              status === "Overdue"
                ? `Reminder: Payment of ₹${remaining} to "${item.payeeName}" is overdue since ${item.dueDate}.`
                : daysDifference === 0
                ? `Urgent: Payment of ₹${remaining} to "${item.payeeName}" is due TODAY!`
                : `Reminder: Payment of ₹${remaining} to "${item.payeeName}" is due in ${daysDifference} day${daysDifference > 1 ? "s" : ""} (${item.dueDate}).`;

            NotificationQueueManager.enqueueNotification(
              item.userId,
              status === "Overdue" ? "warning" : "info",
              notifTitle,
              msg
            );
          }
        }
      }
      console.log("[CRON] Payment obligation reminder job completed.");
    } catch (error) {
      console.error("[CRON] Error checking payment obligation reminders:", error);
    }
  });

  console.log("Initialized background CRON jobs.");
}
