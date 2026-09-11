export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CategoryItem {
  key: string;
  label: string;
  emoji?: string;
  color?: string;
  isDefault?: boolean;
}

export interface Budget {
  _id?: string;
  userId?: string;
  month: string; // YYYY-MM
  pocketMoney: number;
  savingsGoal: number;
  allocated: {
    [category: string]: number | undefined;
    food: number;
    transport: number;
    shopping: number;
    entertainment: number;
    emergency: number;
    stationery?: number;
    savings: number;
    other: number;
  };
  isNew?: boolean;
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  note?: string;
  paidUsing?: "online" | "cash" | "Online" | "Cash";
  createdAt: string;
}

export interface SavingsMovement {
  _id: string;
  userId: string;
  amount: number;
  direction: "to_savings" | "from_savings";
  source: string; // "online_money" | "online_savings" | "cash_savings" | "cash" | "gpay_upi"
  destination?: string; // "online_money" | "online_savings" | "cash_savings"
  fundingSource?: "current_balance" | "previous_savings";
  date: string;
  note?: string;
  createdAt: string;
}

export interface SavingsSummary {
  cashSavings: number;
  onlineSavings: number;
  gpaySavings: number; // backward compatibility
  totalSavings: number;
  onlineMoney: number;
  availableBalance: number; // backward compatibility
  totalMoney: number;
  month: string;
  monthSavingsGoal: number;
  monthMovedToSavings: number;
  monthReturnedFromSavings: number;
  monthMovedToCash?: number;
  monthMovedToOnline?: number;
  monthMovedToGpay?: number;
  monthReturnedFromCash?: number;
  monthReturnedFromOnline?: number;
  monthReturnedFromGpay?: number;
  previousSavingsRecorded?: number;
  netMonthSavings: number;
  monthSavingsProgress: number;
  savingsGoalPercentage: number;
  monthCashExpenses?: number;
  monthSpentFromSavings?: number;
  remainingSavingsRequired: number;
  movements: SavingsMovement[];
}
