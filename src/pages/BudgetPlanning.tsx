import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Budget, CategoryItem } from "../types";
import { Wallet, AlertTriangle, Check, Lock, Info, PlusCircle, Landmark, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getSettings } from "../lib/settings";
import { backupData } from "../lib/sync";

export const BudgetPlanning: React.FC = () => {
  const [currency, setCurrency] = useState("$");

  // Helper to format values using Indian numbering system (e.g. 1,20,000)
  const formatIndianNumber = (num: number) => {
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

  // Get current month string: "YYYY-MM"
  const getTodayMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const currentMonthStr = getTodayMonthStr();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [pocketMoney, setPocketMoney] = useState<number>(1000); // Standard default
  const [savingsGoal, setSavingsGoal] = useState<number>(200); // Standard default
  const [allocated, setAllocated] = useState<Budget["allocated"]>({
    food: 0,
    transport: 0,
    shopping: 0,
    entertainment: 0,
    emergency: 0,
    stationery: 0,
    savings: 0,
    other: 0,
  });

  const [categories, setCategories] = useState<CategoryItem[]>([
    { key: "food", label: "Food & Dining", color: "bg-orange-500", emoji: "🍔", isDefault: true },
    { key: "transport", label: "Transport & Commute", color: "bg-sky-500", emoji: "🚌", isDefault: true },
    { key: "shopping", label: "Shopping & Wardrobe", color: "bg-indigo-500", emoji: "🛍️", isDefault: true },
    { key: "entertainment", label: "Entertainment & Fun", color: "bg-rose-500", emoji: "🎬", isDefault: true },
    { key: "emergency", label: "Emergency Reserve", color: "bg-red-500", emoji: "🚨", isDefault: true },
    { key: "stationery", label: "Stationery & Supplies", color: "bg-emerald-500", emoji: "📝", isDefault: true },
    { key: "other", label: "Miscellaneous (Other)", color: "bg-amber-500", emoji: "📦", isDefault: true },
  ]);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("bg-violet-500");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [categoryToRemove, setCategoryToRemove] = useState<CategoryItem | null>(null);
  const [removeCatLoading, setRemoveCatLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPreFilled, setIsPreFilled] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data?.categories && Array.isArray(res.data.categories) && res.data.categories.length > 0) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  // Load budget for selectedMonth
  const fetchBudget = async (month: string) => {
    setLoading(true);
    setError(null);
    setIsPreFilled(false);
    try {
      const [response] = await Promise.all([
        api.get(`/budget?month=${month}`),
        fetchCategories(),
      ]);
      const data = response.data;
      if (data) {
        setPocketMoney(data.pocketMoney || 0);
        setSavingsGoal(data.savingsGoal || 0);
        setIsPreFilled(data.isPreFilled || false);
        setAllocated(data.allocated || {});
      }
    } catch (err: any) {
      console.error("Error loading budget:", err);
      setError("Failed to load budget. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget(selectedMonth);
  }, [selectedMonth]);

  const isCurrentMonth = selectedMonth === currentMonthStr;

  // Calculate live allocations dynamically across all categories
  const allocatedSum = Object.entries(allocated).reduce((sum, [cat, amt]) => {
    if (cat === "savings") return sum;
    return sum + (Number(amt) || 0);
  }, 0);

  const remainingPocketMoney = pocketMoney - allocatedSum;
  const isExceeded = allocatedSum > pocketMoney;

  const handleCategoryChange = (category: string, val: string) => {
    if (!isCurrentMonth) return; // Read-only
    const num = Math.max(0, Number(val));
    setAllocated((prev) => ({
      ...prev,
      [category]: num,
    }));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) {
      setCatError("Please enter a category name");
      return;
    }
    setCatLoading(true);
    setCatError(null);
    try {
      const res = await api.post("/categories", {
        label: newCatLabel.trim(),
        emoji: newCatEmoji,
        color: newCatColor,
        initialBudget: newCatBudget ? Number(newCatBudget) : 0,
        month: selectedMonth,
      });
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
      if (newCatBudget && Number(newCatBudget) > 0 && res.data?.category?.key) {
        setAllocated((prev) => ({
          ...prev,
          [res.data.category.key]: Number(newCatBudget),
        }));
      }
      setIsAddCategoryOpen(false);
      setNewCatLabel("");
      setNewCatBudget("");
      setNewCatEmoji("🏷️");
      setNewCatColor("bg-violet-500");
    } catch (err: any) {
      setCatError(err.response?.data?.error || "Failed to add category");
    } finally {
      setCatLoading(false);
    }
  };

  const handleRemoveCategory = async () => {
    if (!categoryToRemove) return;
    setRemoveCatLoading(true);
    try {
      const res = await api.delete(`/categories/${categoryToRemove.key}`);
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
      setCategoryToRemove(null);
    } catch (err) {
      console.error("Failed to remove category:", err);
    } finally {
      setRemoveCatLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentMonth) return;

    if (isExceeded) {
      setError("Allocation sum cannot exceed Monthly Pocket Money!");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.post("/budget", {
        month: selectedMonth,
        pocketMoney,
        savingsGoal,
        allocated,
      });
      setSuccess(response.data.message || "Budget saved successfully!");
      setIsPreFilled(false);
      
      // Update local storage backup
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          const uId = u.id || u._id;
          if (uId) {
            backupData(uId, [], { pocketMoney, savingsGoal, allocated }, selectedMonth);
          }
        } catch {}
      }

      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to save budget. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper for human month names
  const formatMonthName = (mStr: string) => {
    const [year, month] = mStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto" id="budget-planning-wrapper">
      {/* Month Selection and Read-Only Alert */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <label htmlFor="month-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
            Planning Month
          </label>
          <div className="flex items-center gap-3">
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 focus:ring-emerald-500/10 text-sm text-gray-100 rounded-xl outline-none"
            />
            <span className="text-sm font-semibold text-gray-300">
              ({formatMonthName(selectedMonth)})
            </span>
          </div>
        </div>

        {/* Edit lock indicator */}
        {!isCurrentMonth ? (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs" id="read-only-badge">
            <Lock className="h-4 w-4 shrink-0" />
            <span className="font-semibold leading-relaxed">
              Read-Only: Budgets can only be created or modified for the current month ({formatMonthName(currentMonthStr)}).
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs" id="editable-badge">
            <Check className="h-4 w-4 shrink-0" />
            <span className="font-semibold leading-relaxed">
              Active Month: You are editing the current month's budget.
            </span>
          </div>
        )}
      </div>

      {/* Main Budget Dashboard Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: General Values & Category Allocations */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Landmark className="h-5 w-5 text-emerald-400" />
              Pocket Money & Savings Goals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Pocket Money Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pocket-money-input" className="text-xs font-semibold text-gray-400">
                  Monthly Pocket Money ({currency})
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-gray-500 font-mono font-bold">{currency}</span>
                  <input
                    id="pocket-money-input"
                    type="number"
                    min="0"
                    disabled={!isCurrentMonth}
                    value={pocketMoney || ""}
                    onChange={(e) => setPocketMoney(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500/50 focus:ring-emerald-500/10 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="Enter pocket money"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Total funds for this month</p>
              </div>

              {/* Savings Goal Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="savings-goal-input" className="text-xs font-semibold text-gray-400">
                  Savings Goal ({currency})
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-gray-500 font-mono font-bold">{currency}</span>
                  <input
                    id="savings-goal-input"
                    type="number"
                    min="0"
                    disabled={!isCurrentMonth}
                    value={savingsGoal || ""}
                    onChange={(e) => setSavingsGoal(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500/50 focus:ring-emerald-500/10 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="Enter savings goal"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Your target savings this month</p>
              </div>
            </div>
          </div>

          {/* Category Allocations Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Wallet className="h-5 w-5 text-emerald-400" />
              Budget Category Allocations
            </h3>

            {isPreFilled && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 font-medium">
                <Info className="h-4 w-4 shrink-0" />
                <span>Pre-filled from last month — review and adjust before saving.</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {categories.map((cat) => {
                const borderClass = cat.color ? cat.color.replace("bg-", "border-l-") : "border-l-violet-500";
                return (
                  <div
                    key={cat.key}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-gray-950/40 border border-gray-800 rounded-xl border-l-4 ${borderClass} gap-3`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{cat.emoji || "🏷️"}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-gray-200 truncate">{cat.label}</span>
                        <span className="text-[11px] text-gray-500 capitalize">{cat.key} Allocation</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-auto">
                      <div className="relative w-full sm:w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">{currency}</span>
                        <input
                          type="number"
                          min="0"
                          disabled={!isCurrentMonth}
                          value={allocated[cat.key] || ""}
                          onChange={(e) => handleCategoryChange(cat.key, e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-right text-gray-100 rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold font-mono"
                          placeholder="0"
                        />
                      </div>
                      {isCurrentMonth && (
                        <button
                          type="button"
                          onClick={() => setCategoryToRemove(cat)}
                          className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all cursor-pointer shrink-0"
                          title={`Remove ${cat.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* + Add Custom Category button */}
              {isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="p-3.5 border-2 border-dashed border-gray-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-gray-400 hover:text-emerald-400 rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold transition-all cursor-pointer"
                  id="add-category-planning-btn"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Custom Category</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Live Summary & Submission */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-6 sticky top-24" id="budget-summary-card">
            <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3">
              Budget Summary & Status
            </h3>

            {/* Allocation Meter */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                <span>Allocation Progress</span>
                <span className="font-mono">
                  {currency}{formatIndianNumber(allocatedSum)} / {currency}{formatIndianNumber(pocketMoney)}
                </span>
              </div>
              <div className="h-3.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${isExceeded ? "bg-rose-500" : "bg-emerald-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (allocatedSum / (pocketMoney || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Remaining pocket money metric */}
            <div className={`p-4 rounded-2xl flex flex-col gap-1 border ${
              isExceeded
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-70">
                Remaining Monthly Pocket Money
              </span>
              <span className="text-3xl font-extrabold tracking-tight font-mono block">
                {currency}{formatIndianNumber(remainingPocketMoney)}
              </span>
            </div>

            {/* Danger alert when exceeded */}
            <AnimatePresence>
              {isExceeded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex gap-2 items-start"
                  id="budget-exceeded-alert"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-tight block font-semibold">
                    Category allocations exceed your Monthly Pocket Money by {currency}{formatIndianNumber(allocatedSum - pocketMoney)}. Reduce some allocations before saving.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Guidelines Note */}
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-800 text-xs text-gray-500 leading-relaxed font-sans">
              <div>
                <strong className="text-gray-300 font-semibold block mb-0.5">Budget Lock Policy:</strong>
                Budget can be planned or adjusted only during the active calendar month. Historical months are view-only.
              </div>
              <div>
                <strong className="text-gray-300 font-semibold block mb-0.5">Goal Matching:</strong>
                Your Savings Goal is <strong className="text-emerald-400 font-bold">{currency}{formatIndianNumber(savingsGoal)}</strong>. Ensure your General Savings and Emergency Reserve allocations are configured to match this goal.
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight block font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-start gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight block font-medium">{success}</span>
              </div>
            )}

            {/* Save Button */}
            {isCurrentMonth && (
              <button
                type="submit"
                disabled={loading || isExceeded}
                className={`w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 ${
                  loading || isExceeded ? "opacity-40 cursor-not-allowed" : ""
                }`}
                id="save-budget-btn"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{loading ? "Saving Budget..." : "Save & Finalize Budget"}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Add Custom Category Modal */}
      <AnimatePresence>
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl relative"
              id="add-category-planning-modal"
            >
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Add Custom Category</h3>
                  <p className="text-xs text-gray-500 font-medium">Create a new budget allocation bucket</p>
                </div>
              </div>

              <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
                {catError && (
                  <p className="text-xs text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    {catError}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="e.g. Gym & Fitness, Books, Gaming, Rent"
                    className="px-4 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Category Icon</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-gray-950/60 border border-gray-800 rounded-xl max-h-28 overflow-y-auto">
                    {["🏋️", "📚", "☕", "🎮", "🎨", "✈️", "🐾", "💊", "🚗", "💻", "💡", "🎵", "👗", "🍕", "🏷️"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatEmoji(emoji)}
                        className={`h-9 w-9 text-base rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          newCatEmoji === emoji
                            ? "bg-emerald-500/20 border-2 border-emerald-500 scale-110 shadow-md shadow-emerald-500/10"
                            : "bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:scale-105"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Color Accent</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Emerald", value: "bg-emerald-500" },
                      { label: "Violet", value: "bg-violet-500" },
                      { label: "Sky", value: "bg-sky-500" },
                      { label: "Rose", value: "bg-rose-500" },
                      { label: "Amber", value: "bg-amber-500" },
                      { label: "Indigo", value: "bg-indigo-500" },
                      { label: "Pink", value: "bg-pink-500" },
                      { label: "Teal", value: "bg-teal-500" },
                    ].map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setNewCatColor(col.value)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          newCatColor === col.value
                            ? "border-emerald-500/80 bg-gray-950 text-white shadow-sm"
                            : "border-gray-800/80 bg-gray-950/40 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${col.value} shrink-0`} />
                        <span className="truncate">{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Monthly Budget Allocation</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      value={newCatBudget}
                      onChange={(e) => setNewCatBudget(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end mt-2 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={catLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {catLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Category Confirmation Modal */}
      <AnimatePresence>
        {categoryToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl shrink-0">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-white">
                    Remove {categoryToRemove.label}?
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    This category will be removed from your active budgets and planning views.
                  </p>
                  <div className="mt-3 p-3 bg-gray-950/60 rounded-xl border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
                    <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Any past expenses you recorded under this category will remain completely safe in your transaction history.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setCategoryToRemove(null)}
                  disabled={removeCatLoading}
                  className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCategory}
                  disabled={removeCatLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  {removeCatLoading ? "Removing..." : "Yes, Remove Category"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
