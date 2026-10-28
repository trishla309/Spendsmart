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
  source: string; // "online_money" | "online_savings" | "cash_savings" | "cash" | "gpay_upi" | "external" | "previous_savings" | "lent"
  destination?: string; // "online_money" | "online_savings" | "cash_savings" | "lent"
  fundingSource?: "current_balance" | "previous_savings" | "loan_repayment" | "external" | "spendable" | string;
  countsTowardGoal?: boolean;
  date: string;
  note?: string;
  createdAt: string;
}

export interface MonthContribution {
  _id: string;
  date: string;
  amount: number;
  source?: string;
  destination?: string;
  fundingSource?: string;
  note?: string;
  description: string;
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
  monthMovedFromSpendable?: number;
  monthExternalSavingsAdded?: number;
  previousSavingsRecorded?: number;
  netMonthSavings: number;
  monthSavingsProgress: number;
  savingsGoalPercentage: number;
  monthCashExpenses?: number;
  monthSpentFromSavings?: number;
  remainingSavingsRequired: number;
  monthSavingsContributions?: MonthContribution[];
  monthContributions?: MonthContribution[];
  totalLentOut?: number;
  totalLentReceived?: number;
  totalLentOwed?: number;
  totalObligationsDue?: number;
  totalObligationsPaid?: number;
  totalObligationsRemaining?: number;
  totalObligationsOverdue?: number;
  movements: SavingsMovement[];
}

export interface RepaymentHistory {
  _id: string;
  amount: number;
  date: string;
  note?: string;
  paidUsing?: "online" | "cash";
  createdAt: string;
}

export interface MoneyLentRecord {
  _id: string;
  userId: string;
  personName: string;
  amount: number;
  date: string;
  expectedReturnDate?: string;
  note?: string;
  paidUsing?: "online" | "cash";
  lentFrom?: "online_savings" | "cash_savings" | "online_money" | "cash" | string;
  amountReceived: number;
  remainingAmount: number;
  status: "Pending" | "Partially Received" | "Received";
  repayments: RepaymentHistory[];
  createdAt: string;
  updatedAt?: string;
}

export interface MoneyLentSummary {
  totalLent: number;
  totalReceived: number;
  totalOwed: number;
  pendingCount: number;
  receivedCount: number;
  totalCount: number;
}

export interface PaymentHistory {
  _id: string;
  amount: number;
  date: string;
  note?: string;
  paidUsing?: "online" | "cash";
  createdAt: string;
}

export interface MoneyToPayRecord {
  _id: string;
  userId: string;
  payeeName: string;
  amount: number;
  dateAdded: string;
  dueDate: string;
  category: "Hostel" | "Fees" | "Bills" | "Borrowed Money" | "Shopping" | "Other" | string;
  note?: string;
  amountPaid: number;
  remainingAmount: number;
  status: "Pending" | "Partially Paid" | "Paid" | "Overdue";
  isDueSoon?: boolean;
  daysDifference?: number;
  payments: PaymentHistory[];
  createdAt: string;
  updatedAt?: string;
}

export interface MoneyToPaySummary {
  totalDue: number;
  totalPaid: number;
  totalRemaining: number;
  totalOverdue: number;
  overdueCount: number;
  dueSoonCount: number;
  paidCount: number;
  pendingCount: number;
  totalCount: number;
}
