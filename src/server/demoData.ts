import { Budget, Expense, SavingsMovement } from "./db";

export async function seedDemoDataForUser(userId: string) {
  // Check if user already has budgets or expenses
  const existingBudgets = await Budget.find({ userId });
  if (existingBudgets.length > 0) {
    console.log(`Demo data already exists for user ${userId}. Skipping seed.`);
    return;
  }

  console.log(`Seeding realistic college student finance demo data for user ${userId}...`);

  // 1. Seed June 2026 (Completed historical month)
  await Budget.create({
    userId,
    month: "2026-06",
    pocketMoney: 5500,
    savingsGoal: 800,
    allocated: {
      food: 2200,
      transport: 700,
      shopping: 600,
      entertainment: 600,
      emergency: 400,
      stationery: 300,
      other: 500,
      savings: 0,
    } as any
  });

  const juneExpenses = [
    { description: "College Registration Fee", amount: 180, category: "stationery", date: "2026-06-01" },
    { description: "Monthly Bus Pass", amount: 320, category: "transport", date: "2026-06-01" },
    { description: "Hostel canteen lunch", amount: 130, category: "food", date: "2026-06-02" },
    { description: "Reference Textbook", amount: 250, category: "stationery", date: "2026-06-04" },
    { description: "Campus cafe snacks", amount: 90, category: "food", date: "2026-06-05" },
    { description: "Raincoat", amount: 480, category: "shopping", date: "2026-06-06" },
    { description: "Pharmacy / Cold medicine", amount: 150, category: "emergency", date: "2026-06-07" },
    { description: "Hostel canteen dinner", amount: 140, category: "food", date: "2026-06-08" },
    { description: "Subway meal", amount: 180, category: "food", date: "2026-06-10" },
    { description: "Movie with friends", amount: 350, category: "entertainment", date: "2026-06-12" },
    { description: "Notebooks & pens", amount: 65, category: "stationery", date: "2026-06-15" },
    { description: "Auto fare", amount: 100, category: "transport", date: "2026-06-16" },
    { description: "Train ticket home", amount: 280, category: "transport", date: "2026-06-18" },
    { description: "Pizza delivery", amount: 420, category: "food", date: "2026-06-20" },
    { description: "Mobile bill recharge", amount: 249, category: "other", date: "2026-06-22" },
    { description: "Jeans from store", amount: 550, category: "shopping", date: "2026-06-24" },
    { description: "South Indian Dinner", amount: 160, category: "food", date: "2026-06-26" },
    { description: "Ice cream parlor", amount: 120, category: "entertainment", date: "2026-06-28" },
    { description: "Hostel Laundry charge", amount: 150, category: "other", date: "2026-06-29" },
    { description: "Coffee & cookies", amount: 85, category: "food", date: "2026-06-30" }
  ];

  for (const exp of juneExpenses) {
    await Expense.create({
      userId,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.date,
      note: ""
    });
  }

  // 2. Seed April 2026 (Completed historical month)
  await Budget.create({
    userId,
    month: "2026-04",
    pocketMoney: 6000,
    savingsGoal: 1000,
    allocated: {
      food: 2500,
      transport: 800,
      shopping: 700,
      entertainment: 700,
      emergency: 500,
      stationery: 200,
      other: 600,
      savings: 0,
    } as any
  });

  const aprilExpenses = [
    { description: "Breakfast", amount: 60, category: "food", date: "2026-04-01" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-01" },
    { description: "Dinner", amount: 110, category: "food", date: "2026-04-01" },
    { description: "Tea", amount: 20, category: "food", date: "2026-04-02" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-02" },
    { description: "Bus", amount: 40, category: "transport", date: "2026-04-03" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-03" },
    { description: "Coffee", amount: 80, category: "food", date: "2026-04-04" },
    { description: "Dinner", amount: 150, category: "food", date: "2026-04-04" },
    { description: "Friends Cafe", amount: 300, category: "entertainment", date: "2026-04-05" },
    { description: "Breakfast", amount: 70, category: "food", date: "2026-04-06" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-06" },
    { description: "Metro", amount: 60, category: "transport", date: "2026-04-07" },
    { description: "Dinner", amount: 140, category: "food", date: "2026-04-07" },
    { description: "Shampoo", amount: 220, category: "shopping", date: "2026-04-08" },
    { description: "Lunch", amount: 130, category: "food", date: "2026-04-09" },
    { description: "Tea", amount: 20, category: "food", date: "2026-04-10" },
    { description: "Auto", amount: 100, category: "transport", date: "2026-04-10" },
    { description: "Notebook", amount: 90, category: "stationery", date: "2026-04-11" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-12" },
    { description: "Movie", amount: 350, category: "entertainment", date: "2026-04-13" },
    { description: "Breakfast", amount: 60, category: "food", date: "2026-04-14" },
    { description: "Medicines", amount: 180, category: "emergency", date: "2026-04-15" },
    { description: "Dinner", amount: 150, category: "food", date: "2026-04-16" },
    { description: "Mobile Recharge", amount: 249, category: "other", date: "2026-04-17" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-18" },
    { description: "Ice Cream", amount: 120, category: "entertainment", date: "2026-04-18" },
    { description: "Bus", amount: 40, category: "transport", date: "2026-04-19" },
    { description: "Pen", amount: 40, category: "stationery", date: "2026-04-20" },
    { description: "Lunch", amount: 120, category: "food", date: "2026-04-21" },
    { description: "Laundry", amount: 150, category: "other", date: "2026-04-22" },
    { description: "T-Shirt", amount: 450, category: "shopping", date: "2026-04-23" },
    { description: "Coffee", amount: 70, category: "food", date: "2026-04-24" },
    { description: "Dinner", amount: 180, category: "food", date: "2026-04-25" },
    { description: "Auto", amount: 90, category: "transport", date: "2026-04-26" },
    { description: "Snacks", amount: 60, category: "food", date: "2026-04-27" },
    { description: "Lunch", amount: 130, category: "food", date: "2026-04-28" },
    { description: "Tea", amount: 20, category: "food", date: "2026-04-29" },
    { description: "Dinner", amount: 150, category: "food", date: "2026-04-30" },
    { description: "Friends Dinner", amount: 260, category: "food", date: "2026-04-31" }
  ];

  for (const exp of aprilExpenses) {
    await Expense.create({
      userId,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.date,
      note: ""
    });
  }

  console.log("Seeding completed successfully! Rahul Sharma's June and April 2026 transactions are ready.");
}

export async function seedShowcaseDataForUser(userId: string, forceReset = true) {
  const currentMonth = "2026-09";
  const existingBudget = await Budget.findOne({ userId, month: currentMonth });
  const existingExpenses = await Expense.find({ userId, date: { $gte: "2026-09-01", $lte: "2026-09-30" } as any });
  const totalExisting = existingExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (existingBudget && existingBudget.pocketMoney === 8000 && totalExisting === 2800 && !forceReset) {
    return;
  }

  // Reset September 2026 data for this demo user to exact daily data
  await Budget.deleteMany({ userId, month: currentMonth });
  await Expense.deleteMany({
    userId,
    date: { $gte: "2026-09-01", $lte: "2026-09-30" } as any,
  });
  await SavingsMovement.deleteMany({
    userId,
    date: { $gte: "2026-09-01", $lte: "2026-09-30" } as any,
  });

  // Also clean up any unspent historical placeholder budgets that artificially inflate balances
  await Budget.deleteMany({
    userId,
    month: { $in: ["2026-06", "2026-07", "2026-08"] } as any,
  });

  console.log(`Seeding clean September daily showcase data for user ${userId} in ${currentMonth}...`);

  // 1. Current Month Budget (September 2026) - Total ₹8,000
  await Budget.create({
    userId,
    month: currentMonth,
    pocketMoney: 8000,
    savingsGoal: 1500,
    allocated: {
      food: 2800,
      transport: 1200,
      shopping: 1100,
      entertainment: 900,
      emergency: 800,
      stationery: 600,
      other: 600,
      savings: 0,
    } as any,
    thresholdsFired: {
      food: { p80: false, p100: false },
      transport: { p80: false, p100: false },
      shopping: { p80: false, p100: false },
      entertainment: { p80: false, p100: false },
      emergency: { p80: false, p100: false },
      stationery: { p80: false, p100: false },
      other: { p80: false, p100: false },
    }
  });

  // 2. Realistic September 2026 Daily Expenses (Total spent: exactly ₹2,800)
  const showcaseExpenses = [
    { description: "Campus Cafeteria - Welcome Lunch", amount: 120, category: "food", date: "2026-09-01", paidUsing: "online", note: "Welcome lunch meal" },
    { description: "Metro SmartCard Monthly Pass", amount: 350, category: "transport", date: "2026-09-01", paidUsing: "online", note: "Monthly transit recharge" },
    { description: "DSA & System Design Reference Book", amount: 170, category: "stationery", date: "2026-09-02", paidUsing: "online", note: "Engineering textbook" },
    { description: "Starbucks Iced Caramel Macchiato", amount: 180, category: "food", date: "2026-09-03", paidUsing: "online", note: "Study cafe session" },
    { description: "Amazon - Aluminium Laptop Stand", amount: 400, category: "shopping", date: "2026-09-04", paidUsing: "online", note: "Desk setup upgrade" },
    { description: "Campus Medical Store - Cold Medicine", amount: 180, category: "emergency", date: "2026-09-05", paidUsing: "cash", note: "Medical essentials" },
    { description: "Canteen Evening Tea & Samosa", amount: 60, category: "food", date: "2026-09-05", paidUsing: "cash", note: "Campus tea break" },
    { description: "PVR Cinemas - Weekend Movie Ticket", amount: 210, category: "entertainment", date: "2026-09-06", paidUsing: "online", note: "Weekend movie" },
    { description: "Zomato - Sunday Dinner with Roommates", amount: 380, category: "food", date: "2026-09-07", paidUsing: "online", note: "Split Sunday dinner" },
    { description: "Spotify Student Duo Subscription", amount: 120, category: "entertainment", date: "2026-09-08", paidUsing: "online", note: "Monthly music subscription" },
    { description: "Auto Rickshaw to Central Library", amount: 110, category: "transport", date: "2026-09-08", paidUsing: "cash", note: "Library auto ride" },
    { description: "Classmate Spiral Notebooks & Pens", amount: 80, category: "stationery", date: "2026-09-09", paidUsing: "cash", note: "Project stationery" },
    { description: "Hostel High-Speed Wi-Fi Split", amount: 200, category: "other", date: "2026-09-10", paidUsing: "online", note: "Monthly Wi-Fi contribution" },
    { description: "Blue Tokai Cold Brew & Sandwich", amount: 140, category: "food", date: "2026-09-11", paidUsing: "online", note: "Co-working space snack" },
    { description: "Campus Cafe - Morning Coffee & Muffin", amount: 100, category: "food", date: "2026-09-12", paidUsing: "online", note: "Quick morning breakfast" },
  ];

  for (const exp of showcaseExpenses) {
    await Expense.create({
      userId,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.date,
      paidUsing: exp.paidUsing,
      note: exp.note
    });
  }

  // 3. Savings Movements (Total ₹600: Online ₹400 + Cash ₹200)
  await SavingsMovement.create({
    userId,
    amount: 400,
    direction: "to_savings",
    source: "online_money",
    destination: "online_savings",
    fundingSource: "current_balance",
    date: "2026-09-03",
    note: "Tech Fund weekly stash",
  });

  await SavingsMovement.create({
    userId,
    amount: 200,
    direction: "to_savings",
    source: "cash",
    destination: "cash_savings",
    fundingSource: "current_balance",
    date: "2026-09-07",
    note: "Emergency cash envelope",
  });

  console.log(`Clean September showcase data successfully seeded for user ${userId}! Spent: ₹2,800 / ₹8,000 (35%), Spendable: ₹5,200, Savings: ₹600 / ₹1,500 (40%).`);
}
