import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { SavingsMovement, SavingsSummary } from "../types";
import { getSettings } from "../lib/settings";
import {
  PiggyBank,
  Wallet,
  Smartphone,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
  Target,
  Info,
  Layers,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const SavingsPage: React.FC = () => {
  const [currency, setCurrency] = useState("$");

  // Format currency with Indian grouping
  const formatAmount = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  useEffect(() => {
    const updateCurrency = () => {
      setCurrency(getSettings().currency);
    };
    updateCurrency();
    window.addEventListener("spendsmart_settings_change", updateCurrency);
    return () => {
      window.removeEventListener("spendsmart_settings_change", updateCurrency);
    };
  }, []);

  // Today helpers
  const getTodayMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const currentMonthStr = getTodayMonthStr();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isMoveToSavingsOpen, setIsMoveToSavingsOpen] = useState(false);
  const [isMoveBackOpen, setIsMoveBackOpen] = useState(false);
  const [isAdjustGoalOpen, setIsAdjustGoalOpen] = useState(false);

  // Move To Savings form state
  const [toAmount, setToAmount] = useState("");
  const [toSource, setToSource] = useState<"cash" | "online">("online");
  const [toFundingSource, setToFundingSource] = useState<"current_balance" | "previous_savings">("current_balance");
  const [toDate, setToDate] = useState(getTodayDateStr());
  const [toNote, setToNote] = useState("");
  const [toLoading, setToLoading] = useState(false);
  const [toError, setToError] = useState<string | null>(null);

  // Move Back from Savings form state
  const [backAmount, setBackAmount] = useState("");
  const [backSource, setBackSource] = useState<"cash" | "online">("online");
  const [backDate, setBackDate] = useState(getTodayDateStr());
  const [backNote, setBackNote] = useState("");
  const [backLoading, setBackLoading] = useState(false);
  const [backError, setBackError] = useState<string | null>(null);

  // Goal update state
  const [newGoalValue, setNewGoalValue] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  // Feedback banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch savings data
  const fetchSavingsData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/savings?month=${selectedMonth}`);
      setSummary(res.data);
      if (res.data.monthSavingsGoal !== undefined) {
        setNewGoalValue(String(res.data.monthSavingsGoal));
      }
    } catch (err) {
      console.error("Error loading savings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, [selectedMonth, refreshKey]);

  // Derived financial figures
  const totalSavings = summary?.totalSavings || 0;
  const cashSavings = summary?.cashSavings || 0;
  const onlineSavings = summary?.onlineSavings ?? summary?.gpaySavings ?? 0;
  const onlineMoney = summary?.onlineMoney ?? summary?.availableBalance ?? 0;
  const availableBalance = onlineMoney;
  const totalMoney = summary?.totalMoney !== undefined ? summary.totalMoney : onlineMoney + totalSavings;

  const monthGoal = summary?.monthSavingsGoal || 0;
  const netMonthSavings = summary?.netMonthSavings || 0;
  const monthProgress = summary?.monthSavingsProgress || 0;
  const goalPercentage = summary?.savingsGoalPercentage || 0;
  const remainingRequired = summary?.remainingSavingsRequired || 0;
  const monthMovedToSavings = summary?.monthMovedToSavings || 0;
  const monthReturnedFromSavings = summary?.monthReturnedFromSavings || 0;
  const monthMovedToCash = summary?.monthMovedToCash || 0;
  const monthMovedToOnline = summary?.monthMovedToOnline ?? summary?.monthMovedToGpay ?? 0;
  const monthReturnedFromCash = summary?.monthReturnedFromCash || 0;
  const monthReturnedFromOnline = summary?.monthReturnedFromOnline ?? summary?.monthReturnedFromGpay ?? 0;
  const monthCashExpenses = summary?.monthCashExpenses || 0;
  const monthSpentFromSavings = summary?.monthSpentFromSavings !== undefined
    ? summary.monthSpentFromSavings
    : Math.round((monthReturnedFromSavings + monthCashExpenses) * 100) / 100;
  const [activityFilter, setActivityFilter] = useState<"month" | "all">("month");

  const getMonthLabel = (mStr: string) => {
    if (!mStr) return "Selected Month";
    const [y, m] = mStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  // Helper for human-readable movement logging
  const getMovementDetails = (movement: SavingsMovement) => {
    const isToSavings = movement.direction === "to_savings";
    const rawSrc = (movement.source || "").toLowerCase();
    const rawDest = (movement.destination || "").toLowerCase();
    const isPrevSavings = movement.fundingSource === "previous_savings" || rawSrc === "previous_savings";

    let title = "";
    let description = "";
    let badgeLabel = "";
    let badgeType: "cash" | "online" = "online";

    if (isPrevSavings) {
      const destIsCash = rawDest === "cash_savings" || rawSrc === "cash";
      badgeType = destIsCash ? "cash" : "online";
      badgeLabel = destIsCash ? "Cash Savings" : "Online Savings";
      title = `Recorded Initial ${badgeLabel}`;
      description = `Past savings added directly to ${badgeLabel} without deducting from spendable Online Money.`;
    } else if (isToSavings) {
      const destIsCash = rawDest === "cash_savings" || rawSrc === "cash";
      badgeType = destIsCash ? "cash" : "online";
      badgeLabel = destIsCash ? "Cash Savings" : "Online Savings";
      title = destIsCash ? "Moved to Cash Savings" : "Moved to Online Savings";
      description = destIsCash
        ? "Moved from Online Money → Cash Savings"
        : "Moved from Online Money → Online Savings";
    } else {
      // from_savings
      const srcIsCash = rawSrc === "cash_savings" || rawSrc === "cash";
      badgeType = srcIsCash ? "cash" : "online";
      badgeLabel = srcIsCash ? "Cash Savings" : "Online Savings";
      title = srcIsCash ? "Withdrawn from Cash Savings" : "Withdrawn from Online Savings";
      description = srcIsCash
        ? "Moved from Cash Savings → Online Money"
        : "Moved from Online Savings → Online Money";
    }

    return { isToSavings, isPrevSavings, title, description, badgeLabel, badgeType };
  };

  // Handle Move To Savings
  const handleMoveToSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(toAmount);
    if (!toAmount || isNaN(num) || num <= 0) {
      setToError("Please enter a valid amount greater than 0.");
      return;
    }

    setToError(null);
    setToLoading(true);

    try {
      const res = await api.post("/savings/transfer", {
        amount: num,
        direction: "to_savings",
        source: toFundingSource === "previous_savings" ? "previous_savings" : "online_money",
        destination: toSource === "cash" ? "cash_savings" : "online_savings",
        fundingSource: toFundingSource,
        date: toDate,
        note: toNote,
      });

      setToAmount("");
      setToNote("");
      setToDate(getTodayDateStr());
      setToFundingSource("current_balance");
      setIsMoveToSavingsOpen(false);
      showToast(res.data.message || `Saved ${currency}${formatAmount(num)} to ${toSource === "cash" ? "Cash" : "Online"} Savings.`);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setToError(err.response?.data?.error || "Failed to transfer money to savings.");
    } finally {
      setToLoading(false);
    }
  };

  // Handle Move Back from Savings
  const handleMoveBack = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(backAmount);
    if (!backAmount || isNaN(num) || num <= 0) {
      setBackError("Please enter a valid amount greater than 0.");
      return;
    }

    const availableInSource = backSource === "cash" ? cashSavings : onlineSavings;
    const sourceLabel = backSource === "cash" ? "Cash Savings" : "Online Savings";

    if (num > availableInSource) {
      setBackError(`Cannot withdraw more than available in ${sourceLabel} (${currency}${formatAmount(availableInSource)}).`);
      return;
    }

    setBackError(null);
    setBackLoading(true);

    try {
      const res = await api.post("/savings/transfer", {
        amount: num,
        direction: "from_savings",
        source: backSource === "cash" ? "cash_savings" : "online_savings",
        destination: "online_money",
        date: backDate,
        note: backNote,
      });

      setBackAmount("");
      setBackNote("");
      setBackDate(getTodayDateStr());
      setIsMoveBackOpen(false);
      showToast(res.data.message || `Returned ${currency}${formatAmount(num)} to Online Money.`);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setBackError(err.response?.data?.error || "Failed to return money to online money.");
    } finally {
      setBackLoading(false);
    }
  };

  // Handle Adjust Savings Goal for the selected month
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetGoal = Math.max(0, Number(newGoalValue) || 0);
    setGoalError(null);
    setGoalLoading(true);

    try {
      // Get existing budget for this month to preserve allocations
      const bRes = await api.get(`/budget?month=${selectedMonth}`);
      const currentBudget = bRes.data;

      await api.post("/budget", {
        month: selectedMonth,
        pocketMoney: currentBudget?.pocketMoney || 0,
        savingsGoal: targetGoal,
        allocated: currentBudget?.allocated || {
          food: 0,
          transport: 0,
          shopping: 0,
          entertainment: 0,
          emergency: 0,
          stationery: 0,
          savings: 0,
          other: 0,
        },
      });

      setIsAdjustGoalOpen(false);
      showToast(`Monthly savings target updated to ${currency}${formatAmount(targetGoal)}.`);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setGoalError(err.response?.data?.error || "Failed to update monthly savings goal.");
    } finally {
      setGoalLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12" id="savings-page-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl ${toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/40"
                : "bg-rose-950/90 border-rose-500/30 text-rose-300 shadow-rose-950/40"
              }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <PiggyBank className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Savings</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed">
            Keep track of the money you've set aside and where you're keeping it.
          </p>
        </div>

        {/* Month Filter Selector */}
        <div className="flex items-center gap-2.5 bg-gray-900/80 border border-purple-500/30 px-4 py-2.5 rounded-2xl shadow-sm self-start md:self-auto">
          <Calendar className="h-4 w-4 text-purple-400" />
          <span className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider">Viewing Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-xs font-black text-purple-300 outline-none cursor-pointer"
            id="savings-month-select"
          />
        </div>
      </div>

      {/* 2. Unified Total Savings & Locations (Collective at one place + small cash/gpay sections) */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-purple-950/25 border border-purple-500/25 rounded-3xl p-6 md:p-8 shadow-2xl shadow-gray-950/25 relative overflow-hidden flex flex-col gap-6" id="total-savings-collective-card">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />

        {/* Collective Total Savings Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <PiggyBank className="h-5 w-5" />
              </div>
              <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                Current Total Savings
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                All-Time Total
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {currency}{formatAmount(totalSavings)}
              </span>
            </div>
          </div>
        </div>

        {/* Small Sections: How much in Cash & How much in Online Savings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cash Savings Small Section */}
          <div className="bg-gray-950/60 hover:bg-gray-950/90 border border-amber-500/25 rounded-2xl p-5 flex flex-col justify-between transition-all" id="cash-savings-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    Cash Savings
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {totalSavings > 0 ? Math.round((cashSavings / totalSavings) * 100) : 0}% of Total
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {currency}{formatAmount(cashSavings)}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Physical Cash
                </span>
              </div>
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-3 pt-2.5 border-t border-gray-850/60">
              Money stored safely in envelope, wallet, or physical cash reserve
            </span>
          </div>

          {/* Online Savings Small Section */}
          <div className="bg-gray-950/60 hover:bg-gray-950/90 border border-blue-500/25 rounded-2xl p-5 flex flex-col justify-between transition-all" id="online-savings-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
                    Online Savings
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {totalSavings > 0 ? Math.round((onlineSavings / totalSavings) * 100) : 0}% of Total
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {currency}{formatAmount(onlineSavings)}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Digital Savings
                </span>
              </div>
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-3 pt-2.5 border-t border-gray-850/60">
              Money kept aside digitally in bank account, digital pot, or wallet
            </span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Savings Flow: Which month where amount came from & where it has gone */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 shadow-xl shadow-gray-950/20 flex flex-col gap-6" id="monthly-savings-flow-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Savings Flow for {getMonthLabel(selectedMonth)}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Detailed tracking of where savings came from and where savings amounts were spent or returned during {getMonthLabel(selectedMonth)}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-gray-400">Net Month Savings:</span>
            <span
              className={`text-xs font-black px-3 py-1.5 rounded-xl border ${netMonthSavings > 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : netMonthSavings < 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                }`}
            >
              {netMonthSavings > 0 ? "+" : ""}{currency}{formatAmount(netMonthSavings)}
            </span>
          </div>
        </div>

        {/* Inflow vs Outflow comparison columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Inflow: Where savings came from */}
          <div className="bg-gray-950/40 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                    Savings Added in {getMonthLabel(selectedMonth)}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Where Savings Came
                </span>
              </div>

              <div className="mt-2">
                <span className="text-2xl md:text-3xl font-black text-emerald-400">
                  +{currency}{formatAmount(monthMovedToSavings)}
                </span>
                <p className="text-[11px] text-gray-400 mt-1">
                  Transferred from your Online Money into your savings reserves.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800/60 flex flex-col gap-2 text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Breakdown by Location:</span>
              <div className="flex items-center justify-between bg-gray-900/60 px-3.5 py-2 rounded-xl border border-gray-800/80">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  <Banknote className="h-3.5 w-3.5 text-amber-400" /> Cash Savings:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  +{currency}{formatAmount(monthMovedToCash)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-900/60 px-3.5 py-2 rounded-xl border border-gray-800/80">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  <CreditCard className="h-3.5 w-3.5 text-blue-400" /> Online Savings:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  +{currency}{formatAmount(monthMovedToOnline)}
                </span>
              </div>
            </div>
          </div>

          {/* Outflow: Where savings went */}
          <div className="bg-gray-950/40 border border-blue-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
                    Savings Withdrawn in {getMonthLabel(selectedMonth)}
                  </span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Where Amount Has Gone
                </span>
              </div>

              <div className="mt-2">
                <span className="text-2xl md:text-3xl font-black text-blue-400">
                  −{currency}{formatAmount(monthReturnedFromSavings)}
                </span>
                <p className="text-[11px] text-gray-400 mt-1">
                  Moved back out of savings into your spendable Online Money.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800/60 flex flex-col gap-2 text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Breakdown by Location:</span>
              <div className="flex items-center justify-between bg-gray-900/60 px-3.5 py-2 rounded-xl border border-gray-800/80">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  <Banknote className="h-3.5 w-3.5 text-amber-400" /> Returned from Cash:
                </span>
                <span className="font-mono font-bold text-blue-400">
                  −{currency}{formatAmount(monthReturnedFromCash)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-900/60 px-3.5 py-2 rounded-xl border border-gray-800/80">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  <CreditCard className="h-3.5 w-3.5 text-blue-400" /> Returned from Online Savings:
                </span>
                <span className="font-mono font-bold text-blue-400">
                  −{currency}{formatAmount(monthReturnedFromOnline)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
        <button
          onClick={() => {
            setToAmount("");
            setToNote("");
            setToDate(getTodayDateStr());
            setToFundingSource("current_balance");
            setToError(null);
            setIsMoveToSavingsOpen(true);
          }}
          className="py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          id="move-to-savings-btn"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>Move to Savings</span>
        </button>

        <button
          onClick={() => {
            setToAmount("");
            setToNote("");
            setToDate(getTodayDateStr());
            setToFundingSource("previous_savings");
            setToError(null);
            setIsMoveToSavingsOpen(true);
          }}
          className="py-3.5 px-5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-extrabold rounded-2xl border border-amber-500/35 hover:border-amber-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          id="add-previous-savings-btn"
        >
          <Banknote className="h-4 w-4 text-amber-400" />
          <span>Add Previous Savings</span>
        </button>

        <button
          onClick={() => {
            setBackAmount("");
            setBackNote("");
            setBackDate(getTodayDateStr());
            setBackError(null);
            setIsMoveBackOpen(true);
          }}
          className="py-3.5 px-5 bg-gray-900 hover:bg-gray-850 text-gray-200 hover:text-white text-xs font-extrabold rounded-2xl border border-gray-800 hover:border-gray-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          id="move-back-btn"
        >
          <ArrowRightLeft className="h-4 w-4 text-blue-400" />
          <span>Move Back to Online Money</span>
        </button>
      </div>

      {/* 5. Savings Activity History */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 flex flex-col gap-5 shadow-xl shadow-gray-950/15" id="savings-activity-section">
        {(() => {
          const monthMovements = (summary?.movements || []).filter(
            (m) => m.date && m.date.startsWith(selectedMonth)
          );
          const displayedMovements =
            activityFilter === "month" ? monthMovements : summary?.movements || [];

          return (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    Savings Activity & Movements
                  </h2>
                  <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                    Track where savings came from and where savings were returned during your journey
                  </span>
                </div>

                {/* Filter Toggle: Selected Month vs All-Time */}
                <div className="flex items-center gap-1.5 bg-gray-950 p-1.5 rounded-2xl border border-gray-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActivityFilter("month")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${activityFilter === "month"
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/25"
                        : "text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    {getMonthLabel(selectedMonth)} ({monthMovements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${activityFilter === "all"
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/25"
                        : "text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    All Time ({summary?.movements?.length || 0})
                  </button>
                </div>
              </div>

              {/* Movements List */}
              <div className="flex flex-col gap-3">
                {displayedMovements.length > 0 ? (
                  displayedMovements.map((movement) => {
                    const { isToSavings, isPrevSavings, title, description, badgeLabel, badgeType } = getMovementDetails(movement);
                    const isCash = badgeType === "cash";

                    return (
                      <div
                        key={movement._id}
                        className="p-4 rounded-2xl bg-gray-950/40 hover:bg-gray-950/70 border border-gray-850 hover:border-gray-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${isToSavings
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                              }`}
                          >
                            {isToSavings ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {title}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${isCash
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                    : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                                  }`}
                              >
                                {badgeLabel}
                              </span>
                            </div>

                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              {description}
                            </span>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500 font-mono">
                                {movement.date}
                              </span>
                              {movement.note && (
                                <>
                                  <span className="text-gray-700 text-xs">•</span>
                                  <span className="text-[11px] text-gray-400 italic">
                                    "{movement.note}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right self-end sm:self-center">
                          <span
                            className={`text-sm font-black font-mono block ${isToSavings ? "text-emerald-400" : "text-blue-400"
                              }`}
                          >
                            {isToSavings ? "+" : "↩ "}{currency}{formatAmount(movement.amount)}
                          </span>
                          <span className="text-[9px] text-gray-500 uppercase font-semibold block mt-0.5">
                            {isPrevSavings ? "Initial savings" : isToSavings ? "Added to savings" : "Returned to online money"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-3 text-gray-500">
                    <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800/80 text-gray-600">
                      <PiggyBank className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {activityFilter === "month"
                        ? `No savings movements recorded in ${getMonthLabel(selectedMonth)}.`
                        : "No savings movements recorded yet."}
                    </span>
                    <p className="text-[11px] text-gray-500 max-w-sm leading-relaxed">
                      Use "+ Move to Savings" above to transfer money from your spendable Online Money into Cash or Online Savings.
                    </p>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* 6. Integrated Savings Goals Section */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 flex flex-col gap-6 shadow-xl shadow-gray-950/15" id="savings-goals-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Target className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Monthly Savings Goal
              </h2>
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-1">
              Target for {selectedMonth} (Conceptually distinct from all-time actual money saved)
            </span>
          </div>

          <button
            onClick={() => {
              setGoalError(null);
              setIsAdjustGoalOpen(true);
            }}
            className="self-start sm:self-auto px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            id="adjust-savings-goal-btn"
          >
            Adjust Target Goal
          </button>
        </div>

        {/* Goal Milestone Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gray-950/60 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Target Goal ({selectedMonth})
            </span>
            <span className="text-2xl font-black text-white mt-2 block">
              {currency}{formatAmount(monthGoal)}
            </span>
            <span className="text-[10px] text-gray-500 mt-1">Set in monthly budget planner</span>
          </div>

          <div className="bg-gray-950/60 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Net Saved This Month
            </span>
            <span className="text-2xl font-black text-purple-400 mt-2 block">
              {currency}{formatAmount(monthProgress)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 font-mono">
              (Came In: +₹{formatAmount(monthMovedToSavings)} − Gone: ₹{formatAmount(monthReturnedFromSavings)})
            </span>
          </div>

          <div className="bg-gray-950/60 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Remaining to Reach Target
            </span>
            <span className="text-2xl font-black text-gray-200 mt-2 block">
              {currency}{formatAmount(remainingRequired)}
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 font-semibold">
              {monthGoal > 0 && monthProgress >= monthGoal ? "Target goal achieved! 🎉" : "Keep going!"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-gray-400">Monthly Target Progress</span>
            <span className="text-purple-400">{goalPercentage}%</span>
          </div>
          <div className="h-2.5 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800/80 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, goalPercentage)}%` }}
            />
          </div>
        </div>

        {/* Monthly Savings Activity & Spend Breakdown */}
        <div className="pt-4 border-t border-gray-800/80 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Monthly Savings Activity & Spending ({selectedMonth})</span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">
              Real-time Inflow, Outflow & Spend tracking
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Came Into Savings */}
            <div className="bg-gray-950/70 border border-emerald-500/20 hover:border-emerald-500/40 p-4.5 rounded-2xl flex flex-col justify-between transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownLeft className="h-3.5 w-3.5" /> Came into Savings
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Inflow
                </span>
              </div>
              <div className="my-2.5">
                <span className="text-2xl font-black text-emerald-400 tracking-tight block">
                  +{currency}{formatAmount(monthMovedToSavings)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed">
                  Amount transferred from spendable Online Money into your savings
                </span>
              </div>
              <div className="pt-2 border-t border-gray-900 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>Online: +{currency}{formatAmount(monthMovedToOnline)}</span>
                <span>Cash: +{currency}{formatAmount(monthMovedToCash)}</span>
              </div>
            </div>

            {/* 2. Gone to Main Account */}
            <div className="bg-gray-950/70 border border-amber-500/20 hover:border-amber-500/40 p-4.5 rounded-2xl flex flex-col justify-between transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Gone to Main Account
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  Outflow
                </span>
              </div>
              <div className="my-2.5">
                <span className="text-2xl font-black text-amber-400 tracking-tight block">
                  −{currency}{formatAmount(monthReturnedFromSavings)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed">
                  Amount withdrawn back into your spendable GPay account
                </span>
              </div>
              <div className="pt-2 border-t border-gray-900 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>From Online: −{currency}{formatAmount(monthReturnedFromOnline)}</span>
                <span>From Cash: −{currency}{formatAmount(monthReturnedFromCash)}</span>
              </div>
            </div>

            {/* 3. Total Spent from Savings */}
            <div className="bg-gray-950/70 border border-rose-500/20 hover:border-rose-500/40 p-4.5 rounded-2xl flex flex-col justify-between transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Total Spent from Savings
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                  Spent
                </span>
              </div>
              <div className="my-2.5">
                <span className="text-2xl font-black text-rose-400 tracking-tight block">
                  {currency}{formatAmount(monthSpentFromSavings)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed">
                  {monthCashExpenses > 0
                    ? `₹${formatAmount(monthReturnedFromSavings)} to main account + ₹${formatAmount(monthCashExpenses)} cash expenses`
                    : "Total amount taken from savings to fund everyday or emergency expenses"}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-900 flex justify-between items-center text-[10px] text-gray-400">
                <span>{monthCashExpenses > 0 ? `Direct cash spent: ₹${formatAmount(monthCashExpenses)}` : "Withdrawn to fund spending"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Move to Savings */}
      {isMoveToSavingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3.5">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {toFundingSource === "previous_savings" ? "Add Previous Savings" : "Move to Savings"}
                </h3>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  {toFundingSource === "previous_savings"
                    ? "Add money already saved in past months"
                    : "Transfer money from Online Money into Cash or Online Savings"}
                </span>
              </div>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Plus className="h-4.5 w-4.5" />
              </div>
            </div>

            {toError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{toError}</span>
              </div>
            )}

            <form onSubmit={handleMoveToSavings} className="flex flex-col gap-4">
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Amount ({currency})</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-gray-500 font-bold">{currency}</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:border-emerald-500/50 outline-none"
                    id="move-to-savings-amount-input"
                  />
                </div>
              </div>

              {/* Destination Source */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Savings Destination</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setToSource("online")}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${toSource === "online"
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm"
                        : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Online Savings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToSource("cash")}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${toSource === "cash"
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm"
                        : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Cash Savings</span>
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
              </div>

              {/* Optional Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Note <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={toNote}
                  onChange={(e) => setToNote(e.target.value)}
                  placeholder="e.g. Leftover allowance, festival gift"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsMoveToSavingsOpen(false)}
                  className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={toLoading}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  id="confirm-move-to-savings-btn"
                >
                  {toLoading ? "Saving..." : "Confirm Savings"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Move Back from Savings */}
      {isMoveBackOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3.5">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Move Back to Online Money
                </h3>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Withdraw saved money back into your spendable Online Money
                </span>
              </div>
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <ArrowRightLeft className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Savings Source Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">Withdraw From</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBackSource("online")}
                  className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${backSource === "online"
                      ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm"
                      : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Online Savings</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {currency}{formatAmount(onlineSavings)} avail.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBackSource("cash")}
                  className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${backSource === "cash"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm"
                      : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5" />
                    <span>Cash Savings</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {currency}{formatAmount(cashSavings)} avail.
                  </span>
                </button>
              </div>
            </div>

            {backError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{backError}</span>
              </div>
            )}

            <form onSubmit={handleMoveBack} className="flex flex-col gap-4">
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Amount ({currency})</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-gray-500 font-bold">{currency}</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={backAmount}
                    onChange={(e) => setBackAmount(e.target.value)}
                    placeholder="e.g. 300"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:border-blue-500/50 outline-none"
                    id="move-back-amount-input"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Date</label>
                <input
                  type="date"
                  value={backDate}
                  onChange={(e) => setBackDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-blue-500/50 outline-none"
                />
              </div>

              {/* Optional Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Note <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={backNote}
                  onChange={(e) => setBackNote(e.target.value)}
                  placeholder="e.g. Needed cash for outing, emergency refund"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-blue-500/50 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsMoveBackOpen(false)}
                  className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={backLoading}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  id="confirm-move-back-btn"
                >
                  {backLoading ? "Transferring..." : "Confirm Move Back"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: Adjust Monthly Savings Goal */}
      {isAdjustGoalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3.5">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Adjust Savings Goal</h3>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Set target savings milestone for {selectedMonth}
                </span>
              </div>
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Target className="h-4.5 w-4.5" />
              </div>
            </div>

            {goalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{goalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Monthly Goal Amount ({currency})
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-gray-500 font-bold">{currency}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newGoalValue}
                    onChange={(e) => setNewGoalValue(e.target.value)}
                    placeholder="e.g. 1000"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:border-purple-500/50 outline-none"
                    id="adjust-goal-amount-input"
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                This updates your target milestone for {selectedMonth}. Actual money saved will remain completely intact.
              </p>

              <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustGoalOpen(false)}
                  className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={goalLoading}
                  className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  id="confirm-adjust-goal-btn"
                >
                  {goalLoading ? "Saving..." : "Save Goal"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default SavingsPage;
