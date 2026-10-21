import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { MoneyLentRecord, MoneyLentSummary } from "../types";
import {
  HandCoins,
  ArrowUpRight,
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
  CreditCard,
  Banknote,
  RotateCcw,
  User,
  FileText,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function MoneyLentPage() {
  const [records, setRecords] = useState<MoneyLentRecord[]>([]);
  const [summary, setSummary] = useState<MoneyLentSummary>({
    totalLent: 0,
    totalReceived: 0,
    totalOwed: 0,
    pendingCount: 0,
    receivedCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Modals state
  const [isLendModalOpen, setIsLendModalOpen] = useState<boolean>(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Selected record for action
  const [selectedRecord, setSelectedRecord] = useState<MoneyLentRecord | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    note: "",
    paidUsing: "online",
    lentFrom: "online_money" as "online_savings" | "cash_savings" | "online_money" | "cash",
  });

  const [repayData, setRepayData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    paidUsing: "online",
    depositTo: "online_money" as "online_savings" | "cash_savings" | "online_money" | "cash",
  });

  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/money-lent");
      setRecords(res.data.records || []);
      setSummary(res.data.summary || {
        totalLent: 0,
        totalReceived: 0,
        totalOwed: 0,
        pendingCount: 0,
        receivedCount: 0,
        totalCount: 0,
      });
    } catch (err) {
      console.error("Error fetching money lent records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Open Lend Modal (Add / Edit)
  const openLendModal = (record?: MoneyLentRecord) => {
    setFormError("");
    if (record) {
      setSelectedRecord(record);
      setIsEditing(true);
      setFormData({
        personName: record.personName,
        amount: record.amount.toString(),
        date: record.date,
        expectedReturnDate: record.expectedReturnDate || "",
        note: record.note || "",
        paidUsing: record.paidUsing || "online",
        lentFrom: (record.lentFrom as any) || (record.note?.toLowerCase().includes("savings") ? "online_savings" : "online_money"),
      });
    } else {
      setSelectedRecord(null);
      setIsEditing(false);
      setFormData({
        personName: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        expectedReturnDate: "",
        note: "",
        paidUsing: "online",
        lentFrom: "online_money",
      });
    }
    setIsLendModalOpen(true);
  };

  // Open Repay Modal
  const openRepayModal = (record: MoneyLentRecord) => {
    setFormError("");
    setSelectedRecord(record);
    const targetSource =
      (record.lentFrom as any) ||
      (record.note?.toLowerCase().includes("online savings")
        ? "online_savings"
        : record.note?.toLowerCase().includes("cash savings")
        ? "cash_savings"
        : record.note?.toLowerCase().includes("savings")
        ? "online_savings"
        : record.paidUsing === "cash"
        ? "cash"
        : "online_money");

    setRepayData({
      amount: record.remainingAmount.toString(),
      date: new Date().toISOString().split("T")[0],
      note: "",
      paidUsing: record.paidUsing || "online",
      depositTo: targetSource,
    });
    setIsRepayModalOpen(true);
  };

  // Open History Modal
  const openHistoryModal = (record: MoneyLentRecord) => {
    setSelectedRecord(record);
    setIsHistoryModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (record: MoneyLentRecord) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  // Submit Add / Edit
  const handleSaveLend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.personName.trim()) {
      setFormError("Please enter the person's name.");
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!formData.date) {
      setFormError("Please select the date the money was lent.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEditing && selectedRecord) {
        await api.put(`/money-lent/${selectedRecord._id}`, formData);
      } else {
        await api.post("/money-lent", formData);
      }
      setIsLendModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Repayment
  const handleSaveRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setFormError("");

    const numAmount = Number(repayData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid repayment amount greater than 0.");
      return;
    }

    if (numAmount > selectedRecord.remainingAmount) {
      setFormError(`Repayment cannot exceed the remaining balance of ₹${selectedRecord.remainingAmount}.`);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post(`/money-lent/${selectedRecord._id}/repayments`, repayData);
      setIsRepayModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to record repayment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Record
  const handleDelete = async () => {
    if (!selectedRecord || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/money-lent/${selectedRecord._id}`);
      setIsDeleteModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      console.error("Error deleting record:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering & Sorting
  const filteredRecords = records
    .filter((r) => {
      if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.personName.toLowerCase().includes(q);
        const matchNote = (r.note || "").toLowerCase().includes(q);
        return matchName || matchNote;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return (b.date || "").localeCompare(a.date || "");
      if (sortBy === "date-asc") return (a.date || "").localeCompare(b.date || "");
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      if (sortBy === "remaining-desc") return b.remainingAmount - a.remainingAmount;
      return 0;
    });

  return (
    <div className="space-y-6 pb-12" id="money-lent-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-purple-400 tracking-wider">Lending & Dues</span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Money Lent</h1>
              <p className="text-xs text-gray-400">Track loans given to friends & family and record repayments</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => openLendModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 shrink-0"
          id="btn-lend-money"
        >
          <Plus className="w-4 h-4" />
          <span>Lend Money</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lent */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-purple-500/30 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Lent</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">₹{summary.totalLent.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.totalCount} total loan records</p>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">₹{summary.totalReceived.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.receivedCount} loans fully repaid</p>
          </div>
        </div>

        {/* Amount Still Owed */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-amber-500/30 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Still Owed to Me</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-400 tracking-tight">₹{summary.totalOwed.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.pendingCount} pending repayment</p>
          </div>
        </div>

        {/* Recovery Progress */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-5 hover:border-sky-500/30 transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recovery Rate</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {summary.totalLent > 0
                  ? `${Math.round((summary.totalReceived / summary.totalLent) * 100)}%`
                  : "0%"}
              </h3>
            </div>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${summary.totalLent > 0 ? Math.min(100, Math.round((summary.totalReceived / summary.totalLent) * 100)) : 0}%`,
              }}
            />
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
            placeholder="Search by person name or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
            id="input-search-money-lent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-gray-950/60 border border-gray-800/80 rounded-xl p-1 text-xs shrink-0">
            {["all", "pending", "partially received", "received"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === status
                    ? "bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-950/60 border border-gray-800/80 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 shrink-0"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
            <option value="remaining-desc">Remaining: High to Low</option>
          </select>
        </div>
      </div>

      {/* Records List / Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Loading money lent records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-gray-900/30 border border-gray-800/60 rounded-2xl py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
            <HandCoins className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Money Lent Records Found</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
            {searchQuery || statusFilter !== "all"
              ? "No records match your filter criteria. Try clearing filters."
              : "Keep track of cash or UPI you lend to friends or colleagues. Record repayments any time!"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <button
              onClick={() => openLendModal()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Loan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => {
            const isFullyReceived = record.status === "Received";
            const percentReturned =
              record.amount > 0 ? Math.min(100, Math.round((record.amountReceived / record.amount) * 100)) : 0;

            return (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gray-900/60 backdrop-blur-xl border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg ${
                  isFullyReceived
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-gray-800/80 hover:border-gray-700"
                }`}
              >
                <div>
                  {/* Top line: Person & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-semibold text-sm shrink-0">
                        {record.personName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-white truncate" title={record.personName}>
                          {record.personName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {record.date}
                          </span>
                          <span>•</span>
                          <span className="capitalize flex items-center gap-1 text-gray-400">
                            {record.paidUsing === "cash" ? (
                              <Banknote className="w-3 h-3 text-amber-400" />
                            ) : (
                              <CreditCard className="w-3 h-3 text-sky-400" />
                            )}
                            {record.paidUsing || "online"}
                          </span>
                          <span>•</span>
                          {record.lentFrom === "online_savings" || (!record.lentFrom && record.note?.toLowerCase().includes("online savings")) ? (
                            <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                              🏦 Online Savings
                            </span>
                          ) : record.lentFrom === "cash_savings" || (!record.lentFrom && record.note?.toLowerCase().includes("cash savings")) ? (
                            <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                              💵 Cash Savings
                            </span>
                          ) : record.lentFrom === "cash" ? (
                            <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                              👛 Cash in Hand
                            </span>
                          ) : (
                            <span className="text-[10px] text-sky-300 font-semibold flex items-center gap-1">
                              💳 Online Money
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border shrink-0 ${
                        isFullyReceived
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : record.status === "Partially Received"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>

                  {/* Amounts breakdown */}
                  <div className="mt-5 p-3.5 bg-gray-950/60 border border-gray-800/60 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Lent:</span>
                      <span className="font-semibold text-white">₹{record.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Received So Far:</span>
                      <span className="font-semibold text-emerald-400">₹{record.amountReceived.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-gray-800/80 pt-2 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-300">Remaining Balance:</span>
                      <span className="text-sm font-bold text-amber-400">
                        ₹{record.remainingAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentReturned}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 text-right mt-1">{percentReturned}% returned</div>
                    </div>
                  </div>

                  {/* Note & Expected Date */}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-400">
                    {record.expectedReturnDate && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>Expected by: <strong className="text-gray-300 font-medium">{record.expectedReturnDate}</strong></span>
                      </div>
                    )}
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
                      title="Repayment History"
                    >
                      <History className="w-4 h-4 text-purple-400" />
                      <span className="text-[11px] font-medium">{record.repayments?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => openLendModal(record)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                      title="Edit Record"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(record)}
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Action Button */}
                  {!isFullyReceived ? (
                    <button
                      onClick={() => openRepayModal(record)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Record Repayment</span>
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

      {/* MODAL 1: LEND MONEY (Add / Edit) */}
      <AnimatePresence>
        {isLendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-purple-400" />
                  {isEditing ? "Edit Money Lent" : "Record Money Lent"}
                </h3>
                <button
                  onClick={() => setIsLendModalOpen(false)}
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

              <form onSubmit={handleSaveLend} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Person's Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh, Ananya, Roommate"
                      value={formData.personName}
                      onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Amount (₹) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Lent Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Expected Return Date</label>
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Paid Using</label>
                    <select
                      value={formData.paidUsing}
                      onChange={(e) => setFormData({ ...formData, paidUsing: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="online">Online / UPI</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Given From (Loan Source) <span className="text-purple-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, lentFrom: "online_savings", paidUsing: "online" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        formData.lentFrom === "online_savings"
                          ? "bg-purple-600/25 border-purple-500 text-white shadow-sm ring-1 ring-purple-500"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      <span className="text-base">🏦</span>
                      <div className="text-left">
                        <div className="font-bold text-xs text-purple-200">Online Savings</div>
                        <div className="text-[10px] text-gray-400 leading-tight">Auto-restores to savings</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, lentFrom: "cash_savings", paidUsing: "cash" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        formData.lentFrom === "cash_savings"
                          ? "bg-emerald-600/25 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      <span className="text-base">💵</span>
                      <div className="text-left">
                        <div className="font-bold text-xs text-emerald-200">Cash Savings</div>
                        <div className="text-[10px] text-gray-400 leading-tight">Auto-restores to cash jar</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, lentFrom: "online_money", paidUsing: "online" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        formData.lentFrom === "online_money"
                          ? "bg-sky-600/25 border-sky-500 text-white shadow-sm ring-1 ring-sky-500"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      <span className="text-base">💳</span>
                      <div className="text-left">
                        <div className="font-bold text-xs text-sky-200">Online Money</div>
                        <div className="text-[10px] text-gray-400 leading-tight">Bank account / UPI</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, lentFrom: "cash", paidUsing: "cash" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        formData.lentFrom === "cash"
                          ? "bg-amber-600/25 border-amber-500 text-white shadow-sm ring-1 ring-amber-500"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      <span className="text-base">👛</span>
                      <div className="text-left">
                        <div className="font-bold text-xs text-amber-200">Cash in Hand</div>
                        <div className="text-[10px] text-gray-400 leading-tight">Physical wallet cash</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Description / Note</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Lent for concert tickets, lunch split, etc."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsLendModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : isEditing ? "Update Loan" : "Save Loan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: RECORD REPAYMENT */}
      <AnimatePresence>
        {isRepayModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Record Repayment
                </h3>
                <button
                  onClick={() => setIsRepayModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loan Context */}
              <div className="mt-4 p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400">Borrower:</span>
                  <p className="text-sm font-semibold text-white">{selectedRecord.personName}</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400">Remaining Balance:</span>
                  <p className="text-sm font-bold text-amber-400">₹{selectedRecord.remainingAmount}</p>
                </div>
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveRepayment} className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-300">
                      Amount Received (₹) <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setRepayData({ ...repayData, amount: selectedRecord.remainingAmount.toString() })}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Fill Full (₹{selectedRecord.remainingAmount})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount returned"
                    value={repayData.amount}
                    onChange={(e) => setRepayData({ ...repayData, amount: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Received Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={repayData.date}
                      onChange={(e) => setRepayData({ ...repayData, date: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Received Into</label>
                    <select
                      value={repayData.paidUsing}
                      onChange={(e) => setRepayData({ ...repayData, paidUsing: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="online">Online / UPI</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>

                {/* Deposit Destination with Automatic Savings Info */}
                <div className="space-y-2">
                  {(repayData.depositTo === "online_savings" ||
                    (!repayData.depositTo && selectedRecord.lentFrom === "online_savings") ||
                    selectedRecord.note?.toLowerCase().includes("online savings")) ? (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl text-xs flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">🏦</span>
                      <div>
                        <div className="font-bold text-purple-200">Automatic Savings Deposit</div>
                        <div className="text-[11px] text-purple-300/90 mt-0.5">
                          This loan was given from <strong>Online Savings</strong>. Upon repayment, this amount will <strong>automatically be deposited back into your Online Savings</strong>!
                        </div>
                      </div>
                    </div>
                  ) : (repayData.depositTo === "cash_savings" ||
                    (!repayData.depositTo && selectedRecord.lentFrom === "cash_savings") ||
                    selectedRecord.note?.toLowerCase().includes("cash savings")) ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">💵</span>
                      <div>
                        <div className="font-bold text-emerald-200">Automatic Cash Savings Deposit</div>
                        <div className="text-[11px] text-emerald-300/90 mt-0.5">
                          This loan was given from <strong>Cash Savings</strong>. Upon repayment, this amount will <strong>automatically be deposited back into your Cash Savings pot</strong>!
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Save / Deposit Repayment To
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRepayData({ ...repayData, depositTo: "online_savings", paidUsing: "online" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayData.depositTo === "online_savings"
                            ? "bg-purple-600/25 border-purple-500 text-white shadow-sm ring-1 ring-purple-500"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>🏦</span>
                        <span className="truncate">Online Savings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayData({ ...repayData, depositTo: "cash_savings", paidUsing: "cash" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayData.depositTo === "cash_savings"
                            ? "bg-emerald-600/25 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>💵</span>
                        <span className="truncate">Cash Savings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayData({ ...repayData, depositTo: "online_money", paidUsing: "online" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayData.depositTo === "online_money"
                            ? "bg-sky-600/25 border-sky-500 text-white shadow-sm ring-1 ring-sky-500"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>💳</span>
                        <span className="truncate">Online Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayData({ ...repayData, depositTo: "cash", paidUsing: "cash" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayData.depositTo === "cash"
                            ? "bg-amber-600/25 border-amber-500 text-white shadow-sm ring-1 ring-amber-500"
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>👛</span>
                        <span className="truncate">Cash in Hand</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Repayment Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via Google Pay, cash handed over"
                    value={repayData.note}
                    onChange={(e) => setRepayData({ ...repayData, note: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsRepayModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? "Recording..." : "Confirm Repayment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REPAYMENT HISTORY */}
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
                    <History className="w-5 h-5 text-purple-400" />
                    Repayment History
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Loan to <strong className="text-white">{selectedRecord.personName}</strong> (Total: ₹{selectedRecord.amount})
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
                {(!selectedRecord.repayments || selectedRecord.repayments.length === 0) ? (
                  <div className="py-12 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No repayments recorded yet.</p>
                  </div>
                ) : (
                  selectedRecord.repayments.map((rep, idx) => (
                    <div
                      key={rep._id || idx}
                      className="p-3.5 bg-gray-950 border border-gray-800/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-emerald-400">
                            +₹{rep.amount.toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{rep.date}</span>
                            <span>•</span>
                            <span className="capitalize">{rep.paidUsing || "online"}</span>
                          </div>
                        </div>
                      </div>

                      {rep.note && (
                        <div className="text-xs text-gray-400 italic text-right max-w-[180px] truncate" title={rep.note}>
                          "{rep.note}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer Summary */}
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs shrink-0">
                <span className="text-gray-400">
                  Total Repaid: <strong className="text-emerald-400 font-semibold">₹{selectedRecord.amountReceived}</strong>
                </span>
                <span className="text-gray-400">
                  Remaining: <strong className="text-amber-400 font-semibold">₹{selectedRecord.remainingAmount}</strong>
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
              <h3 className="text-base font-semibold text-white text-center">Delete Money Lent Record?</h3>
              <p className="text-xs text-gray-400 text-center mt-1">
                Are you sure you want to delete the record for <strong>{selectedRecord.personName}</strong> (₹{selectedRecord.amount})? This action cannot be undone.
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
export default MoneyLentPage;
