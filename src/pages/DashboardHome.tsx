import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Budget, Expense, CategoryItem } from "../types";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Lock,
  Unlock,
  Info,
  Edit,
  Search,
  ArrowUpDown,
  Undo2,
  X,
  CheckCircle,
  FileText,
  Filter,
  Utensils,
  Bus,
  ShoppingBag,
  Film,
  PenTool,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  ChevronDown,
  History,
  Target,
  ArrowRight,
  CreditCard,
  Banknote,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Stack, Trie, mergeSort } from "../lib/dsa";
import { getSettings } from "../lib/settings";
import { backupData } from "../lib/sync";

const monthsOf2026 = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-07", label: "July 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
];

const getCategoryDetails = (cat: string) => {
  const c = cat.toLowerCase();
  switch (c) {
    case "income":
      return {
        icon: ArrowUpRight,
        colorClass: "text-emerald-400",
        bgClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        label: "Income"
      };
    case "savings":
      return {
        icon: PlusCircle,
        colorClass: "text-purple-400",
        bgClass: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        label: "Savings"
      };
    case "food":
      return {
        icon: Utensils,
        colorClass: "text-orange-400",
        bgClass: "bg-orange-500/10 border-orange-500/20 text-orange-400",
        label: "Food"
      };
    case "transport":
      return {
        icon: Bus,
        colorClass: "text-blue-400",
        bgClass: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        label: "Transport"
      };
    case "shopping":
      return {
        icon: ShoppingBag,
        colorClass: "text-purple-400",
        bgClass: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        label: "Shopping"
      };
    case "entertainment":
      return {
        icon: Film,
        colorClass: "text-pink-400",
        bgClass: "bg-pink-500/10 border-pink-500/20 text-pink-400",
        label: "Entertainment"
      };
    case "stationery":
    case "utilities":
      return {
        icon: PenTool,
        colorClass: "text-yellow-400",
        bgClass: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
        label: cat === "stationery" ? "Stationery" : "Utilities"
      };
    case "emergency":
      return {
        icon: AlertTriangle,
        colorClass: "text-red-400",
        bgClass: "bg-red-500/10 border-red-500/20 text-red-400",
        label: "Emergency"
      };
    default:
      return {
        icon: HelpCircle,
        colorClass: "text-gray-400",
        bgClass: "bg-gray-500/10 border-gray-500/20 text-gray-400",
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      };
  }
};

const formatDateGPay = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

const getCategoryEmoji = (catKey: string) => {
  switch (catKey.toLowerCase()) {
    case "savings": return "💰";
    case "food": return "🍛";
    case "transport": return "🚌";
    case "shopping": return "🛍️";
    case "entertainment": return "🎬";
    case "emergency": return "⚠️";
    case "stationery": return "📝";
    case "other": return "🏷️";
    default: return "📦";
  }
};

const getCategoryLabel = (catKey: string) => {
  switch (catKey.toLowerCase()) {
    case "savings": return "Savings";
    case "food": return "Food & Dining";
    case "transport": return "Transport";
    case "shopping": return "Shopping";
    case "entertainment": return "Entertainment";
    case "emergency": return "Emergency Reserve";
    case "stationery": return "Stationery";
    case "other": return "Other / Misc";
    default: return catKey.charAt(0).toUpperCase() + catKey.slice(1);
  }
};

const getEmojiForTransaction = (description: string, category: string) => {
  const desc = description.toLowerCase();
  if (desc.includes("coffee") || desc.includes("cafe") || desc.includes("starbucks") || desc.includes("tea") || desc.includes("chai")) return "☕";
  if (desc.includes("lunch") || desc.includes("dinner") || desc.includes("burger") || desc.includes("pizza") || desc.includes("food") || desc.includes("meal")) return "🍛";

  return getCategoryEmoji(category);
};

export const DashboardHome: React.FC = () => {
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

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const currentMonthStr = getTodayMonthStr();

  // State managers
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // New modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Add Money Form states
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneySource, setMoneySource] = useState("");
  const [moneyDate, setMoneyDate] = useState(new Date().toISOString().split("T")[0]);
  const [moneyNote, setMoneyNote] = useState("");
  const [moneyLoading, setMoneyLoading] = useState(false);
  const [moneyError, setMoneyError] = useState<string | null>(null);

  // Set Savings Goal Modal states
  const [isSetGoalOpen, setIsSetGoalOpen] = useState(false);
  const [goalInputVal, setGoalInputVal] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [editingCategoryBudgetKey, setEditingCategoryBudgetKey] = useState<string | null>(null);
  const [viewingCategoryKey, setViewingCategoryKey] = useState<string | null>(null);
  const [newBudgetVal, setNewBudgetVal] = useState("");
  const [editBudgetError, setEditBudgetError] = useState<string | null>(null);
  const [editBudgetLoading, setEditBudgetLoading] = useState(false);

  // Undo Delete Stack state
  const undoStack = useRef(new Stack<Expense>()); // [DSA] Stack data structure for Last-In-First-Out (LIFO) undo functionality
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoItemName, setUndoItemName] = useState("");
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sorting & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "date" | "category" | "title">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Expense forms states (Create & Edit)
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [paidUsing, setPaidUsing] = useState<"Online" | "Cash">("Online");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddSuggestions, setShowAddSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("food");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPaidUsing, setEditPaidUsing] = useState<"Online" | "Cash">("Online");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isCurrentMonthEditable = selectedMonth === currentMonthStr;

  // Custom Category States
  const [categories, setCategories] = useState<CategoryItem[]>([
    { key: "food", label: "Food & Dining", emoji: "🍔", color: "bg-orange-500", isDefault: true },
    { key: "transport", label: "Transport", emoji: "🚌", color: "bg-sky-500", isDefault: true },
    { key: "shopping", label: "Shopping", emoji: "🛍️", color: "bg-indigo-500", isDefault: true },
    { key: "entertainment", label: "Entertainment", emoji: "🎬", color: "bg-rose-500", isDefault: true },
    { key: "emergency", label: "Emergency Reserve", emoji: "🚨", color: "bg-red-500", isDefault: true },
    { key: "stationery", label: "Stationery", emoji: "📝", color: "bg-emerald-500", isDefault: true },
    { key: "other", label: "Other / Misc", emoji: "📦", color: "bg-amber-500", isDefault: true },
  ]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("bg-violet-500");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Category deletion confirm modal state
  const [categoryToRemove, setCategoryToRemove] = useState<CategoryItem | null>(null);
  const [removeCatLoading, setRemoveCatLoading] = useState(false);

  // Fetch active categories
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data?.categories && Array.isArray(res.data.categories) && res.data.categories.length > 0) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
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
      setIsAddCategoryOpen(false);
      setNewCatLabel("");
      setNewCatBudget("");
      setNewCatEmoji("🏷️");
      setNewCatColor("bg-violet-500");
      await fetchDashboardData();
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
      await fetchDashboardData();
    } catch (err: any) {
      console.error("Failed to remove category:", err);
    } finally {
      setRemoveCatLoading(false);
    }
  };

  const handleResetCategories = async () => {
    if (!window.confirm("Reset all categories back to system defaults?")) return;
    try {
      const res = await api.post("/categories/reset");
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to reset categories:", err);
    }
  };

  // Fetch full data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get pre-calculated summary from backend (this also triggers the end-of-month rollover automation!)
      const sRes = await api.get(`/budget/summary?month=${selectedMonth}`);
      setSummary(sRes.data);
      setBudget(sRes.data);
      if (sRes.data?.userCategories && Array.isArray(sRes.data.userCategories)) {
        setCategories(sRes.data.userCategories);
      } else {
        await fetchCategories();
      }

      // 2. Get all expenses
      const eRes = await api.get("/expenses");
      const rawData = eRes.data;
      const dataArray = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.data) ? rawData.data : []);
      setExpenses(dataArray);

      // Backup locally
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          const uId = u.id || u._id;
          if (uId) {
            backupData(uId, dataArray, sRes.data, selectedMonth);
          }
        } catch { }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  // ADD EXPENSE handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) {
      setAddError("Please fill in all required fields.");
      return;
    }

    setAddError(null);
    setAddLoading(true);

    try {
      await api.post("/expenses", {
        amount: Number(amount),
        category,
        description,
        date,
        note,
        paidUsing: paidUsing.toLowerCase(),
      });

      // Clear fields
      setAmount("");
      setDescription("");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaidUsing(getSettings().defaultPaymentMethod || "Online");

      // Reload dashboard
      await fetchDashboardData();
      setIsAddExpenseOpen(false);
    } catch (err: any) {
      setAddError(err.response?.data?.error || "Failed to add expense.");
    } finally {
      setAddLoading(false);
    }
  };

  // ADD MONEY handler
  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moneyAmount || !moneySource || !moneyDate) {
      setMoneyError("Please fill in all required fields.");
      return;
    }

    setMoneyError(null);
    setMoneyLoading(true);

    try {
      await api.post("/expenses", {
        amount: Number(moneyAmount),
        category: "income",
        description: moneySource,
        date: moneyDate,
        note: moneyNote,
      });

      // Reset Form and close modal
      setMoneyAmount("");
      setMoneySource("");
      setMoneyNote("");
      setMoneyDate(new Date().toISOString().split("T")[0]);
      setIsAddMoneyOpen(false);

      // Reload dashboard
      await fetchDashboardData();
    } catch (err: any) {
      setMoneyError(err.response?.data?.error || "Failed to record money received.");
    } finally {
      setMoneyLoading(false);
    }
  };



  const openEditBudgetModal = (catKey: string, currentBudget: number) => {
    setEditingCategoryBudgetKey(catKey);
    setNewBudgetVal(String(currentBudget));
    setEditBudgetError(null);
  };

  const handleSaveCategoryBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryBudgetKey || !summary) return;

    if (!newBudgetVal || isNaN(Number(newBudgetVal)) || Number(newBudgetVal) < 0) {
      setEditBudgetError("Please enter a valid budget amount.");
      return;
    }

    setEditBudgetLoading(true);
    setEditBudgetError(null);

    try {
      const updatedAllocated = { ...summary.categoryAllocated };
      updatedAllocated[editingCategoryBudgetKey] = Number(newBudgetVal);

      // Save budget using standard /budget endpoint
      await api.post("/budget", {
        month: selectedMonth,
        pocketMoney: summary.pocketMoney,
        savingsGoal: summary.savingsGoal,
        allocated: updatedAllocated,
      });

      // Reset and refresh
      setEditingCategoryBudgetKey(null);
      await fetchDashboardData();
    } catch (err: any) {
      setEditBudgetError(err.response?.data?.error || "Failed to update budget.");
    } finally {
      setEditBudgetLoading(false);
    }
  };

  // EDIT EXPENSE modal opener
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setEditAmount(String(exp.amount));
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditDate(exp.date);
    setEditNote(exp.note || "");
    setEditPaidUsing((exp.paidUsing || "online").toLowerCase() === "cash" ? "Cash" : "Online");
    setEditError(null);
  };

  // UPDATE EXPENSE handler
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    if (!editAmount || !editDescription || !editDate) {
      setEditError("Please fill in all required fields.");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      await api.put(`/expenses/${editingExpense._id}`, {
        amount: Number(editAmount),
        category: editCategory,
        description: editDescription,
        date: editDate,
        note: editNote,
        paidUsing: editPaidUsing.toLowerCase(),
      });

      setEditingExpense(null);
      await fetchDashboardData();
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to update expense.");
    } finally {
      setEditLoading(false);
    }
  };

  // DELETE EXPENSE with manual Stack Undo handler
  const handleDeleteExpense = async (exp: Expense) => {
    try {
      await api.delete(`/expenses/${exp._id}`);

      // Push to custom Stack
      undoStack.current.push(exp);
      setUndoItemName(exp.description);
      setShowUndoToast(true);

      // Reset auto-dismiss timer
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setShowUndoToast(false);
      }, 6000); // Give the student 6 seconds to undo

      await fetchDashboardData();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  // UNDO DELETE handler (Pops from our Stack)
  const handleUndoDelete = async () => {
    const lastDeleted = undoStack.current.pop();
    if (!lastDeleted) return;

    try {
      // Re-create the transaction using POST
      await api.post("/expenses", {
        amount: lastDeleted.amount,
        category: lastDeleted.category,
        description: lastDeleted.description,
        date: lastDeleted.date,
        note: lastDeleted.note,
      });

      setShowUndoToast(false);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error restoring expense during Undo:", error);
    }
  };

  // SAVE SAVINGS GOAL handler
  const handleSaveSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Math.max(0, Number(goalInputVal) || 0);
    if (isNaN(num) || num < 0) {
      setGoalError("Please enter a valid target amount.");
      return;
    }

    setGoalLoading(true);
    setGoalError(null);

    try {
      try {
        await api.patch("/budget/savings-goal", {
          month: selectedMonth,
          savingsGoal: num,
        });
      } catch (patchErr) {
        // Fallback to updating budget preserving existing allocations
        const bRes = await api.get(`/budget?month=${selectedMonth}`);
        const currentBudget = bRes.data;
        await api.post("/budget", {
          month: selectedMonth,
          pocketMoney: currentBudget?.pocketMoney || 0,
          savingsGoal: num,
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
      }

      setIsSetGoalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      console.error("Error saving savings goal:", err);
      setGoalError(err.response?.data?.error || "Failed to update monthly savings goal.");
    } finally {
      setGoalLoading(false);
    }
  };

  // Financial calculations from backend summary (zero client-side calculations)
  const pocketMoney = summary?.totalMoneyReceived !== undefined ? summary.totalMoneyReceived : (summary?.pocketMoney || 0);
  const savingsGoal = summary?.savingsGoal || 0;

  // Total allocated sum in budget
  const totalAllocatedSum = summary?.allocated
    ? (Object.values(summary.allocated) as number[]).reduce((sum, val) => sum + Number(val || 0), 0)
    : 0;

  // Total spent in selected month
  const totalExpenseSum = summary?.totalExpenses || 0;

  // Remaining / Available Online Money
  const remainingCash = summary?.onlineMoney !== undefined
    ? summary.onlineMoney
    : (summary?.availableBalance !== undefined ? summary.availableBalance : (summary?.remainingBalance || 0));
  const availableBalance = remainingCash;

  // Current / Total Savings
  const currentSavings = summary?.totalSavings !== undefined ? summary.totalSavings : (summary?.currentSavings || 0);
  const netMonthSavings = summary?.netMonthSavings !== undefined ? summary.netMonthSavings : 0;
  const monthSavingsProgress = summary?.monthSavingsProgress !== undefined ? summary.monthSavingsProgress : Math.max(0, netMonthSavings);

  // Savings Goal indicators
  const savingsRemaining = summary?.remainingSavingsRequired || 0;

  // Filter expenses strictly belonging to the selected month: YYYY-MM
  const monthExpenses = expenses.filter((exp) => exp.date.startsWith(selectedMonth));

  // TRIE SEARCH engine: Match title/category instantly while typing
  // We rebuild the Trie when the expenses array updates
  const trie = useRef(new Trie<Expense>()); // [DSA] Prefix Tree (Trie) for O(L) time complexity auto-completion and fast searching
  useEffect(() => {
    const newTrie = new Trie<Expense>();
    for (const exp of expenses) {
      // Index by title (description) and category
      newTrie.insert(exp.description, exp);
      newTrie.insert(exp.category, exp);
    }
    trie.current = newTrie;
  }, [expenses]);

  // Compute Search Matches from Trie
  let matchedExpenses: Expense[] = [];
  if (searchQuery.trim()) {
    matchedExpenses = trie.current.search(searchQuery).filter((exp) => exp.date.startsWith(selectedMonth));
  } else {
    matchedExpenses = [...monthExpenses];
  }

  // Compute autocomplete suggestions from the existing Trie
  const getSuggestions = (queryText: string): string[] => {
    if (!queryText.trim()) return [];
    const matches = trie.current.search(queryText);
    const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));
    const uniqueDescs: string[] = [];
    for (const exp of sorted) {
      if (exp.description && exp.description.toLowerCase().startsWith(queryText.toLowerCase())) {
        if (!uniqueDescs.includes(exp.description)) {
          uniqueDescs.push(exp.description);
          if (uniqueDescs.length >= 5) break;
        }
      }
    }
    return uniqueDescs;
  };

  const addSuggestions = getSuggestions(description);
  const editSuggestions = getSuggestions(editDescription);

  // Apply filters: Category & Date Range
  const filteredExpenses = matchedExpenses.filter((exp) => {
    // 1. Category Filter
    if (filterCategory !== "all") {
      if (filterCategory === "income") {
        if (exp.category !== "income") return false;
      } else if (filterCategory === "utilities") {
        if (exp.category !== "utilities" && exp.category !== "stationery" && exp.category !== "other") return false;
      } else {
        if (exp.category !== filterCategory) return false;
      }
    }
    // 2. Start Date Filter
    if (filterStartDate && exp.date < filterStartDate) {
      return false;
    }
    // 3. End Date Filter
    if (filterEndDate && exp.date > filterEndDate) {
      return false;
    }
    return true;
  });

  // SORTING Engine using manual MERGE SORT (Stability guaranteed, O(N log N))
  const compareExpenses = (a: Expense, b: Expense): number => {
    const factor = sortDirection === "asc" ? 1 : -1;
    if (sortBy === "amount") {
      return (a.amount - b.amount) * factor;
    } else if (sortBy === "date") {
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * factor;
    } else if (sortBy === "category") {
      return a.category.localeCompare(b.category) * factor;
    } else if (sortBy === "title") {
      return a.description.localeCompare(b.description) * factor;
    }
    return 0;
  };

  const sortedExpenses = mergeSort(filteredExpenses, compareExpenses); // [DSA] Stable O(N log N) Merge Sort for ledger sorting

  // Recharts Pie Chart Data
  const COLORS = [
    "#f97316", // Food
    "#0ea5e9", // Transport
    "#6366f1", // Shopping
    "#f43f5e", // Entertainment
    "#ef4444", // Emergency
    "#10b981", // Savings
    "#f59e0b", // Other
  ];

  const chartData = summary?.allocated
    ? categories
        .map((cat) => ({
          name: cat.label,
          value: Number(summary.allocated?.[cat.key] || 0),
        }))
        .filter((item) => item.value > 0)
    : [];

  const formatMonthName = (mStr: string) => {
    const [year, mIndex] = mStr.split("-");
    const d = new Date(Number(year), Number(mIndex) - 1, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-col gap-12 md:gap-16 max-w-6xl mx-auto pb-16" id="dashboard-wrapper">
      {/* Undo Toast Notification */}
      <AnimatePresence>
        {showUndoToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-gray-900 border border-emerald-500/30 text-gray-100 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm"
            id="undo-toast"
          >
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Undo2 className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400">Transaction deleted</p>
              <p className="text-sm font-bold text-white truncate">"{undoItemName}"</p>
            </div>
            <button
              onClick={handleUndoDelete}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
              id="undo-action-btn"
            >
              Undo
            </button>
            <button
              onClick={() => setShowUndoToast(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header with Month Selection and Read-only lock notice */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-gray-950/20 hover:border-gray-700/50 transition-all duration-300" id="dashboard-header-container">
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4.5 py-3 bg-gray-950/60 border border-gray-800 hover:border-emerald-500/30 focus:border-emerald-500/70 focus:ring-4 focus:ring-emerald-500/10 text-sm text-gray-100 rounded-2xl outline-none font-bold transition-all shadow-inner"
            id="dashboard-month-select"
          />
        </div>

        {/* Lock indicator state */}
        {!isCurrentMonthEditable ? (
          <div className="flex items-start gap-3.5 px-5 py-4 bg-amber-500/5 border border-amber-500/15 text-amber-400 rounded-2xl text-xs max-w-md shadow-lg shadow-amber-500/2" id="readonly-warning-banner">
            <Lock className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-extrabold block text-amber-300 mb-0.5">Monthly Archive Read-Only</span>
              <p className="text-gray-400 leading-relaxed font-semibold">
                This is a historical archive. Previous months can be viewed but remain non-editable. Select the current month ({formatMonthName(currentMonthStr)}) to edit.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap w-full md:w-auto justify-end" id="editable-success-container">

            <button
              onClick={() => {
                setAmount("");
                setCategory("food");
                setDescription("");
                const d = new Date();
                const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                setDate(todayStr);
                setNote("");
                setPaidUsing(getSettings().defaultPaymentMethod || "Online");
                setAddError(null);
                setIsAddExpenseOpen(true);
              }}
              className="w-full md:w-auto px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 border border-emerald-400/20"
              id="global-add-expense-btn"
            >
              <Plus className="h-4.5 w-4.5 font-bold stroke-[3px]" />
              <span>Add Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Unified Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-summary-cards">
        {/* Metric 1: Money Received */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-gray-950/15 hover:border-gray-700/50 hover:-translate-y-1 transition-all duration-300 relative group" id="money-received-metric-card">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Money Received
                </span>
                <span className="text-3xl font-black tracking-tight text-white mt-1 block">
                  {currency}{pocketMoney}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-emerald-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-300 transition-colors duration-300 shadow-inner">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-sans font-semibold block mt-4.5">Total pocket money & additions</span>
          </div>
          {isCurrentMonthEditable && (
            <button
              onClick={() => {
                setMoneyAmount("");
                setMoneySource("");
                setMoneyNote("");
                setMoneyDate(new Date().toISOString().split("T")[0]);
                setMoneyError(null);
                setIsAddMoneyOpen(true);
              }}
              className="mt-4 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              id="add-money-metric-btn"
            >
              <Plus className="h-3.5 w-3.5 font-bold stroke-[2.5px]" />
              <span>Add Money</span>
            </button>
          )}
        </div>

        {/* Metric 2: Total Spent */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-gray-950/15 hover:border-gray-700/50 hover:-translate-y-1 transition-all duration-300 relative group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Total Spent
              </span>
              <span className="text-3xl font-black tracking-tight text-rose-400 mt-1 block">
                {currency}{totalExpenseSum}
              </span>
            </div>
            <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl text-rose-400 group-hover:bg-rose-500/10 group-hover:text-rose-300 transition-colors duration-300 shadow-inner">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 3: Online Money */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-gray-950/15 hover:border-gray-700/50 hover:-translate-y-1 transition-all duration-300 relative group" id="available-balance-metric-card">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Online Money (Spendable)
              </span>
              <span className={`text-3xl font-black tracking-tight mt-1 block ${availableBalance < 0 ? "text-rose-400" : "text-blue-400"}`}>
                {currency}{availableBalance}
              </span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${availableBalance < 0 ? "bg-rose-500/5 border-rose-500/15 text-rose-400 group-hover:bg-rose-500/10 group-hover:text-rose-300" : "bg-blue-500/5 border-blue-500/15 text-blue-400 group-hover:bg-blue-500/10 group-hover:text-blue-300"} transition-colors duration-300 shadow-inner`}>
              <TrendingDown className="h-5 w-5 rotate-180" />
            </div>
          </div>
          {availableBalance < 0 && (
            <span className="text-[10px] text-rose-400 font-sans font-semibold block mt-4.5">
              Overspent balance!
            </span>
          )}
        </div>

        {/* Metric 4: Monthly Savings Goal */}
        {(() => {
          const savingsPercentage = savingsGoal > 0 ? Math.min(100, Math.round((monthSavingsProgress / savingsGoal) * 100)) : 0;
          return (
            <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-gray-950/15 hover:border-gray-700/50 hover:-translate-y-1 transition-all duration-300 relative group" id="savings-goal-card">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Savings Goal
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setGoalInputVal(savingsGoal > 0 ? String(savingsGoal) : "");
                        setGoalError(null);
                        setIsSetGoalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/25 text-purple-300 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title={savingsGoal > 0 ? "Edit monthly savings goal" : "Set monthly savings goal"}
                    >
                      {savingsGoal > 0 ? (
                        <>
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 stroke-[2.5]" />
                          <span>Set Target</span>
                        </>
                      )}
                    </button>
                    <div className="p-2.5 bg-purple-500/5 border border-purple-500/15 rounded-xl text-purple-400 group-hover:bg-purple-500/10 group-hover:text-purple-300 transition-colors duration-300 shadow-inner">
                      <Target className="h-4.5 w-4.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black tracking-tight text-purple-400 block">
                        {currency}{formatIndianNumber(savingsGoal)}
                      </span>
                      {savingsGoal > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">
                          {savingsPercentage}%
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans font-semibold block mt-1">
                      {savingsGoal > 0 ? "Target set for this month" : "No monthly target set — click 'Set Target'"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
                  <span className="text-gray-400">Monthly Progress</span>
                  <span className="text-purple-400 font-mono font-bold">{savingsPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden relative border border-gray-800/40 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${savingsPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] mt-1.5 font-medium">
                  <span className="text-gray-400">
                    {savingsGoal > 0
                      ? `${currency}${formatIndianNumber(monthSavingsProgress)} saved`
                      : "₹0 saved toward goal"}
                  </span>
                  <span className={monthSavingsProgress >= savingsGoal && savingsGoal > 0 ? "text-emerald-400 font-semibold" : "text-gray-500"}>
                    {savingsGoal > 0
                      ? (monthSavingsProgress >= savingsGoal ? "Goal Achieved! 🎉" : `${currency}${formatIndianNumber(Math.max(0, savingsGoal - monthSavingsProgress))} to go`)
                      : "No target set"}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Category Progress Cards Layout */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 flex flex-col gap-6 shadow-xl shadow-gray-950/20 hover:border-gray-700/50 transition-all duration-300" id="active-category-cards-section">
        <div className="border-b border-gray-800 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
              <span>Active Category Budgets</span>
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-extrabold rounded-full border border-emerald-500/20 font-mono">
              {categories.length}
            </span>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetCategories}
              className="text-[11px] text-gray-500 hover:text-emerald-400 font-bold transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50 cursor-pointer"
              title="Reset all categories back to system defaults"
              id="reset-categories-defaults-btn"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const allocatedAmt = summary ? Number(summary.categoryAllocated?.[cat.key] || 0) : 0;
            const spentAmt = summary ? Number(summary.categorySpending?.[cat.key] || 0) : 0;
            const remainingAmt = summary ? Number(summary.remainingCategoryBudget?.[cat.key] || 0) : 0;
            const percentUsed = allocatedAmt > 0 ? Math.min(100, Math.round((spentAmt / allocatedAmt) * 100)) : 0;
            const isOver = spentAmt > allocatedAmt;
            const remainingAbs = Math.abs(remainingAmt);
            const emoji = cat.emoji || getCategoryEmoji(cat.key);
            const barColor = cat.color || "bg-violet-500";

            return (
              <div
                key={cat.key}
                className="bg-gray-950/40 border border-gray-800/50 rounded-2xl p-5.5 flex flex-col gap-4 hover:border-gray-700/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-950/20 transition-all duration-300 relative group"
                id={`category-card-${cat.key}`}
              >
                {/* Header: Name and action icons */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-100 flex items-center gap-2 min-w-0 pr-2">
                    <span className="text-base shrink-0">{emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </span>
                  {isCurrentMonthEditable && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditBudgetModal(cat.key, allocatedAmt)}
                        className="p-1.5 bg-gray-900/60 border border-gray-800/80 hover:border-emerald-500/20 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-xl transition-all duration-200 cursor-pointer"
                        title={`Edit ${cat.label} Budget`}
                        id={`edit-budget-btn-${cat.key}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToRemove(cat)}
                        className="p-1.5 bg-gray-900/60 border border-gray-800/80 hover:border-rose-500/30 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded-xl transition-all duration-200 cursor-pointer"
                        title={`Remove ${cat.label} Category`}
                        id={`remove-category-btn-${cat.key}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Spent / Budget Amount */}
                <div className="text-lg font-black text-gray-100 flex items-baseline gap-1.5">
                  <span>{currency}{spentAmt}</span>
                  <span className="text-xs font-bold text-gray-500">/ {currency}{allocatedAmt}</span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full bg-gray-950 rounded-full overflow-hidden mt-0.5 relative border border-gray-900/40 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isOver ? "bg-red-500" : barColor}`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>

                {/* Progress Percentage and Remaining Budget */}
                <div className="flex justify-between items-center text-xs mt-0.5">
                  <span className={`font-extrabold ${isOver ? "text-red-400" : percentUsed >= 75 ? "text-amber-400" : "text-emerald-400"}`}>
                    {percentUsed}%
                  </span>
                  <span className={`font-semibold text-[11px] ${isOver ? "text-red-400 flex items-center gap-1.5" : "text-gray-400"}`}>
                    {isOver ? (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 inline shrink-0" />
                        <span>Over by {currency}{remainingAbs}</span>
                      </>
                    ) : (
                      <span>{currency}{remainingAmt} left</span>
                    )}
                  </span>
                </div>

                {/* View & Edit Category Expenses */}
                {(() => {
                  const catExps = expenses.filter(
                    (e) => e.category === cat.key && e.date.startsWith(selectedMonth)
                  );
                  return (
                    <button
                      type="button"
                      onClick={() => setViewingCategoryKey(cat.key)}
                      className="mt-1 pt-2.5 border-t border-gray-800/40 text-[11px] font-bold text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-between cursor-pointer w-full text-left"
                      id={`view-category-expenses-${cat.key}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Edit className="h-3 w-3 text-emerald-400/80" />
                        <span>View / Edit Expenses ({catExps.length})</span>
                      </span>
                      <span>→</span>
                    </button>
                  );
                })()}
              </div>
            );
          })}

          {/* + Add Custom Category Card */}
          <button
            type="button"
            onClick={() => {
              setCatError(null);
              setIsAddCategoryOpen(true);
            }}
            className="border-2 border-dashed border-gray-800 hover:border-emerald-500/60 bg-gray-950/30 hover:bg-emerald-500/5 rounded-2xl p-5.5 flex flex-col items-center justify-center gap-3.5 text-gray-400 hover:text-emerald-400 transition-all duration-300 min-h-[175px] group cursor-pointer"
            id="add-category-card-btn"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-900/90 border border-gray-800 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-all duration-300 shadow-lg">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-emerald-400 group-hover:scale-125 transition-transform duration-200" />
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-sm font-extrabold text-gray-200 group-hover:text-emerald-400 transition-colors">
                Add Category
              </span>
              <span className="text-[11px] text-gray-500 font-medium">Personal Choice</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Expense Distribution Card */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 shadow-xl shadow-gray-950/20 hover:border-gray-700/50 transition-all duration-300" id="expense-distribution-container">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3.5">
          <h3 className="text-lg font-black text-white flex items-center gap-2.5 tracking-tight">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Expense Distribution
          </h3>
          <span className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider">
            Category Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-2">
          {/* Left panel: Primary visualization with Recharts Pie Chart (donut chart) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            {chartData.length > 0 ? (
              <div className="h-72 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111625", borderColor: "#2b3554", borderRadius: "16px", padding: "10px 14px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)" }}
                      itemStyle={{ color: "#f1f5f9", fontSize: "12px", fontWeight: "bold" }}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", color: "#8897bd", fontWeight: "600" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-800 rounded-2xl bg-gray-950/40">
                <Percent className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-xs font-semibold text-gray-400">No category limits set this month</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Configure your pocket money allocations on the Budget Planning screen first.
                </p>
              </div>
            )}
          </div>

          {/* Right panel: Clean Summary showing Highest & Lowest Spending Categories */}
          <div className="md:col-span-6 flex flex-col gap-5">
            <div>
              <h4 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Category Performance</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                A streamlined insight into your highest and lowest spending categories for this period. Keeping track of active categories prevents overspending.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {(() => {
                const activeCategoriesList = [];
                if (summary?.categorySpending) {
                  Object.entries(summary.categorySpending).forEach(([catKey, amount]) => {
                    const amt = Number(amount || 0);
                    if (amt > 0) {
                      activeCategoriesList.push({
                        key: catKey,
                        label: getCategoryLabel(catKey),
                        emoji: getCategoryEmoji(catKey),
                        amount: amt
                      });
                    }
                  });
                }
                activeCategoriesList.sort((a, b) => b.amount - a.amount);

                if (activeCategoriesList.length === 0) {
                  return (
                    <div className="bg-gray-950/40 border border-gray-800/50 rounded-2xl p-5 text-center transition-all duration-300 shadow-sm">
                      <span className="text-sm font-semibold text-gray-400">
                        No spending recorded yet this month
                      </span>
                    </div>
                  );
                }

                if (activeCategoriesList.length === 1) {
                  const cat = activeCategoriesList[0];
                  return (
                    <div className="bg-gray-950/40 hover:bg-gray-950/60 border border-gray-800/50 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-sm group">
                      <div>
                        <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-wider block">Only Active Category</span>
                        <span className="text-sm font-bold text-white block mt-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">{cat.emoji}</span>
                            <span>{cat.label}</span>
                          </div>
                        </span>
                      </div>
                      <span className="text-base font-black text-rose-400 tracking-tight">
                        {currency}{formatIndianNumber(cat.amount)}
                      </span>
                    </div>
                  );
                }

                const highest = activeCategoriesList[0];
                const lowest = activeCategoriesList[activeCategoriesList.length - 1];

                return (
                  <>
                    {/* Highest Spending Category */}
                    <div className="bg-gray-950/40 hover:bg-gray-950/60 border border-gray-800/50 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-sm group">
                      <div>
                        <span className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider block">Highest Spending Category</span>
                        <span className="text-sm font-bold text-white block mt-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">{highest.emoji}</span>
                            <span>{highest.label}</span>
                          </div>
                        </span>
                      </div>
                      <span className="text-base font-black text-rose-400 tracking-tight">
                        {currency}{formatIndianNumber(highest.amount)}
                      </span>
                    </div>

                    {/* Lowest Spending Category */}
                    <div className="bg-gray-950/40 hover:bg-gray-950/60 border border-gray-800/50 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-sm group">
                      <div>
                        <span className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider block">Lowest Spending Category</span>
                        <span className="text-sm font-bold text-white block mt-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">{lowest.emoji}</span>
                            <span>{lowest.label}</span>
                          </div>
                        </span>
                      </div>
                      <span className="text-base font-black text-emerald-400 tracking-tight">
                        {currency}{formatIndianNumber(lowest.amount)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Compact Recent Transactions Preview */}
      {(() => {
        const recentTransactions = expenses
          .slice()
          .sort((a, b) => {
            const dateCmp = b.date.localeCompare(a.date);
            if (dateCmp !== 0) return dateCmp;
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          })
          .slice(0, 5);

        return (
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 md:p-7 flex flex-col gap-4 shadow-xl shadow-gray-950/20 hover:border-gray-700/50 transition-all duration-300" id="recent-transactions-section">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <History className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight" id="recent-transactions-title">
                    Recent Transactions
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">Quick overview of recent activity</span>
                </div>
              </div>

              <Link
                to="/history"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                id="view-all-transactions-top-link"
              >
                <span>View all transactions →</span>
              </Link>
            </div>

            {recentTransactions.length > 0 ? (
              <div className="flex flex-col divide-y divide-gray-800/60" id="recent-transactions-preview-list">
                {recentTransactions.map((exp) => {
                  const isIncome = exp.category === "income";
                  const emoji = getEmojiForTransaction(exp.description, exp.category);
                  return (
                    <div
                      key={exp._id}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-gray-950/40 rounded-xl transition-colors duration-150 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0 select-none p-2 bg-gray-950/80 border border-gray-800/60 rounded-xl group-hover:scale-105 transition-all duration-300 shadow-inner">
                          {emoji}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-gray-100 group-hover:text-white transition-colors truncate">
                            {exp.description}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-gray-400 font-semibold truncate">
                              {getCategoryLabel(exp.category)}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono font-medium">• {formatDateGPay(exp.date)}</span>
                            {!isIncome && (
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                (exp.paidUsing || "online").toLowerCase() === "cash"
                                  ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                                  : "bg-blue-500/10 border-blue-500/25 text-blue-300"
                              }`}>
                                {(exp.paidUsing || "online").toLowerCase() === "cash" ? "Cash" : "Online"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-sm font-black font-mono tracking-tight ${isIncome ? "text-emerald-400" : "text-white"}`}>
                          {isIncome ? "+" : "-"}{currency}{formatIndianNumber(exp.amount)}
                        </span>
                        {isCurrentMonthEditable && (
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 bg-gray-900/60 border border-gray-800/80 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Edit transaction"
                            id={`edit-recent-expense-${exp._id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500 border border-dashed border-gray-800/80 rounded-2xl bg-gray-950/20 px-4">
                <span className="text-xs font-semibold text-gray-400">No recent transactions recorded.</span>
              </div>
            )}

            <div className="flex justify-center pt-2 border-t border-gray-800/60">
              <Link
                to="/history"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-all flex items-center gap-1.5 py-1.5 px-4 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                id="view-all-transactions-bottom-link"
              >
                <span>View all transactions →</span>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* 7. Full Edit Modal */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative"
              id="edit-expense-modal"
            >
              <button
                onClick={() => setEditingExpense(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-gray-800 pb-3.5 mb-5">
                <Edit className="h-5 w-5 text-emerald-400" />
                Edit Transaction Details
              </h3>

              <form onSubmit={handleUpdateExpense} className="flex flex-col gap-4">
                {editError && (
                  <p className="text-xs text-rose-500 font-medium bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                    {editError}
                  </p>
                )}

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-400">Description *</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => {
                      setEditDescription(e.target.value);
                      setShowEditSuggestions(true);
                    }}
                    onFocus={() => setShowEditSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowEditSuggestions(false), 200);
                    }}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none w-full"
                    placeholder="e.g. Lunch, snacks, bus ticket..."
                    required
                  />
                  {showEditSuggestions && editSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                      {editSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setEditDescription(suggestion);
                            setShowEditSuggestions(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-sm text-gray-200 transition-colors border-b border-gray-800/50 last:border-0 cursor-pointer flex items-center gap-2"
                        >
                          <Search className="h-3.5 w-3.5 text-gray-500" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400">Amount ({currency}) *</label>
                    <input
                      type="number"
                      min="1"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400">Category *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none cursor-pointer font-bold text-gray-200"
                    >
                      {categories.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.emoji || "🏷️"} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Transaction Date *</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400">Paid using *</label>
                    {editPaidUsing === "Cash" && summary?.cashSavings !== undefined && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        Avail. Cash Savings: {currency}{summary.cashSavings}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPaidUsing("Online")}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        editPaidUsing === "Online"
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-sm"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                      <span>Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPaidUsing("Cash")}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        editPaidUsing === "Cash"
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <Banknote className="h-3.5 w-3.5 text-amber-400" />
                      <span>Cash</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    id="submit-edit-expense-btn"
                  >
                    {editLoading ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
              id="add-expense-modal"
            >
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-gray-800 pb-3.5 mb-5">
                <Plus className="h-5 w-5 text-emerald-400 stroke-[3px]" />
                Add Expense
              </h3>

              <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
                {addError && (
                  <p className="text-xs text-rose-500 font-medium bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                    {addError}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="120"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none cursor-pointer font-bold text-gray-200"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.emoji || "🏷️"} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-400">Description *</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setShowAddSuggestions(true);
                    }}
                    onFocus={() => setShowAddSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowAddSuggestions(false), 200);
                    }}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none w-full"
                    placeholder="e.g. Lunch, snacks, bus ticket..."
                    required
                  />
                  {showAddSuggestions && addSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                      {addSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setDescription(suggestion);
                            setShowAddSuggestions(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-sm text-gray-200 transition-colors border-b border-gray-800/50 last:border-0 cursor-pointer flex items-center gap-2"
                        >
                          <Search className="h-3.5 w-3.5 text-gray-500" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none font-semibold text-gray-200"
                    required
                  />
                </div>

                {/* Paid using selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400">Paid using *</label>
                    {paidUsing === "Cash" && summary?.cashSavings !== undefined && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        Avail. Cash Savings: {currency}{summary.cashSavings}
                      </span>
                    )}
                    {paidUsing === "Online" && summary?.onlineMoney !== undefined && (
                      <span className="text-[10px] text-blue-400 font-mono font-bold">
                        Avail. Online Money: {currency}{summary.onlineMoney}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaidUsing("Online")}
                      className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        paidUsing === "Online"
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-sm"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                      id="add-pay-online-btn"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                      <span>Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidUsing("Cash")}
                      className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        paidUsing === "Cash"
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                      id="add-pay-cash-btn"
                    >
                      <Banknote className="h-3.5 w-3.5 text-amber-400" />
                      <span>Cash</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {paidUsing === "Online" ? "Deducts from your spendable Online Money." : "Deducts from your Cash Savings reserve."}
                  </span>
                </div>

                {/* Optional Note */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Note (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="e.g. Any extra details..."
                  />
                </div>

                <div className="flex items-center gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(false)}
                    className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    id="submit-add-expense-btn"
                  >
                    {addLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Money Modal */}
      <AnimatePresence>
        {isAddMoneyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
              id="add-money-modal"
            >
              <button
                onClick={() => setIsAddMoneyOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-gray-800 pb-3.5 mb-5">
                <Wallet className="h-5 w-5 text-emerald-400" />
                ➕ Record Money Received
              </h3>

              <form onSubmit={handleAddMoney} className="flex flex-col gap-4">
                {moneyError && (
                  <p className="text-xs text-rose-500 font-medium bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                    {moneyError}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    value={moneyAmount}
                    onChange={(e) => setMoneyAmount(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="e.g. 5000"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Source / Description *</label>
                  <input
                    type="text"
                    value={moneySource}
                    onChange={(e) => setMoneySource(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="e.g. Pocket Money, Salary, Cashback"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Date *</label>
                  <input
                    type="date"
                    value={moneyDate}
                    onChange={(e) => setMoneyDate(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none font-semibold text-gray-200"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Optional Note</label>
                  <input
                    type="text"
                    value={moneyNote}
                    onChange={(e) => setMoneyNote(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="Any extra info..."
                  />
                </div>

                <div className="flex items-center gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddMoneyOpen(false)}
                    className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={moneyLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    id="submit-add-money-btn"
                  >
                    {moneyLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* 9. Edit Category Budget Modal */}
      <AnimatePresence>
        {editingCategoryBudgetKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
              id="edit-category-budget-modal"
            >
              <button
                onClick={() => setEditingCategoryBudgetKey(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-gray-800 pb-3.5 mb-5">
                <Edit className="h-5 w-5 text-emerald-400" />
                Edit {getCategoryLabel(editingCategoryBudgetKey)} Budget
              </h3>

              <form onSubmit={handleSaveCategoryBudget} className="flex flex-col gap-4">
                {editBudgetError && (
                  <p className="text-xs text-rose-500 font-medium bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                    {editBudgetError}
                  </p>
                )}

                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">Current Budget</span>
                  <strong className="text-gray-200 text-sm font-mono">
                    {currency}{summary?.categoryAllocated?.[editingCategoryBudgetKey] || 0}
                  </strong>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">New Budget *</label>
                  <input
                    type="number"
                    min="0"
                    value={newBudgetVal}
                    onChange={(e) => setNewBudgetVal(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none"
                    placeholder="Enter new budget amount"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCategoryBudgetKey(null)}
                    className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editBudgetLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    id="submit-edit-budget-btn"
                  >
                    {editBudgetLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. View / Edit Category Expenses Modal */}
      <AnimatePresence>
        {viewingCategoryKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] flex flex-col"
              id="category-expenses-view-modal"
            >
              <button
                onClick={() => setViewingCategoryKey(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b border-gray-800 pb-3.5 mb-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span className="text-xl">{getCategoryEmoji(viewingCategoryKey)}</span>
                  <span>{getCategoryLabel(viewingCategoryKey)} Expenses</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Review, edit, or fix any mistakes recorded under this category.
                </p>
              </div>

              {(() => {
                const catExpenses = expenses
                  .filter((e) => e.category === viewingCategoryKey && e.date.startsWith(selectedMonth))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (catExpenses.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-950/30 px-6 flex flex-col items-center justify-center gap-2 my-auto">
                      <FileText className="h-7 w-7 text-gray-600" />
                      <span className="text-xs font-bold text-gray-400">
                        No expenses recorded in {getCategoryLabel(viewingCategoryKey)} for this month.
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 my-2">
                    {catExpenses.map((exp) => (
                      <div
                        key={exp._id}
                        className="p-3 bg-gray-950/50 hover:bg-gray-950/80 border border-gray-800/60 rounded-xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-100 truncate">
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {exp.date} {exp.note ? `• ${exp.note}` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-black text-white">
                            {currency}{exp.amount}
                          </span>
                          {isCurrentMonthEditable && (
                            <button
                              onClick={() => {
                                setViewingCategoryKey(null);
                                openEditModal(exp);
                              }}
                              className="p-1.5 bg-gray-900 border border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              title="Edit this expense"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="border-t border-gray-800 pt-3.5 mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingCategoryKey(null)}
                  className="px-4 py-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Quick Set Monthly Savings Goal Modal */}
      <AnimatePresence>
        {isSetGoalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl flex flex-col gap-5 relative"
              id="set-savings-goal-modal"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Monthly Savings Target</h3>
                    <span className="text-[11px] text-gray-400">Set target for {selectedMonth}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSetGoalOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {goalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{goalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSavingsGoal} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Target Savings Goal ({currency}) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">{currency}</span>
                    <input
                      type="number"
                      value={goalInputVal}
                      onChange={(e) => setGoalInputVal(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 focus:border-purple-500/50 text-sm text-gray-100 rounded-xl outline-none font-bold"
                      placeholder="e.g. 1000"
                      min="0"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quick Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGoalInputVal(String(preset))}
                        className="py-1.5 bg-gray-950 hover:bg-purple-500/15 border border-gray-800 hover:border-purple-500/30 text-gray-300 hover:text-purple-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {currency}{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Setting this target will let Fenno calculate your monthly savings achievement status and percentage progress.</span>
                </div>

                <div className="flex items-center gap-3 justify-end mt-2 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsSetGoalOpen(false)}
                    className="px-4.5 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={goalLoading}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {goalLoading ? "Saving..." : "Save Target Goal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Add Custom Category Modal */}
      <AnimatePresence>
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl relative"
              id="add-category-modal"
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
                  <p className="text-xs text-gray-500 font-medium">Personalize your student budget buckets</p>
                </div>
              </div>

              <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
                {catError && (
                  <p className="text-xs text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    {catError}
                  </p>
                )}

                {/* Category Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="e.g. Gym & Fitness, Books, Gaming, Rent"
                    className="px-4 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none font-semibold"
                    id="new-category-name-input"
                  />
                </div>

                {/* Quick Emoji Picker */}
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

                {/* Color Accent Picker */}
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

                {/* Optional Monthly Allocation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">
                    Monthly Budget Allocation (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">
                      {currency}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={newCatBudget}
                      onChange={(e) => setNewCatBudget(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-sm text-gray-100 rounded-xl outline-none font-mono font-bold"
                      id="new-category-budget-input"
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
                    id="submit-add-category-btn"
                  >
                    {catLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Remove Category Confirmation Modal */}
      <AnimatePresence>
        {categoryToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl relative"
              id="remove-category-confirm-modal"
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
                    This category card will be removed from your active budgets and planning views.
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
                  id="confirm-remove-category-btn"
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
