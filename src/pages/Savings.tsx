import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { SavingsSummary } from "../types";
import { getSettings } from "../lib/settings";
import {
  PiggyBank,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
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
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isMoveToSavingsOpen, setIsMoveToSavingsOpen] = useState(false);
  const [isMoveBackOpen, setIsMoveBackOpen] = useState(false);

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

  // Feedback banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch savings data
  const fetchSavingsData = async () => {
    try {
      const res = await api.get(`/savings?month=${selectedMonth}`);
      setSummary(res.data);
    } catch (err) {
      console.error("Error loading savings:", err);
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, [selectedMonth, refreshKey]);

  // Derived financial figures using existing Fenno logic
  const totalSavings = summary?.totalSavings || 0;
  const cashSavings = summary?.cashSavings || 0;
  const onlineSavings = summary?.onlineSavings ?? summary?.gpaySavings ?? 0;

  const netMonthSavings = summary?.netMonthSavings || 0;
  const monthMovedToSavings = summary?.monthMovedToSavings || 0;
  const monthReturnedFromSavings = summary?.monthReturnedFromSavings || 0;
  const monthCashExpenses = summary?.monthCashExpenses || 0;
  const monthSpentFromSavings = summary?.monthSpentFromSavings !== undefined
    ? summary.monthSpentFromSavings
    : Math.round((monthReturnedFromSavings + monthCashExpenses) * 100) / 100;

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

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto pb-4" id="savings-dashboard-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl ${
              toastMessage.type === "success"
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

      {/* Header: Title + Compact Inline Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Savings</h1>
          </div>
        </div>

        {/* Compact Month Selector */}
        <div className="flex items-center gap-2 bg-gray-900/90 border border-purple-500/30 px-3 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
          <Calendar className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Viewing Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-xs font-black text-purple-300 outline-none cursor-pointer"
            id="savings-month-select"
          />
        </div>
      </div>

      {/* TOP: Current Total Savings Card */}
      <div
        className="bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-purple-950/25 border border-purple-500/25 rounded-2xl p-5 md:p-6 shadow-xl shadow-gray-950/20 relative overflow-hidden"
        id="current-total-savings-card"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                <PiggyBank className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                Current Total Savings
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                All-Time Total
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {currency}{formatAmount(totalSavings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FIRST ROW: 4 Compact Cards Horizontally */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="savings-first-row-cards">
        {/* Card 1: Cash Savings */}
        <div
          className="bg-gray-900/60 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4.5 flex flex-col justify-between transition-all"
          id="card-cash-savings"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                Cash Savings
              </span>
              <span className="text-2xl font-black text-white tracking-tight mt-1">
                {currency}{formatAmount(cashSavings)}
              </span>
            </div>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-800/60">
            <span className="text-[11px] text-gray-400 font-medium">Physical Cash</span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {totalSavings > 0 ? Math.round((cashSavings / totalSavings) * 100) : 0}% of Total
            </span>
          </div>
        </div>

        {/* Card 2: Online Savings */}
        <div
          className="bg-gray-900/60 backdrop-blur-xl border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-4.5 flex flex-col justify-between transition-all"
          id="card-online-savings"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
                Online Savings
              </span>
              <span className="text-2xl font-black text-white tracking-tight mt-1">
                {currency}{formatAmount(onlineSavings)}
              </span>
            </div>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-800/60">
            <span className="text-[11px] text-gray-400 font-medium">Digital Savings</span>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              {totalSavings > 0 ? Math.round((onlineSavings / totalSavings) * 100) : 0}% of Total
            </span>
          </div>
        </div>

        {/* Card 3: Added This Month */}
        <div
          className="bg-gray-900/60 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-4.5 flex flex-col justify-between transition-all"
          id="card-added-this-month"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                Added
              </span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight mt-1">
                +{currency}{formatAmount(monthMovedToSavings)}
              </span>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60">
            <span className="text-[11px] text-gray-400 font-medium">This month</span>
          </div>
        </div>

        {/* Card 4: Withdrawn */}
        <div
          className="bg-gray-900/60 backdrop-blur-xl border border-sky-500/20 hover:border-sky-500/40 rounded-2xl p-4.5 flex flex-col justify-between transition-all"
          id="card-withdrawn"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold text-sky-300 uppercase tracking-wider">
                Withdrawn
              </span>
              <span className="text-2xl font-black text-sky-400 tracking-tight mt-1">
                {currency}{formatAmount(monthReturnedFromSavings)}
              </span>
            </div>
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60">
            <span className="text-[11px] text-gray-400 font-medium">This month</span>
          </div>
        </div>
      </div>

      {/* SECOND ROW: 2 Wider Cards Horizontally */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="savings-second-row-cards">
        {/* Card 5: Spent From Savings */}
        <div
          className="bg-gray-900/60 backdrop-blur-xl border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all"
          id="card-spent-from-savings"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                Spent From Savings
              </span>
              <span className="text-2xl md:text-3xl font-black text-rose-400 tracking-tight mt-1">
                {currency}{formatAmount(monthSpentFromSavings)}
              </span>
            </div>
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
            <span className="text-[11px] text-gray-400">This month</span>
            {monthCashExpenses > 0 ? (
              <span className="text-[10px] text-gray-500 font-mono">Direct cash: ₹{formatAmount(monthCashExpenses)}</span>
            ) : (
              <span className="text-[10px] text-gray-500 font-mono">No savings-funded expenses</span>
            )}
          </div>
        </div>

        {/* Card 6: Savings This Month (Distinct Net Savings Presentation) */}
        <div
          className="bg-gray-900/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all"
          id="card-savings-this-month"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                Savings This Month
              </span>
              <span
                className={`text-2xl md:text-3xl font-black tracking-tight mt-1 ${
                  netMonthSavings > 0 ? "text-emerald-400" : netMonthSavings < 0 ? "text-rose-400" : "text-white"
                }`}
              >
                {netMonthSavings > 0 ? "+" : ""}{currency}{formatAmount(netMonthSavings)}
              </span>
            </div>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <PiggyBank className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
            <span className="text-[11px] text-gray-400 font-medium">Net savings</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                netMonthSavings > 0
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                  : netMonthSavings < 0
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                  : "bg-gray-800 border-gray-700 text-gray-400"
              }`}
            >
              {netMonthSavings > 0 ? "Positive Growth" : netMonthSavings < 0 ? "Net Outflow" : "Balanced"}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM: Three Compact Action Buttons (1 Horizontal Row on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1" id="savings-action-buttons">
        <button
          onClick={() => {
            setToAmount("");
            setToNote("");
            setToDate(getTodayDateStr());
            setToFundingSource("current_balance");
            setToError(null);
            setIsMoveToSavingsOpen(true);
          }}
          className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black rounded-xl shadow-md shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          id="add-to-savings-btn"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>+ Add to Savings</span>
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
          className="py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-black rounded-xl border border-amber-500/35 hover:border-amber-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
          className="py-2.5 px-4 bg-gray-900 hover:bg-gray-850 text-gray-200 hover:text-white text-xs font-black rounded-xl border border-gray-800 hover:border-gray-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          id="move-from-savings-btn"
        >
          <ArrowRightLeft className="h-4 w-4 text-blue-400" />
          <span>Move from Savings</span>
        </button>
      </div>

      {/* MODAL 1: Add to Savings / Add Previous Savings */}
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
                  {toFundingSource === "previous_savings" ? "Add Previous Savings" : "Add to Savings"}
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
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      toSource === "online"
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
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      toSource === "cash"
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
                  placeholder="e.g. Leftover allowance, festival stash"
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

      {/* MODAL 2: Move from Savings */}
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
                  Move from Savings
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
                  className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    backSource === "online"
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
                  className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    backSource === "cash"
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
                  placeholder="e.g. Needed cash for outing, emergency withdrawal"
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
                  {backLoading ? "Transferring..." : "Confirm Move from Savings"}
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
