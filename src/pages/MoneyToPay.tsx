import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { MoneyToPayRecord, MoneyToPaySummary } from "../types";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Edit,
  History,
  X,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Building,
  GraduationCap,
  FileText,
  ShoppingBag,
  Home,
  Tag,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function MoneyToPayPage() {
  const [records, setRecords] = useState<MoneyToPayRecord[]>([]);
  const [summary, setSummary] = useState<MoneyToPaySummary>({
    totalDue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalOverdue: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    paidCount: 0,
    pendingCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due-asc");

  // Modals state
  const [isObligationModalOpen, setIsObligationModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Selected record for action
  const [selectedRecord, setSelectedRecord] = useState<MoneyToPayRecord | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    payeeName: "",
    amount: "",
    dueDate: "",
    dateAdded: new Date().toISOString().split("T")[0],
    category: "Hostel",
    note: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    paidUsing: "online",
  });

  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const categories = [
    { key: "Hostel", label: "Hostel & Rent", icon: Home, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { key: "Fees", label: "Tuition & Fees", icon: GraduationCap, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { key: "Bills", label: "Utilities & Bills", icon: Receipt, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    { key: "Borrowed Money", label: "Borrowed Money", icon: Building, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { key: "Shopping", label: "Shopping / EMI", icon: ShoppingBag, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
    { key: "Other", label: "Other / Misc", icon: Tag, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  ];

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/money-to-pay");
      setRecords(res.data.records || []);
      setSummary(res.data.summary || {
        totalDue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        totalOverdue: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        paidCount: 0,
        pendingCount: 0,
        totalCount: 0,
      });
    } catch (err) {
      console.error("Error fetching money to pay records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Open Add/Edit Modal
  const openObligationModal = (record?: MoneyToPayRecord) => {
    setFormError("");
    if (record) {
      setSelectedRecord(record);
      setIsEditing(true);
      setFormData({
        payeeName: record.payeeName,
        amount: record.amount.toString(),
        dueDate: record.dueDate,
        dateAdded: record.dateAdded || new Date().toISOString().split("T")[0],
        category: record.category || "Other",
        note: record.note || "",
      });
    } else {
      setSelectedRecord(null);
      setIsEditing(false);
      // default due date: 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setFormData({
        payeeName: "",
        amount: "",
        dueDate: d.toISOString().split("T")[0],
        dateAdded: new Date().toISOString().split("T")[0],
        category: "Hostel",
        note: "",
      });
    }
    setIsObligationModalOpen(true);
  };

  // Open Payment Modal
  const openPaymentModal = (record: MoneyToPayRecord) => {
    setFormError("");
    setSelectedRecord(record);
    setPaymentData({
      amount: record.remainingAmount.toString(),
      date: new Date().toISOString().split("T")[0],
      note: "",
      paidUsing: "online",
    });
    setIsPayModalOpen(true);
  };

  // Open History Modal
  const openHistoryModal = (record: MoneyToPayRecord) => {
    setSelectedRecord(record);
    setIsHistoryModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (record: MoneyToPayRecord) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.payeeName.trim()) {
      setFormError("Please enter the payee, person, or organisation name.");
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!formData.dueDate) {
      setFormError("Due date is mandatory.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEditing && selectedRecord) {
        await api.put(`/money-to-pay/${selectedRecord._id}`, formData);
      } else {
        await api.post("/money-to-pay", formData);
      }
      setIsObligationModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setFormError("");

    const numAmount = Number(paymentData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (numAmount > selectedRecord.remainingAmount) {
      setFormError(`Payment cannot exceed the remaining balance of ₹${selectedRecord.remainingAmount}.`);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post(`/money-to-pay/${selectedRecord._id}/payments`, paymentData);
      setIsPayModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedRecord || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/money-to-pay/${selectedRecord._id}`);
      setIsDeleteModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      console.error("Error deleting record:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Sort
  const filteredRecords = records
    .filter((r) => {
      if (statusFilter !== "all") {
        if (statusFilter === "overdue" && r.status !== "Overdue") return false;
        if (statusFilter === "due soon" && !r.isDueSoon) return false;
        if (statusFilter === "pending" && r.status !== "Pending") return false;
        if (statusFilter === "partially paid" && r.status !== "Partially Paid") return false;
        if (statusFilter === "paid" && r.status !== "Paid") return false;
      }

      if (categoryFilter !== "all" && r.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.payeeName.toLowerCase().includes(q);
        const matchNote = (r.note || "").toLowerCase().includes(q);
        const matchCat = (r.category || "").toLowerCase().includes(q);
        return matchName || matchNote || matchCat;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "due-asc") return (a.dueDate || "").localeCompare(b.dueDate || "");
      if (sortBy === "due-desc") return (b.dueDate || "").localeCompare(a.dueDate || "");
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      if (sortBy === "remaining-desc") return b.remainingAmount - a.remainingAmount;
      return 0;
    });

  const overdueOrDueSoonList = records.filter(
    (r) => r.remainingAmount > 0 && (r.status === "Overdue" || r.isDueSoon)
  );

  return (
    <div className="space-y-6 pb-12" id="money-to-pay-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-rose-400 tracking-wider">Lending & Dues</span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Money to Pay</h1>
              <p className="text-xs text-gray-400">Manage obligations, bills, hostel fees, and payment deadlines</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => openObligationModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-95 shrink-0"
          id="btn-add-obligation"
        >
          <Plus className="w-4 h-4" />
          <span>Add Obligation</span>
        </button>
      </div>

      {/* Due Date Alert Banner (if any upcoming or overdue) */}
      {overdueOrDueSoonList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-gray-900/40 border border-rose-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Upcoming & Overdue Payment Deadlines</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                  {overdueOrDueSoonList.length} Action Needed
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {summary.overdueCount > 0 && (
                  <span className="text-rose-400 font-medium mr-2">
                    ₹{summary.totalOverdue.toLocaleString("en-IN")} Overdue ({summary.overdueCount} bill{summary.overdueCount > 1 ? "s" : ""})
                  </span>
                )}
                {summary.dueSoonCount > 0 && (
                  <span className="text-amber-400 font-medium">
                    {summary.dueSoonCount} payment{summary.dueSoonCount > 1 ? "s" : ""} due within 3 days.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStatusFilter("overdue")}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all"
            >
              View Overdue
            </button>
            <button
              onClick={() => setStatusFilter("due soon")}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-all"
            >
              View Due Soon
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Due */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-rose-500/30 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Due</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">₹{summary.totalDue.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.totalCount} total obligations tracked</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">₹{summary.totalPaid.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.paidCount} obligations fully cleared</p>
          </div>
        </div>

        {/* Remaining to Pay */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-amber-500/30 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Remaining to Pay</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-400 tracking-tight">₹{summary.totalRemaining.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.pendingCount} pending obligations</p>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-rose-600/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Overdue Amount</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-400 tracking-tight">
              ₹{summary.totalOverdue.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-rose-300/80 mt-1">
              {summary.overdueCount > 0
                ? `${summary.overdueCount} obligation${summary.overdueCount > 1 ? "s" : ""} past deadline!`
                : "No overdue payments 🎉"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by payee, category, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-all"
            id="input-search-money-to-pay"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-gray-950/60 border border-gray-800/80 rounded-xl p-1 text-xs shrink-0">
            {["all", "due soon", "overdue", "pending", "partially paid", "paid"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === status
                    ? "bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-950/60 border border-gray-800/80 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-rose-500/50 shrink-0"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-950/60 border border-gray-800/80 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-rose-500/50 shrink-0"
          >
            <option value="due-asc">Due Date: Earliest First</option>
            <option value="due-desc">Due Date: Latest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
            <option value="remaining-desc">Remaining: High to Low</option>
          </select>
        </div>
      </div>

      {/* Records List / Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Loading payment obligations...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-gray-900/30 border border-gray-800/60 rounded-2xl py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Payment Obligations Found</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "No records match your selected filter criteria. Try resetting filters."
              : "Keep track of college fees, hostel rent, utility bills, and borrowed money with due-date reminders!"}
          </p>
          {!searchQuery && statusFilter === "all" && categoryFilter === "all" && (
            <button
              onClick={() => openObligationModal()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Obligation</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => {
            const isFullyPaid = record.status === "Paid";
            const isOverdue = record.status === "Overdue";
            const percentPaid =
              record.amount > 0 ? Math.min(100, Math.round((record.amountPaid / record.amount) * 100)) : 0;

            const categoryMatch = categories.find((c) => c.key.toLowerCase() === (record.category || "").toLowerCase());
            const CategoryIcon = categoryMatch?.icon || Tag;

            return (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gray-900/60 backdrop-blur-xl border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg ${
                  isFullyPaid
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : isOverdue
                    ? "border-rose-500/40 bg-rose-950/15"
                    : record.isDueSoon
                    ? "border-amber-500/40 bg-amber-950/10"
                    : "border-gray-800/80 hover:border-gray-700"
                }`}
              >
                <div>
                  {/* Top Line: Payee, Category & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-semibold text-sm shrink-0">
                        <CategoryIcon className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-white truncate" title={record.payeeName}>
                          {record.payeeName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-800/80 text-[11px] text-gray-300">
                            {record.category || "Other"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                          isFullyPaid
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isOverdue
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30 font-semibold"
                            : record.isDueSoon
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold"
                            : record.status === "Partially Paid"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {isOverdue ? "Overdue" : record.isDueSoon ? "Due Soon" : record.status}
                      </span>
                    </div>
                  </div>

                  {/* Amounts breakdown */}
                  <div className="mt-5 p-3.5 bg-gray-950/60 border border-gray-800/60 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Obligation:</span>
                      <span className="font-semibold text-white">₹{record.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Amount Paid:</span>
                      <span className="font-semibold text-emerald-400">₹{record.amountPaid.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-gray-800/80 pt-2 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-300">Remaining to Pay:</span>
                      <span className="text-sm font-bold text-rose-400">
                        ₹{record.remainingAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 text-right mt-1">{percentPaid}% cleared</div>
                    </div>
                  </div>

                  {/* Due Date & Note */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        Due Date: <strong className="text-gray-300 font-medium">{record.dueDate}</strong>
                      </span>

                      {!isFullyPaid && (
                        <span
                          className={`text-[11px] font-semibold ${
                            isOverdue
                              ? "text-rose-400"
                              : record.daysDifference === 0
                              ? "text-amber-400"
                              : record.isDueSoon
                              ? "text-amber-400"
                              : "text-gray-400"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(record.daysDifference || 1)}d overdue`
                            : record.daysDifference === 0
                            ? "Due Today"
                            : `${record.daysDifference}d left`}
                        </span>
                      )}
                    </div>

                    {record.note && (
                      <div className="flex items-start gap-1.5 text-gray-400 italic">
                        <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">"{record.note}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3.5 border-t border-gray-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openHistoryModal(record)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-xs flex items-center gap-1"
                      title="Payment History"
                    >
                      <History className="w-4 h-4 text-rose-400" />
                      <span className="text-[11px] font-medium">{record.payments?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => openObligationModal(record)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                      title="Edit Obligation"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(record)}
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-all"
                      title="Delete Obligation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Action Button */}
                  {!isFullyPaid ? (
                    <button
                      onClick={() => openPaymentModal(record)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Payment</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Settled
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT OBLIGATION */}
      <AnimatePresence>
        {isObligationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-400" />
                  {isEditing ? "Edit Payment Obligation" : "Add Payment Obligation"}
                </h3>
                <button
                  onClick={() => setIsObligationModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveObligation} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Payee / Organisation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hostel Warden, College Accounts, Landlord, Amit"
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Total Amount Due (₹) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 4500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      {categories.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Payment Due Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Date Added</label>
                    <input
                      type="date"
                      value={formData.dateAdded}
                      onChange={(e) => setFormData({ ...formData, dateAdded: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Description / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. October hostel rent, Semester exam registration fee, etc."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsObligationModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : isEditing ? "Update Obligation" : "Save Obligation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD PAYMENT */}
      <AnimatePresence>
        {isPayModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  Record Payment
                </h3>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Obligation context */}
              <div className="mt-4 p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400">Payee:</span>
                  <p className="text-sm font-semibold text-white">{selectedRecord.payeeName}</p>
                  <span className="text-[11px] text-gray-500">Due: {selectedRecord.dueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400">Remaining to Pay:</span>
                  <p className="text-sm font-bold text-rose-400">₹{selectedRecord.remainingAmount}</p>
                </div>
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSavePayment} className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-300">
                      Payment Amount (₹) <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, amount: selectedRecord.remainingAmount.toString() })}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Pay Full (₹{selectedRecord.remainingAmount})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount paid"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Payment Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentData.date}
                      onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Paid Using</label>
                    <select
                      value={paymentData.paidUsing}
                      onChange={(e) => setPaymentData({ ...paymentData, paidUsing: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="online">Online / UPI / NetBanking</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Payment Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via UPI ref #1234, cash receipt handed"
                    value={paymentData.note}
                    onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? "Recording..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PAYMENT HISTORY */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-rose-400" />
                    Payment History
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Obligation to <strong className="text-white">{selectedRecord.payeeName}</strong> (Total: ₹{selectedRecord.amount})
                  </p>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* History Items */}
              <div className="mt-4 overflow-y-auto flex-1 space-y-3 pr-1">
                {(!selectedRecord.payments || selectedRecord.payments.length === 0) ? (
                  <div className="py-12 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payments recorded yet.</p>
                  </div>
                ) : (
                  selectedRecord.payments.map((pay, idx) => (
                    <div
                      key={pay._id || idx}
                      className="p-3.5 bg-gray-950 border border-gray-800/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-emerald-400">
                            -₹{pay.amount.toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{pay.date}</span>
                            <span>•</span>
                            <span className="capitalize">{pay.paidUsing || "online"}</span>
                          </div>
                        </div>
                      </div>

                      {pay.note && (
                        <div className="text-xs text-gray-400 italic text-right max-w-[180px] truncate" title={pay.note}>
                          "{pay.note}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer Summary */}
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs shrink-0">
                <span className="text-gray-400">
                  Total Paid: <strong className="text-emerald-400 font-semibold">₹{selectedRecord.amountPaid}</strong>
                </span>
                <span className="text-gray-400">
                  Remaining: <strong className="text-rose-400 font-semibold">₹{selectedRecord.remainingAmount}</strong>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: DELETE CONFIRMATION */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white text-center">Delete Payment Obligation?</h3>
              <p className="text-xs text-gray-400 text-center mt-1">
                Are you sure you want to delete the obligation for <strong>{selectedRecord.payeeName}</strong> (₹{selectedRecord.amount})? This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default MoneyToPayPage;
