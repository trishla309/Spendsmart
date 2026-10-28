import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { CategoryItem } from "../types";
import { getSettings } from "../lib/settings";
import {
  X,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Calendar,
  Sparkles,
  ArrowRight,
  Wallet,
  ShieldAlert,
  ArrowDownLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: ActionType;
}

type ActionType = "expense" | "to_savings" | "from_savings" | "income";

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, initialMode = "expense" }) => {
  const [currency, setCurrency] = useState("₹");
  const [mode, setMode] = useState<ActionType>(initialMode);

  // Common fields
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  // Expense specific
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [paidUsing, setPaidUsing] = useState<"Online" | "Cash">("Online");
  const [categories, setCategories] = useState<CategoryItem[]>([
    { key: "food", label: "Food & Dining", emoji: "🍔", color: "bg-orange-500", isDefault: true },
    { key: "transport", label: "Transport", emoji: "🚌", color: "bg-sky-500", isDefault: true },
    { key: "shopping", label: "Shopping", emoji: "🛍️", color: "bg-indigo-500", isDefault: true },
    { key: "entertainment", label: "Entertainment", emoji: "🎬", color: "bg-rose-500", isDefault: true },
    { key: "emergency", label: "Emergency", emoji: "🚨", color: "bg-red-500", isDefault: true },
    { key: "stationery", label: "Stationery", emoji: "📝", color: "bg-emerald-500", isDefault: true },
    { key: "other", label: "Other / Misc", emoji: "📦", color: "bg-amber-500", isDefault: true },
  ]);

  // Savings specific
  const [toDestination, setToDestination] = useState<"online" | "cash">("online");
  const [toFundingSource, setToFundingSource] = useState<"spendable" | "external" | "previous_savings">("spendable");
  const [fromSource, setFromSource] = useState<"online" | "cash">("online");

  // Income specific
  const [incomeSource, setIncomeSource] = useState("Pocket Money");

  // Live Financial Balances (to give instant helpful context)
  const [onlineMoney, setOnlineMoney] = useState<number>(0);
  const [onlineSavings, setOnlineSavings] = useState<number>(0);
  const [cashSavings, setCashSavings] = useState<number>(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Currency updates
  useEffect(() => {
    const updateCurr = () => setCurrency(getSettings().currency);
    updateCurr();
    window.addEventListener("spendsmart_settings_change", updateCurr);
    return () => window.removeEventListener("spendsmart_settings_change", updateCurr);
  }, []);

  // Fetch categories, live balances, and listen for Escape key when opened
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccessMsg(null);
      return;
    }

    setMode(initialMode || "expense");

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    const currentMonth = new Date().toISOString().substring(0, 7);

    // Fetch categories
    api
      .get("/categories")
      .then((res) => {
        if (res.data?.categories && Array.isArray(res.data.categories) && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {});

    // Fetch user balances
    api
      .get(`/savings?month=${currentMonth}`)
      .then((res) => {
        if (res.data) {
          setOnlineMoney(Number(res.data.onlineMoney) || 0);
          setOnlineSavings(Number(res.data.onlineSavings) || 0);
          setCashSavings(Number(res.data.cashSavings) || 0);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const handleQuickAddAmount = (addVal: number) => {
    const cur = Number(amount) || 0;
    setAmount(String(cur + addVal));
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("en-IN").format(num);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);

    if (!amount || isNaN(num) || num <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (mode === "expense") {
        if (!description.trim()) {
          setError("Please provide a short description for this expense.");
          setLoading(false);
          return;
        }

        if (paidUsing.toLowerCase() === "cash" && num > cashSavings) {
          setError(`Cannot pay ₹${formatNumber(num)} in cash. You only have ${currency}${formatNumber(cashSavings)} in Cash Savings.`);
          setLoading(false);
          return;
        }

        await api.post("/expenses", {
          amount: num,
          category,
          description: description.trim(),
          date,
          note: note.trim(),
          paidUsing: paidUsing.toLowerCase(),
        });

        setSuccessMsg(`Recorded expense of ${currency}${formatNumber(num)} for "${description.trim()}"`);
      } else if (mode === "to_savings") {
        if (toFundingSource === "spendable" && num > onlineMoney) {
          setError(`Cannot move ${currency}${formatNumber(num)} from spendable balance. Available: ${currency}${formatNumber(onlineMoney)}.`);
          setLoading(false);
          return;
        }

        const res = await api.post("/savings/transfer", {
          amount: num,
          direction: "to_savings",
          source: toFundingSource === "spendable" ? "online_money" : toFundingSource === "previous_savings" ? "previous_savings" : "external",
          destination: toDestination === "cash" ? "cash_savings" : "online_savings",
          fundingSource: toFundingSource,
          date,
          note: note.trim() || `Added to ${toDestination === "cash" ? "Cash" : "Online"} Savings`,
        });

        setSuccessMsg(res.data?.message || `Saved ${currency}${formatNumber(num)} to ${toDestination === "cash" ? "Cash" : "Online"} Savings!`);
      } else if (mode === "from_savings") {
        const availableInSource = fromSource === "cash" ? cashSavings : onlineSavings;
        const sourceLabel = fromSource === "cash" ? "Cash Savings" : "Online Savings";

        if (num > availableInSource) {
          setError(`Cannot withdraw ${currency}${formatNumber(num)}. Only ${currency}${formatNumber(availableInSource)} available in ${sourceLabel}.`);
          setLoading(false);
          return;
        }

        const res = await api.post("/savings/transfer", {
          amount: num,
          direction: "from_savings",
          source: fromSource === "cash" ? "cash_savings" : "online_savings",
          destination: "online_money",
          date,
          note: note.trim() || `Withdrawn from ${sourceLabel}`,
        });

        setSuccessMsg(res.data?.message || `Withdrawn ${currency}${formatNumber(num)} to Spendable Balance!`);
      } else if (mode === "income") {
        const desc = incomeSource.trim() || "Income Deposit";
        await api.post("/expenses", {
          amount: num,
          category: "income",
          description: desc,
          date,
          note: note.trim(),
          paidUsing: "online",
        });

        setSuccessMsg(`Credited ${currency}${formatNumber(num)} from "${desc}"!`);
      }

      // Notify entire app of data changes
      window.dispatchEvent(new Event("spendsmart_data_updated"));
      window.dispatchEvent(new Event("spendsmart_expense_added"));

      // Reset and close smoothly
      setTimeout(() => {
        setAmount("");
        setDescription("");
        setNote("");
        setDate(new Date().toISOString().split("T")[0]);
        setSuccessMsg(null);
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.error || "Transaction failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="quick-action-modal-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden text-gray-100 z-10 flex flex-col my-auto max-h-[92vh]"
            id="quick-action-modal-card"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Quick Money Hub</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Log any spend, savings move, or income in one place</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                id="close-quick-action-btn"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 flex flex-col gap-4.5 scrollbar-thin">
              {/* Error / Success Notifications */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2.5"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2.5"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mode Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-gray-950/60 rounded-2xl border border-gray-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMode("expense");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    mode === "expense"
                      ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-md shadow-rose-950/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                  }`}
                  id="tab-expense"
                >
                  <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  <span>Expense</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("to_savings");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    mode === "to_savings"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                  }`}
                  id="tab-to-savings"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                  <span>To Savings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("from_savings");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    mode === "from_savings"
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-950/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                  }`}
                  id="tab-from-savings"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />
                  <span>Withdraw</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("income");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    mode === "income"
                      ? "bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-md shadow-sky-950/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                  }`}
                  id="tab-income"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-sky-400" />
                  <span>Income</span>
                </button>
              </div>

              {/* Amount Input with Quick Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                  <span>Amount</span>
                  {/* Balance context pill */}
                  <span className="text-[10px] text-gray-400 normal-case font-semibold">
                    {mode === "expense" && paidUsing === "Cash" && (
                      <span className="text-amber-400">Cash Savings: {currency}{formatNumber(cashSavings)}</span>
                    )}
                    {mode === "expense" && paidUsing === "Online" && (
                      <span className="text-emerald-400">Spendable Balance: {currency}{formatNumber(onlineMoney)}</span>
                    )}
                    {mode === "to_savings" && toFundingSource === "spendable" && (
                      <span className="text-emerald-400">Available: {currency}{formatNumber(onlineMoney)}</span>
                    )}
                    {mode === "from_savings" && (
                      <span className="text-amber-400">
                        In {fromSource === "cash" ? "Cash" : "Online"}: {currency}
                        {formatNumber(fromSource === "cash" ? cashSavings : onlineSavings)}
                      </span>
                    )}
                  </span>
                </label>

                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xl font-black text-gray-400 select-none">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-gray-950/80 border border-gray-800 focus:border-emerald-500/50 rounded-2xl py-3.5 pl-10 pr-4 text-2xl font-black text-white placeholder-gray-600 outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-inner"
                    id="quick-action-amount-input"
                  />
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[100, 500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAddAmount(val)}
                      className="text-[11px] font-extrabold py-1 px-2.5 rounded-lg bg-gray-800/60 hover:bg-gray-850 border border-gray-750 text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      +{currency}{val}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount("")}
                      className="text-[11px] font-bold py-1 px-2 text-gray-500 hover:text-rose-400 ml-auto cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* DYNAMIC FIELDS PER MODE */}

              {/* 1. EXPENSE MODE */}
              {mode === "expense" && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  {/* Category Chips */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {categories.map((cat) => {
                        const isSelected = category === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setCategory(cat.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                                : "bg-gray-950/40 border-gray-800/80 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                            }`}
                          >
                            <span className="text-base">{cat.emoji || "🏷️"}</span>
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Paid Using
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaidUsing("Online")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          paidUsing === "Online"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                        <span>Online / UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaidUsing("Cash")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          paidUsing === "Cash"
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Banknote className="h-4 w-4 text-amber-400" />
                        <span>Cash in Hand</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Description <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Groceries, Dinner, Swiggy, Cab..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white placeholder-gray-600 outline-none transition-all"
                      id="quick-expense-desc"
                    />
                  </div>
                </div>
              )}

              {/* 2. TO SAVINGS MODE */}
              {mode === "to_savings" && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  {/* Destination Pot */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Save Into
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setToDestination("online")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          toDestination === "online"
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 text-purple-400" />
                        <span>Online Savings Pot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDestination("cash")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          toDestination === "cash"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Banknote className="h-4 w-4 text-emerald-400" />
                        <span>Cash Savings Pot</span>
                      </button>
                    </div>
                  </div>

                  {/* Funding Source */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Funded From
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setToFundingSource("spendable")}
                        className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          toFundingSource === "spendable"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-black">Spendable Balance</span>
                        <span className="text-[10px] text-gray-500">Deducts from online wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setToFundingSource("external")}
                        className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          toFundingSource === "external"
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-black">Gift / External Deposit</span>
                        <span className="text-[10px] text-gray-500">Counts toward goal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setToFundingSource("previous_savings")}
                        className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          toFundingSource === "previous_savings"
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-black">Past Reserves</span>
                        <span className="text-[10px] text-gray-500">Past savings ledger</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. WITHDRAW FROM SAVINGS MODE */}
              {mode === "from_savings" && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Withdraw From
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFromSource("online")}
                        className={`flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer ${
                          fromSource === "online"
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-purple-400" />
                          Online Savings
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">
                          Available: {currency}{formatNumber(onlineSavings)}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFromSource("cash")}
                        className={`flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer ${
                          fromSource === "cash"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <Banknote className="h-4 w-4 text-emerald-400" />
                          Cash Savings
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">
                          Available: {currency}{formatNumber(cashSavings)}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>This money will be transferred directly back into your Spendable Online Balance.</span>
                  </div>
                </div>
              )}

              {/* 4. INCOME MODE */}
              {mode === "income" && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Income Source Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly Pocket Money, Salary, Freelance..."
                      value={incomeSource}
                      onChange={(e) => setIncomeSource(e.target.value)}
                      required
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 text-xs font-bold text-white placeholder-gray-600 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["Monthly Pocket Money", "Salary / Stipend", "Freelance Work", "Gift / Allowance"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setIncomeSource(preset)}
                        className="text-[11px] font-bold py-1 px-2.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Note Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-800/60">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>Date</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    Optional Note
                  </label>
                  <input
                    type="text"
                    placeholder="Extra details..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs font-bold text-white placeholder-gray-600 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                    mode === "expense"
                      ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
                      : mode === "to_savings"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-emerald-500/20"
                      : mode === "from_savings"
                      ? "bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-amber-500/20"
                      : "bg-sky-500 hover:bg-sky-400 text-gray-950 shadow-sky-500/20"
                  } ${loading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"}`}
                  id="submit-quick-action-btn"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === "expense"
                          ? "Log Expense"
                          : mode === "to_savings"
                          ? "Save to Pot"
                          : mode === "from_savings"
                          ? "Withdraw from Savings"
                          : "Credit Income"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
