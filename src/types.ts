export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Budget {
  _id?: string;
  userId?: string;
  month: string; // YYYY-MM
  pocketMoney: number;
  savingsGoal: number;
  allocated: {
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
  createdAt: string;
}

export interface SavingsMovement {
  _id: string;
  userId: string;
  amount: number;
  direction: "to_savings" | "from_savings";
  source: "cash" | "gpay_upi";
  fundingSource?: "current_balance" | "previous_savings";
  date: string;
  note?: string;
  createdAt: string;
}

export interface SavingsSummary {
  cashSavings: number;
  gpaySavings: number;
  totalSavings: number;
  availableBalance: number;
  totalMoney: number;
  month: string;
  monthSavingsGoal: number;
  monthMovedToSavings: number;
  monthReturnedFromSavings: number;
  monthMovedToCash?: number;
  monthMovedToGpay?: number;
  monthReturnedFromCash?: number;
  monthReturnedFromGpay?: number;
  previousSavingsRecorded?: number;
  netMonthSavings: number;
  monthSavingsProgress: number;
  savingsGoalPercentage: number;
  remainingSavingsRequired: number;
  movements: SavingsMovement[];
}
