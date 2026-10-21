import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HandCoins,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  History,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Banknote,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Users,
  ListFilter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../lib/api";
import {
  MoneyLentRecord,
  MoneyLentSummary,
  MoneyToPayRecord,
  MoneyToPaySummary,
} from "../types";

export const LendingAndDues: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") || "lent").toLowerCase();
  const [activeTab, setActiveTab] = useState<"lent" | "pay" | "overview">(
    initialTab === "pay" ? "pay" : initialTab === "overview" ? "overview" : "lent"
  );

  // Sync tab with URL
  const setTab = (tab: "lent" | "pay" | "overview") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // View modes: 'grouped' by contact/payee (default) vs 'individual'
  const [lentViewMode, setLentViewMode] = useState<"grouped" | "individual">("grouped");
  const [expandedPersons, setExpandedPersons] = useState<Record<string, boolean>>({});

  const [payViewMode, setPayViewMode] = useState<"grouped" | "individual">("grouped");
  const [expandedPayees, setExpandedPayees] = useState<Record<string, boolean>>({});

  // State: Money Lent
  const [lentRecords, setLentRecords] = useState<MoneyLentRecord[]>([]);
  const [lentSummary, setLentSummary] = useState<MoneyLentSummary | null>(null);
  const [lentSearch, setLentSearch] = useState("");
  const [lentStatusFilter, setLentStatusFilter] = useState("all");
  const [lentLoading, setLentLoading] = useState(true);

  // State: Money to Pay
  const [payRecords, setPayRecords] = useState<MoneyToPayRecord[]>([]);
  const [paySummary, setPaySummary] = useState<MoneyToPaySummary | null>(null);
  const [paySearch, setPaySearch] = useState("");
  const [payCategoryFilter, setPayCategoryFilter] = useState("all");
  const [payStatusFilter, setPayStatusFilter] = useState("all");
  const [payLoading, setPayLoading] = useState(true);

  // Currency
  const currency = "₹";

  // Modals for Money Lent
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [editingLentRecord, setEditingLentRecord] = useState<MoneyLentRecord | null>(null);
  const [lendForm, setLendForm] = useState({
    personName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    note: "",
    paidUsing: "online" as "online" | "cash",
    lentFrom: "online_savings" as "online_savings" | "cash_savings" | "online_money" | "cash",
  });

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLentForRepay, setSelectedLentForRepay] = useState<MoneyLentRecord | null>(null);
  const [repayForm, setRepayForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    paidUsing: "online" as "online" | "cash",
    depositTo: "online_savings" as "online_savings" | "cash_savings" | "online_money" | "cash",
  });

  const [isLentHistoryOpen, setIsLentHistoryOpen] = useState(false);
  const [selectedLentForHistory, setSelectedLentForHistory] = useState<MoneyLentRecord | null>(null);

  // Modals for Money to Pay
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingPayRecord, setEditingPayRecord] = useState<MoneyToPayRecord | null>(null);
  const [payForm, setPayForm] = useState({
    payeeName: "",
    amount: "",
    dateAdded: new Date().toISOString().split("T")[0],
    dueDate: "",
    category: "Other",
    note: "",
    paidUsing: "online" as "online" | "cash",
  });

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedPayForPayment, setSelectedPayForPayment] = useState<MoneyToPayRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
    paidUsing: "online" as "online" | "cash",
  });

  const [isPayHistoryOpen, setIsPayHistoryOpen] = useState(false);
  const [selectedPayForHistory, setSelectedPayForHistory] = useState<MoneyToPayRecord | null>(null);

  // Generic Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: "lent" | "pay"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Categories for Money to Pay
  const obligationCategories = ["Hostel", "Fees", "Bills", "Borrowed Money", "Shopping", "Other"];

  // Open Repayment Modal with loan source detection
  const openRepayModal = (record: MoneyLentRecord) => {
    setSelectedLentForRepay(record);
    const targetSource =
      (record.lentFrom as any) ||
      (record.note?.toLowerCase().includes("cash savings")
        ? "cash_savings"
        : "online_savings");

    setRepayForm({
      amount: record.remainingAmount.toString(),
      date: new Date().toISOString().split("T")[0],
      note: "",
      paidUsing: (record.paidUsing || "online") as "online" | "cash",
      depositTo: targetSource,
    });
    setErrorMsg("");
    setIsRepayModalOpen(true);
  };

  // Toggle person expansion
  const togglePersonExpand = (personName: string) => {
    setExpandedPersons((prev) => ({
      ...prev,
      [personName]: !prev[personName],
    }));
  };

  // Toggle payee expansion
  const togglePayeeExpand = (payeeName: string) => {
    setExpandedPayees((prev) => ({
      ...prev,
      [payeeName]: !prev[payeeName],
    }));
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLentLoading(true);
      setPayLoading(true);

      const [lentRes, payRes] = await Promise.all([
        api.get("/money-lent"),
        api.get("/money-to-pay"),
      ]);

      setLentRecords(lentRes.data.records || []);
      setLentSummary(lentRes.data.summary || null);

      setPayRecords(payRes.data.records || []);
      setPaySummary(payRes.data.summary || null);
    } catch (err) {
      console.error("Error fetching lending & dues data:", err);
    } finally {
      setLentLoading(false);
      setPayLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Net Position calculations
  const totalOwedToMe = lentSummary?.totalOwed || 0;
  const totalIOwe = paySummary?.totalRemaining || 0;
  const netPosition = Math.round((totalOwedToMe - totalIOwe) * 100) / 100;
  const totalOverdueAmount = paySummary?.totalOverdue || 0;
  const dueSoonCount = paySummary?.dueSoonCount || 0;
  const overdueCount = paySummary?.overdueCount || 0;
  const totalVolume = totalOwedToMe + totalIOwe;
  const lentPercent = totalVolume > 0 ? Math.round((totalOwedToMe / totalVolume) * 100) : 50;
  const owePercent = totalVolume > 0 ? 100 - lentPercent : 50;

  // Filtered Money Lent Records
  const filteredLentRecords = useMemo(() => {
    return lentRecords.filter((r) => {
      const matchesSearch =
        r.personName.toLowerCase().includes(lentSearch.toLowerCase()) ||
        (r.note || "").toLowerCase().includes(lentSearch.toLowerCase());
      const matchesStatus =
        lentStatusFilter === "all" ||
        r.status.toLowerCase().replace(/\s+/g, "") === lentStatusFilter.toLowerCase().replace(/\s+/g, "");
      return matchesSearch && matchesStatus;
    });
  }, [lentRecords, lentSearch, lentStatusFilter]);

  // Grouped Money Lent by Person
  const groupedLentPersons = useMemo(() => {
    const map = new Map<
      string,
      {
        personName: string;
        totalLent: number;
        totalReceived: number;
        remainingOwed: number;
        records: MoneyLentRecord[];
        status: "Pending" | "Partially Received" | "Received";
        latestDate: string;
        earliestDueDate: string;
        activeCount: number;
      }
    >();

    filteredLentRecords.forEach((r) => {
      const key = r.personName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          personName: r.personName.trim(),
          totalLent: 0,
          totalReceived: 0,
          remainingOwed: 0,
          records: [],
          status: "Pending",
          latestDate: r.date || "",
          earliestDueDate: r.expectedReturnDate || "",
          activeCount: 0,
        });
      }
      const group = map.get(key)!;
      group.records.push(r);
      group.totalLent += Number(r.amount) || 0;
      group.totalReceived += Number(r.amountReceived) || 0;
      group.remainingOwed += Number(r.remainingAmount) || 0;
      if (r.status !== "Received") {
        group.activeCount += 1;
      }
      if (r.date && r.date > group.latestDate) {
        group.latestDate = r.date;
      }
      if (r.expectedReturnDate) {
        if (!group.earliestDueDate || r.expectedReturnDate < group.earliestDueDate) {
          group.earliestDueDate = r.expectedReturnDate;
        }
      }
    });

    const result = Array.from(map.values()).map((g) => {
      g.totalLent = Math.round(g.totalLent * 100) / 100;
      g.totalReceived = Math.round(g.totalReceived * 100) / 100;
      g.remainingOwed = Math.round(g.remainingOwed * 100) / 100;
      if (g.remainingOwed === 0) {
        g.status = "Received";
      } else if (g.totalReceived > 0) {
        g.status = "Partially Received";
      } else {
        g.status = "Pending";
      }
      // Sort records newest first
      g.records.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      return g;
    });

    return result.sort((a, b) => b.remainingOwed - a.remainingOwed || a.personName.localeCompare(b.personName));
  }, [filteredLentRecords]);

  // Filtered Money to Pay Records
  const filteredPayRecords = useMemo(() => {
    return payRecords.filter((r) => {
      const matchesSearch =
        r.payeeName.toLowerCase().includes(paySearch.toLowerCase()) ||
        (r.note || "").toLowerCase().includes(paySearch.toLowerCase());
      const matchesCategory = payCategoryFilter === "all" || r.category === payCategoryFilter;
      const matchesStatus =
        payStatusFilter === "all" ||
        (payStatusFilter === "duesoon" && (r.isDueSoon || (r.daysDifference !== undefined && r.daysDifference <= 3 && r.daysDifference >= 0 && r.status !== "Paid"))) ||
        r.status.toLowerCase().replace(/\s+/g, "") === payStatusFilter.toLowerCase().replace(/\s+/g, "");
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [payRecords, paySearch, payCategoryFilter, payStatusFilter]);

  // Grouped Money to Pay by Payee
  const groupedPayees = useMemo(() => {
    const map = new Map<
      string,
      {
        payeeName: string;
        totalDue: number;
        totalPaid: number;
        totalRemaining: number;
        records: MoneyToPayRecord[];
        status: "Pending" | "Partially Paid" | "Paid" | "Overdue" | "Due Soon";
        hasOverdue: boolean;
        hasDueSoon: boolean;
        earliestDueDate: string;
        categories: string[];
        activeCount: number;
      }
    >();

    filteredPayRecords.forEach((r) => {
      const key = r.payeeName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          payeeName: r.payeeName.trim(),
          totalDue: 0,
          totalPaid: 0,
          totalRemaining: 0,
          records: [],
          status: "Pending",
          hasOverdue: false,
          hasDueSoon: false,
          earliestDueDate: r.dueDate || "",
          categories: [],
          activeCount: 0,
        });
      }
      const group = map.get(key)!;
      group.records.push(r);
      group.totalDue += Number(r.amount) || 0;
      group.totalPaid += Number(r.amountPaid) || 0;
      group.totalRemaining += Number(r.remainingAmount) || 0;
      if (r.status !== "Paid") {
        group.activeCount += 1;
      }
      if (r.status === "Overdue") group.hasOverdue = true;
      if (r.isDueSoon) group.hasDueSoon = true;
      if (r.dueDate && (!group.earliestDueDate || r.dueDate < group.earliestDueDate)) {
        group.earliestDueDate = r.dueDate;
      }
      if (r.category && !group.categories.includes(r.category)) {
        group.categories.push(r.category);
      }
    });

    const result = Array.from(map.values()).map((g) => {
      g.totalDue = Math.round(g.totalDue * 100) / 100;
      g.totalPaid = Math.round(g.totalPaid * 100) / 100;
      g.totalRemaining = Math.round(g.totalRemaining * 100) / 100;
      if (g.totalRemaining === 0) {
        g.status = "Paid";
      } else if (g.hasOverdue) {
        g.status = "Overdue";
      } else if (g.hasDueSoon) {
        g.status = "Due Soon";
      } else if (g.totalPaid > 0) {
        g.status = "Partially Paid";
      } else {
        g.status = "Pending";
      }
      g.records.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
      return g;
    });

    return result.sort((a, b) => {
      if (a.hasOverdue && !b.hasOverdue) return -1;
      if (!a.hasOverdue && b.hasOverdue) return 1;
      return b.totalRemaining - a.totalRemaining;
    });
  }, [filteredPayRecords]);

  // Combined Urgency Feed items
  const combinedActiveItems = useMemo(() => {
    const activeLent = lentRecords
      .filter((r) => r.status !== "Received")
      .map((r) => ({
        type: "lent" as const,
        id: r._id,
        name: r.personName,
        totalAmount: r.amount,
        remaining: r.remainingAmount,
        status: r.status,
        date: r.date,
        dueDate: r.expectedReturnDate,
        note: r.note,
        raw: r,
      }));

    const activePay = payRecords
      .filter((r) => r.status !== "Paid")
      .map((r) => ({
        type: "pay" as const,
        id: r._id,
        name: r.payeeName,
        totalAmount: r.amount,
        remaining: r.remainingAmount,
        status: r.status,
        date: r.dateAdded,
        dueDate: r.dueDate,
        note: r.note,
        category: r.category,
        isDueSoon: r.isDueSoon,
        daysDifference: r.daysDifference,
        raw: r,
      }));

    return [...activePay, ...activeLent].sort((a, b) => {
      if (a.status === "Overdue" && b.status !== "Overdue") return -1;
      if (b.status === "Overdue" && a.status !== "Overdue") return 1;
      const dateA = a.dueDate || "9999-99-99";
      const dateB = b.dueDate || "9999-99-99";
      return dateA.localeCompare(dateB);
    });
  }, [lentRecords, payRecords]);

  // Handlers: Save Money Lent
  const handleSaveLend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const amountNum = parseFloat(lendForm.amount);
    if (!lendForm.personName.trim()) {
      setErrorMsg("Please enter the borrower's name.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }
    if (!lendForm.date) {
      setErrorMsg("Please select the date the money was lent.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingLentRecord) {
        await api.put(`/money-lent/${editingLentRecord._id}`, {
          personName: lendForm.personName.trim(),
          amount: amountNum,
          date: lendForm.date,
          expectedReturnDate: lendForm.expectedReturnDate,
          note: lendForm.note,
          paidUsing: lendForm.paidUsing,
          lentFrom: lendForm.lentFrom,
        });
      } else {
        await api.post("/money-lent", {
          personName: lendForm.personName.trim(),
          amount: amountNum,
          date: lendForm.date,
          expectedReturnDate: lendForm.expectedReturnDate,
          note: lendForm.note,
          paidUsing: lendForm.paidUsing,
          lentFrom: lendForm.lentFrom,
        });
      }
      setIsLendModalOpen(false);
      setEditingLentRecord(null);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to save lending record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers: Save Repayment
  const handleSaveRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLentForRepay) return;
    setErrorMsg("");
    const amountNum = parseFloat(repayForm.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid repayment amount greater than 0.");
      return;
    }
    if (amountNum > selectedLentForRepay.remainingAmount) {
      setErrorMsg(
        `Repayment amount of ${currency}${amountNum} cannot exceed remaining balance of ${currency}${selectedLentForRepay.remainingAmount}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/money-lent/${selectedLentForRepay._id}/repayments`, {
        amount: amountNum,
        date: repayForm.date,
        note: repayForm.note,
        paidUsing: repayForm.paidUsing,
        depositTo: repayForm.depositTo,
      });
      setIsRepayModalOpen(false);
      setSelectedLentForRepay(null);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to record repayment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers: Save Obligation
  const handleSavePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const amountNum = parseFloat(payForm.amount);
    if (!payForm.payeeName.trim()) {
      setErrorMsg("Please enter payee or organisation name.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid amount due greater than 0.");
      return;
    }
    if (!payForm.dueDate) {
      setErrorMsg("Due date / last payment date is mandatory.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingPayRecord) {
        await api.put(`/money-to-pay/${editingPayRecord._id}`, {
          payeeName: payForm.payeeName.trim(),
          amount: amountNum,
          dateAdded: payForm.dateAdded,
          dueDate: payForm.dueDate,
          category: payForm.category,
          note: payForm.note,
          paidUsing: payForm.paidUsing,
        });
      } else {
        await api.post("/money-to-pay", {
          payeeName: payForm.payeeName.trim(),
          amount: amountNum,
          dateAdded: payForm.dateAdded,
          dueDate: payForm.dueDate,
          category: payForm.category,
          note: payForm.note,
          paidUsing: payForm.paidUsing,
        });
      }
      setIsPayModalOpen(false);
      setEditingPayRecord(null);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to save obligation.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers: Save Payment against Obligation
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayForPayment) return;
    setErrorMsg("");
    const amountNum = parseFloat(paymentForm.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than 0.");
      return;
    }
    if (amountNum > selectedPayForPayment.remainingAmount) {
      setErrorMsg(
        `Payment of ${currency}${amountNum} cannot exceed remaining balance of ${currency}${selectedPayForPayment.remainingAmount}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/money-to-pay/${selectedPayForPayment._id}/payments`, {
        amount: amountNum,
        date: paymentForm.date,
        note: paymentForm.note,
        paidUsing: paymentForm.paidUsing,
      });
      setIsAddPaymentModalOpen(false);
      setSelectedPayForPayment(null);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === "lent") {
        await api.delete(`/money-lent/${deleteTarget.id}`);
      } else {
        await api.delete(`/money-to-pay/${deleteTarget.id}`);
      }
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10" id="lending-and-dues-hub">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/20 to-rose-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Lending & Dues</h1>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingLentRecord(null);
              setLendForm({
                personName: "",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                expectedReturnDate: "",
                note: "",
                paidUsing: "online",
                lentFrom: "online_savings",
              });
              setErrorMsg("");
              setIsLendModalOpen(true);
            }}
            title="Record money you lent to a friend or contact"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            id="btn-lend-money-header"
          >
            <HandCoins className="w-3.5 h-3.5 text-purple-400" />
            <span>+ Lend Money</span>
          </button>

          <button
            onClick={() => {
              setEditingPayRecord(null);
              setPayForm({
                payeeName: "",
                amount: "",
                dateAdded: new Date().toISOString().split("T")[0],
                dueDate: "",
                category: "Bills",
                note: "",
                paidUsing: "online",
              });
              setErrorMsg("");
              setIsPayModalOpen(true);
            }}
            title="Record a bill, hostel fee, or money you need to pay"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            id="btn-add-obligation-header"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Add Due</span>
          </button>
        </div>
      </div>

      {/* 3 Balanced Overview Cards (Laptop-optimized, No awkward voids) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5" id="top-overview-cards">
        {/* Card 1: Total Lending & Dues */}
        <div
          className="bg-gray-900/70 border border-gray-800/80 hover:border-gray-700/80 rounded-2xl p-4 backdrop-blur-xl shadow-lg flex flex-col justify-between transition-all"
          title={`Total tracked peer funds: ${currency}${totalOwedToMe.toLocaleString("en-IN")} Lent + ${currency}${totalIOwe.toLocaleString("en-IN")} Dues = ${currency}${totalVolume.toLocaleString("en-IN")}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Total Lending & Dues
            </span>
            <div className="p-2 rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currency}{totalVolume.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60 text-xs">
              <span className="text-[11px] text-gray-400">
                All peer funds tracked
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Money Lent (Receivables) */}
        <div
          className="bg-gray-900/70 border border-gray-800/80 hover:border-purple-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-lg flex flex-col justify-between transition-all group cursor-pointer"
          onClick={() => setTab("lent")}
          title="Click to view all loans given to friends"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 font-mono">
              Owed to You
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currency}{totalOwedToMe.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60 text-xs">
              <span className="text-[11px] text-gray-400">
                {groupedLentPersons.length} {groupedLentPersons.length === 1 ? "contact" : "contacts"} ({lentRecords.length} {lentRecords.length === 1 ? "loan" : "loans"})
              </span>
              <span className="text-[11px] text-purple-400 font-bold group-hover:translate-x-0.5 transition-transform">
                View Lent →
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Money to Pay (Payables & Urgency) */}
        <div
          className={`bg-gray-900/70 border rounded-2xl p-4 backdrop-blur-xl shadow-lg flex flex-col justify-between transition-all group cursor-pointer ${
            overdueCount > 0
              ? "border-rose-500/50 hover:border-rose-500/80"
              : dueSoonCount > 0
              ? "border-amber-500/50 hover:border-amber-500/80"
              : "border-gray-800/80 hover:border-rose-500/40"
          }`}
          onClick={() => setTab("pay")}
          title="Click to view all pending bills and dues"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 font-mono">
              You Owe
            </span>
            <div
              className={`p-2 rounded-xl border ${
                overdueCount > 0
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-400"
              }`}
            >
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currency}{totalIOwe.toLocaleString("en-IN")}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  overdueCount > 0
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                    : dueSoonCount > 0
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {overdueCount > 0 ? `${overdueCount} Overdue` : dueSoonCount > 0 ? `${dueSoonCount} Due Soon` : "All Clear"}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60 text-xs">
              <span className="text-[11px] text-gray-400">
                {payRecords.length} {payRecords.length === 1 ? "due" : "dues"} pending
              </span>
              <span className="text-[11px] text-rose-400 font-bold group-hover:translate-x-0.5 transition-transform">
                View Dues →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-2.5" id="tab-controls">
        <div className="flex items-center gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl w-fit">
          <button
            onClick={() => setTab("lent")}
            title="Money you have lent to others"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "lent"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-400 hover:text-white"
            }`}
            id="tab-btn-lent"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Lent</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "lent" ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              {lentRecords.length}
            </span>
          </button>

          <button
            onClick={() => setTab("pay")}
            title="Bills, fees & money you need to pay to others"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "pay"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-gray-400 hover:text-white"
            }`}
            id="tab-btn-pay"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>To Pay</span>
            {overdueCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            )}
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "pay" ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              {payRecords.length}
            </span>
          </button>

          <button
            onClick={() => setTab("overview")}
            title="All active loans and obligations sorted by urgency and deadlines"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
            id="tab-btn-overview"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Priority</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "overview" ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              {combinedActiveItems.length}
            </span>
          </button>
        </div>

        {/* View Mode Toggle (Grouped vs Individual) */}
        {activeTab === "lent" && (
          <div className="flex items-center gap-1 bg-gray-900/60 border border-gray-800 p-0.5 rounded-xl self-start sm:self-auto text-xs">
            <button
              onClick={() => setLentViewMode("grouped")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                lentViewMode === "grouped"
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Group multiple loans by person"
            >
              <Users className="w-3 h-3" />
              <span>By Person ({groupedLentPersons.length})</span>
            </button>
            <button
              onClick={() => setLentViewMode("individual")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                lentViewMode === "individual"
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Show individual loan cards"
            >
              <ListFilter className="w-3 h-3" />
              <span>All Loans ({filteredLentRecords.length})</span>
            </button>
          </div>
        )}

        {activeTab === "pay" && (
          <div className="flex items-center gap-1 bg-gray-900/60 border border-gray-800 p-0.5 rounded-xl self-start sm:self-auto text-xs">
            <button
              onClick={() => setPayViewMode("grouped")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                payViewMode === "grouped"
                  ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Group obligations by payee"
            >
              <Users className="w-3 h-3" />
              <span>By Payee ({groupedPayees.length})</span>
            </button>
            <button
              onClick={() => setPayViewMode("individual")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                payViewMode === "individual"
                  ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Show individual obligation cards"
            >
              <ListFilter className="w-3 h-3" />
              <span>All Dues ({filteredPayRecords.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MONEY LENT (OWED TO ME)                                            */}
      {/* ========================================================================= */}
      {activeTab === "lent" && (
        <div className="space-y-3.5" id="section-money-lent">
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-gray-900/50 border border-gray-800/80 p-2.5 rounded-2xl">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search borrower or note..."
                value={lentSearch}
                onChange={(e) => setLentSearch(e.target.value)}
                className="w-full bg-gray-950/60 border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "partiallyreceived", label: "Partially Received" },
                { key: "received", label: "Received" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setLentStatusFilter(s.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    lentStatusFilter === s.key
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Money Lent Content */}
          {lentLoading ? (
            <div className="text-center py-8 text-gray-500 text-xs">Loading Money Lent records...</div>
          ) : filteredLentRecords.length === 0 ? (
            <div className="text-center py-8 bg-gray-900/30 border border-gray-800/60 rounded-2xl p-6">
              <HandCoins className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Money Lent Records</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {lentSearch || lentStatusFilter !== "all"
                  ? "No loans match your search filter."
                  : "You haven't recorded lending money to anyone yet."}
              </p>
            </div>
          ) : lentViewMode === "grouped" ? (
            /* ========================================================================= */
            /* GROUPED BY PERSON (CLEAN, COMPACT, ACCORDION LEDGER)                     */
            /* ========================================================================= */
            <div className="space-y-2.5" id="grouped-persons-list">
              {groupedLentPersons.map((group) => {
                const isExpanded = expandedPersons[group.personName] ?? false;
                const isFullyReceived = group.status === "Received";
                const loanCount = group.records.length;
                const oldestActiveLoan = group.records.find((r) => r.status !== "Received") || group.records[0];

                return (
                  <div
                    key={group.personName}
                    className="bg-gray-900/60 border border-gray-800/80 hover:border-purple-500/40 rounded-2xl transition-all overflow-hidden shadow-md"
                  >
                    {/* Compact Header Bar */}
                    <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-300 font-black text-sm shrink-0">
                          {group.personName.charAt(0).toUpperCase()}
                        </div>

                        {/* Person Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white tracking-tight capitalize">
                              {group.personName}
                            </h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                              {loanCount} {loanCount === 1 ? "loan" : "loans"}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border ${
                                isFullyReceived
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : group.status === "Partially Received"
                                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              }`}
                            >
                              {group.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                            <span
                              title={`Total amount lent to ${group.personName}: ${currency}${group.totalLent.toLocaleString("en-IN")}`}
                              className="cursor-help text-gray-300 font-medium"
                            >
                              {currency}{group.totalLent.toLocaleString("en-IN")}
                            </span>
                            {group.totalReceived > 0 && (
                              <span
                                title={`Amount returned so far: ${currency}${group.totalReceived.toLocaleString("en-IN")}`}
                                className="text-emerald-400 cursor-help"
                              >
                                • {currency}{group.totalReceived.toLocaleString("en-IN")} returned
                              </span>
                            )}
                            {group.earliestDueDate && (
                              <span
                                title={`Expected return date: ${group.earliestDueDate}`}
                                className="text-purple-300 flex items-center gap-1 cursor-help"
                              >
                                <Clock className="w-3 h-3" />
                                {group.earliestDueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Balance & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
                        <div
                          className="text-right cursor-help"
                          title="Pending amount yet to be returned"
                        >
                          <span className="text-[10px] text-gray-400 block font-medium">Outstanding</span>
                          <span
                            className={`text-base font-black ${
                              isFullyReceived ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {currency}{group.remainingOwed.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {!isFullyReceived && oldestActiveLoan && (
                          <button
                            onClick={() => openRepayModal(oldestActiveLoan)}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            title="Record repayment from this person"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Repayment</span>
                          </button>
                        )}

                        {/* Accordion Toggle */}
                        <button
                          onClick={() => togglePersonExpand(group.personName)}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-950/60 hover:bg-gray-800 border border-gray-800 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title={isExpanded ? "Collapse loan breakdown" : "Expand loan breakdown"}
                        >
                          <span className="hidden md:inline">{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Micro-Breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-800/80 bg-gray-950/40 p-3 sm:p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                            <span className="text-gray-400">Loans ({loanCount})</span>
                            <button
                              onClick={() => {
                                setEditingLentRecord(null);
                                setLendForm({
                                  personName: group.personName,
                                  amount: "",
                                  date: new Date().toISOString().split("T")[0],
                                  expectedReturnDate: "",
                                  note: "",
                                  paidUsing: "online",
                                  lentFrom: "online_savings",
                                });
                                setErrorMsg("");
                                setIsLendModalOpen(true);
                              }}
                              title={`Lend more money to ${group.personName}`}
                              className="text-purple-400 hover:text-purple-300 cursor-pointer font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Loan</span>
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {group.records.map((r, idx) => {
                              const rPaid = r.status === "Received";
                              return (
                                <div
                                  key={r._id}
                                  className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-gray-700 transition-all"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] text-gray-500 font-mono w-4">#{idx + 1}</span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">
                                          {currency}{r.amount.toLocaleString("en-IN")}
                                        </span>
                                        <span
                                          title={`Lent on ${r.date}`}
                                          className="text-[10px] text-gray-400 cursor-help"
                                        >
                                          {r.date}
                                        </span>
                                        {r.expectedReturnDate && (
                                          <span
                                            title={`Expected return date: ${r.expectedReturnDate}`}
                                            className="text-[10px] text-purple-300 flex items-center gap-1 cursor-help"
                                          >
                                            <Clock className="w-2.5 h-2.5" />
                                            {r.expectedReturnDate}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                        {r.lentFrom === "online_savings" || (!r.lentFrom && r.note?.toLowerCase().includes("online savings")) ? (
                                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                                            🏦 Online Savings
                                          </span>
                                        ) : r.lentFrom === "cash_savings" || (!r.lentFrom && r.note?.toLowerCase().includes("cash savings")) ? (
                                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                                            💵 Cash Savings
                                          </span>
                                        ) : r.lentFrom === "cash" ? (
                                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                                            👛 Cash in Hand
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
                                            💳 Online Money
                                          </span>
                                        )}
                                      </div>
                                      {r.note && (
                                        <span className="text-[10px] text-gray-400 italic block mt-0.5">
                                          "{r.note}"
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                    <div className="text-right">
                                      <span className="text-[10px] text-gray-500 block">Remaining</span>
                                      <span className={`font-black ${rPaid ? "text-emerald-400" : "text-amber-400"}`}>
                                        {currency}{r.remainingAmount.toLocaleString("en-IN")}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setSelectedLentForHistory(r);
                                          setIsLentHistoryOpen(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-purple-300 rounded hover:bg-gray-800 cursor-pointer"
                                        title="Repayment Timeline"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>

                                      {!rPaid && (
                                        <button
                                          onClick={() => openRepayModal(r)}
                                          className="px-2 py-0.5 bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-[10px] font-bold hover:bg-purple-600/50 cursor-pointer"
                                        >
                                          Repay
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          setEditingLentRecord(r);
                                          setLendForm({
                                            personName: r.personName,
                                            amount: r.amount.toString(),
                                            date: r.date,
                                            expectedReturnDate: r.expectedReturnDate || "",
                                            note: r.note || "",
                                            paidUsing: r.paidUsing || "online",
                                            lentFrom: (r.lentFrom as any) || (r.note?.toLowerCase().includes("cash savings") ? "cash_savings" : "online_savings"),
                                          });
                                          setErrorMsg("");
                                          setIsLendModalOpen(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 cursor-pointer"
                                        title="Edit this loan"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={() =>
                                          setDeleteTarget({ type: "lent", id: r._id, name: `loan of ₹${r.amount} to ${r.personName}` })
                                        }
                                        className="p-1 text-gray-500 hover:text-rose-400 rounded hover:bg-gray-800 cursor-pointer"
                                        title="Delete this loan"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================================= */
            /* INDIVIDUAL VIEW (COMPACT CARDS)                                           */
            /* ========================================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLentRecords.map((r) => {
                const isFullyReceived = r.status === "Received";
                return (
                  <div
                    key={r._id}
                    className="bg-gray-900/60 border border-gray-800/80 hover:border-purple-500/40 rounded-2xl p-3.5 flex flex-col justify-between shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {r.personName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white capitalize">{r.personName}</h4>
                            <span className="text-[10px] text-gray-500 block">Lent on {r.date}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border ${
                            isFullyReceived
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between my-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">Remaining</span>
                          <span className={`text-lg font-black ${isFullyReceived ? "text-emerald-400" : "text-amber-400"}`}>
                            {currency}{r.remainingAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">Total: {currency}{r.amount.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-emerald-400">{currency}{(r.amountReceived || 0).toLocaleString("en-IN")} returned</span>
                        </div>
                      </div>

                      {r.expectedReturnDate && (
                        <div className="text-[10px] text-purple-300 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>Due: {r.expectedReturnDate}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                        {r.lentFrom === "online_savings" || (!r.lentFrom && r.note?.toLowerCase().includes("online savings")) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                            🏦 Online Savings
                          </span>
                        ) : r.lentFrom === "cash_savings" || (!r.lentFrom && r.note?.toLowerCase().includes("cash savings")) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                            💵 Cash Savings
                          </span>
                        ) : r.lentFrom === "cash" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                            👛 Cash in Hand
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
                            💳 Online Money
                          </span>
                        )}
                      </div>
                      {r.note && <p className="text-[10px] text-gray-400 italic line-clamp-1">"{r.note}"</p>}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedLentForHistory(r);
                            setIsLentHistoryOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-purple-300 cursor-pointer"
                          title="History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLentRecord(r);
                            setLendForm({
                              personName: r.personName,
                              amount: r.amount.toString(),
                              date: r.date,
                              expectedReturnDate: r.expectedReturnDate || "",
                              note: r.note || "",
                              paidUsing: r.paidUsing || "online",
                              lentFrom: (r.lentFrom as any) || (r.note?.toLowerCase().includes("savings") ? "online_savings" : "online_money"),
                            });
                            setErrorMsg("");
                            setIsLendModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({ type: "lent", id: r._id, name: `loan to ${r.personName}` })
                          }
                          className="p-1 text-gray-500 hover:text-rose-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {!isFullyReceived && (
                        <button
                          onClick={() => openRepayModal(r)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Repay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONEY TO PAY (I OWE)                                               */}
      {/* ========================================================================= */}
      {activeTab === "pay" && (
        <div className="space-y-3.5" id="section-money-to-pay">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-gray-900/50 border border-gray-800/80 p-2.5 rounded-2xl">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search payee or note..."
                value={paySearch}
                onChange={(e) => setPaySearch(e.target.value)}
                className="w-full bg-gray-950/60 border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <select
                value={payCategoryFilter}
                onChange={(e) => setPayCategoryFilter(e.target.value)}
                className="bg-gray-950/60 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="all">All Categories</option>
                {obligationCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-gray-950/60 border border-gray-800 p-0.5 rounded-xl overflow-x-auto">
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "duesoon", label: "Due Soon" },
                  { key: "overdue", label: "Overdue" },
                  { key: "paid", label: "Paid" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setPayStatusFilter(s.key)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      payStatusFilter === s.key
                        ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Money to Pay Content */}
          {payLoading ? (
            <div className="text-center py-8 text-gray-500 text-xs">Loading obligations...</div>
          ) : filteredPayRecords.length === 0 ? (
            <div className="text-center py-8 bg-gray-900/30 border border-gray-800/60 rounded-2xl p-6">
              <Receipt className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Payment Obligations Found</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {paySearch || payStatusFilter !== "all" || payCategoryFilter !== "all"
                  ? "No obligations match your search filter."
                  : "You don't have any unpaid obligations or bills logged right now."}
              </p>
            </div>
          ) : payViewMode === "grouped" ? (
            /* ========================================================================= */
            /* GROUPED BY PAYEE (COMPACT ACCORDION)                                      */
            /* ========================================================================= */
            <div className="space-y-2.5" id="grouped-payees-list">
              {groupedPayees.map((group) => {
                const isExpanded = expandedPayees[group.payeeName] ?? false;
                const isPaid = group.status === "Paid";
                const isOverdue = group.status === "Overdue";
                const isDueSoon = group.status === "Due Soon";
                const totalCount = group.records.length;
                const oldestUnpaid = group.records.find((r) => r.status !== "Paid") || group.records[0];

                return (
                  <div
                    key={group.payeeName}
                    className={`bg-gray-900/60 border rounded-2xl transition-all overflow-hidden shadow-md ${
                      isOverdue
                        ? "border-rose-500/50 hover:border-rose-500/80"
                        : isDueSoon
                        ? "border-amber-500/50 hover:border-amber-500/80"
                        : "border-gray-800/80 hover:border-rose-500/40"
                    }`}
                  >
                    {/* Header */}
                    <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isOverdue
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-rose-500/15 border border-rose-500/25 text-rose-300"
                          }`}
                        >
                          <Receipt className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white tracking-tight capitalize">
                              {group.payeeName}
                            </h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                              {totalCount} {totalCount === 1 ? "due" : "dues"}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border ${
                                isPaid
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : isOverdue
                                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                                  : isDueSoon
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-gray-800 text-gray-300 border-gray-700"
                              }`}
                            >
                              {group.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                            <span
                              title={`Total obligations to ${group.payeeName}: ${currency}${group.totalDue.toLocaleString("en-IN")}`}
                              className="cursor-help text-gray-300 font-medium"
                            >
                              {currency}{group.totalDue.toLocaleString("en-IN")}
                            </span>
                            {group.totalPaid > 0 && (
                              <span
                                title={`Amount paid so far: ${currency}${group.totalPaid.toLocaleString("en-IN")}`}
                                className="text-emerald-400 cursor-help"
                              >
                                • {currency}{group.totalPaid.toLocaleString("en-IN")} paid
                              </span>
                            )}
                            {group.earliestDueDate && (
                              <span
                                title={`Due date: ${group.earliestDueDate}`}
                                className={`flex items-center gap-1 cursor-help ${
                                  isOverdue ? "text-rose-400 font-bold" : isDueSoon ? "text-amber-400 font-bold" : "text-gray-400"
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                {group.earliestDueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
                        <div
                          className="text-right cursor-help"
                          title="Pending amount left to pay"
                        >
                          <span className="text-[10px] text-gray-400 block font-medium">Remaining Due</span>
                          <span
                            className={`text-base font-black ${
                              isPaid ? "text-emerald-400" : isOverdue ? "text-rose-400" : "text-white"
                            }`}
                          >
                            {currency}{group.totalRemaining.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {!isPaid && oldestUnpaid && (
                          <button
                            onClick={() => {
                              setSelectedPayForPayment(oldestUnpaid);
                              setPaymentForm({
                                amount: oldestUnpaid.remainingAmount.toString(),
                                date: new Date().toISOString().split("T")[0],
                                note: "",
                                paidUsing: "online",
                              });
                              setErrorMsg("");
                              setIsAddPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            title="Make a payment toward this due"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}

                        <button
                          onClick={() => togglePayeeExpand(group.payeeName)}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-950/60 hover:bg-gray-800 border border-gray-800 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title={isExpanded ? "Collapse dues breakdown" : "Expand dues breakdown"}
                        >
                          <span className="hidden md:inline">{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-800/80 bg-gray-950/40 p-3 sm:p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                            <span className="text-gray-400">Dues ({totalCount})</span>
                            <button
                              onClick={() => {
                                setEditingPayRecord(null);
                                setPayForm({
                                  payeeName: group.payeeName,
                                  amount: "",
                                  dateAdded: new Date().toISOString().split("T")[0],
                                  dueDate: "",
                                  category: group.categories[0] || "Bills",
                                  note: "",
                                  paidUsing: "online",
                                });
                                setErrorMsg("");
                                setIsPayModalOpen(true);
                              }}
                              title={`Add another obligation for ${group.payeeName}`}
                              className="text-rose-400 hover:text-rose-300 cursor-pointer font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Due</span>
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {group.records.map((r, idx) => {
                              const rPaid = r.status === "Paid";
                              return (
                                <div
                                  key={r._id}
                                  className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-gray-700 transition-all"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] text-gray-500 font-mono w-4">#{idx + 1}</span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">
                                          {currency}{r.amount.toLocaleString("en-IN")}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          ({r.category})
                                        </span>
                                        <span
                                          title={`Due date: ${r.dueDate}`}
                                          className={`text-[10px] font-bold flex items-center gap-1 cursor-help ${r.status === "Overdue" ? "text-rose-400" : "text-amber-400"}`}
                                        >
                                          <Calendar className="w-2.5 h-2.5" />
                                          {r.dueDate}
                                        </span>
                                      </div>
                                      {r.note && (
                                        <span className="text-[10px] text-gray-400 italic block mt-0.5">
                                          "{r.note}"
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                    <div className="text-right">
                                      <span className="text-[10px] text-gray-500 block">Remaining</span>
                                      <span className={`font-black ${rPaid ? "text-emerald-400" : "text-rose-400"}`}>
                                        {currency}{r.remainingAmount.toLocaleString("en-IN")}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setSelectedPayForHistory(r);
                                          setIsPayHistoryOpen(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-rose-300 rounded hover:bg-gray-800 cursor-pointer"
                                        title="Payment History"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>

                                      {!rPaid && (
                                        <button
                                          onClick={() => {
                                            setSelectedPayForPayment(r);
                                            setPaymentForm({
                                              amount: r.remainingAmount.toString(),
                                              date: new Date().toISOString().split("T")[0],
                                              note: "",
                                              paidUsing: "online",
                                            });
                                            setErrorMsg("");
                                            setIsAddPaymentModalOpen(true);
                                          }}
                                          className="px-2 py-0.5 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold hover:bg-rose-600/50 cursor-pointer"
                                        >
                                          Pay
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          setEditingPayRecord(r);
                                          setPayForm({
                                            payeeName: r.payeeName,
                                            amount: r.amount.toString(),
                                            dateAdded: r.dateAdded,
                                            dueDate: r.dueDate,
                                            category: r.category,
                                            note: r.note || "",
                                            paidUsing: r.paidUsing || "online",
                                          });
                                          setErrorMsg("");
                                          setIsPayModalOpen(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={() =>
                                          setDeleteTarget({ type: "pay", id: r._id, name: `obligation of ₹${r.amount} to ${r.payeeName}` })
                                        }
                                        className="p-1 text-gray-500 hover:text-rose-400 rounded hover:bg-gray-800 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Individual View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPayRecords.map((r) => {
                const isPaid = r.status === "Paid";
                const isOverdue = r.status === "Overdue";
                return (
                  <div
                    key={r._id}
                    className={`bg-gray-900/60 border rounded-2xl p-3.5 flex flex-col justify-between shadow-md transition-all ${
                      isOverdue ? "border-rose-500/50" : "border-gray-800/80 hover:border-rose-500/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-white capitalize">{r.payeeName}</h4>
                          <span className="text-[10px] text-gray-500 block">{r.category}</span>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isOverdue
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                              : "bg-gray-800 text-gray-300 border-gray-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between my-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">Remaining Due</span>
                          <span className={`text-lg font-black ${isPaid ? "text-emerald-400" : "text-rose-400"}`}>
                            {currency}{r.remainingAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">Total: {currency}{r.amount.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-emerald-400">{currency}{(r.amountPaid || 0).toLocaleString("en-IN")} paid</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-semibold text-rose-400 flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {r.dueDate}</span>
                      </div>
                      {r.note && <p className="text-[10px] text-gray-400 italic line-clamp-1">"{r.note}"</p>}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPayForHistory(r);
                            setIsPayHistoryOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-rose-300 cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPayRecord(r);
                            setPayForm({
                              payeeName: r.payeeName,
                              amount: r.amount.toString(),
                              dateAdded: r.dateAdded,
                              dueDate: r.dueDate,
                              category: r.category,
                              note: r.note || "",
                              paidUsing: r.paidUsing || "online",
                            });
                            setErrorMsg("");
                            setIsPayModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({ type: "pay", id: r._id, name: `obligation to ${r.payeeName}` })
                          }
                          className="p-1 text-gray-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => {
                            setSelectedPayForPayment(r);
                            setPaymentForm({
                              amount: r.remainingAmount.toString(),
                              date: new Date().toISOString().split("T")[0],
                              note: "",
                              paidUsing: "online",
                            });
                            setErrorMsg("");
                            setIsAddPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMBINED PRIORITY FEED                                            */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-3" id="section-combined-overview">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3
                className="text-xs font-bold text-white cursor-help"
                title="All active loans and obligations sorted by urgency and deadlines"
              >
                Priority Feed
              </h3>
            </div>

            {combinedActiveItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                🎉 No active debts or receivables! All clear.
              </div>
            ) : (
              <div className="space-y-2">
                {combinedActiveItems.map((item) => {
                  const isPay = item.type === "pay";
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-950/60 border border-gray-800/80 hover:border-gray-750 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPay
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {isPay ? <Receipt className="w-3.5 h-3.5" /> : <HandCoins className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white capitalize">{item.name}</span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                                isPay ? "bg-rose-500/20 text-rose-300" : "bg-purple-500/20 text-purple-300"
                              }`}
                            >
                              {isPay ? "I Owe" : "Owed to Me"}
                            </span>
                            {item.status === "Overdue" && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-500/30 text-rose-400 border border-rose-500/40 animate-pulse">
                                Overdue
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {item.dueDate ? `Target date: ${item.dueDate}` : `Date: ${item.date}`}
                            {item.note && ` • "${item.note}"`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">Remaining</span>
                          <span
                            className={`text-sm font-black ${
                              isPay ? "text-rose-400" : "text-amber-400"
                            }`}
                          >
                            {currency}{item.remaining.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (isPay) {
                              setSelectedPayForPayment(item.raw as MoneyToPayRecord);
                              setPaymentForm({
                                amount: item.remaining.toString(),
                                date: new Date().toISOString().split("T")[0],
                                note: "",
                                paidUsing: "online",
                              });
                              setErrorMsg("");
                              setIsAddPaymentModalOpen(true);
                            } else {
                              openRepayModal(item.raw as MoneyLentRecord);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all active:scale-95 cursor-pointer ${
                            isPay
                              ? "bg-rose-600 hover:bg-rose-500"
                              : "bg-purple-600 hover:bg-purple-500"
                          }`}
                        >
                          {isPay ? "Pay" : "Received"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MONEY LENT                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isLendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsLendModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <HandCoins className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingLentRecord ? "Edit Money Lent" : "Record Money Lent"}
                  </h3>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveLend} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Person's Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sampath, Rahul, Priya"
                    value={lendForm.personName}
                    onChange={(e) => setLendForm({ ...lendForm, personName: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Amount ({currency}) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={lendForm.amount}
                      onChange={(e) => setLendForm({ ...lendForm, amount: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Date Lent</label>
                    <input
                      type="date"
                      required
                      value={lendForm.date}
                      onChange={(e) => setLendForm({ ...lendForm, date: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Expected Return Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={lendForm.expectedReturnDate}
                    onChange={(e) => setLendForm({ ...lendForm, expectedReturnDate: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Given From (Loan Source) <span className="text-purple-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLendForm({ ...lendForm, lentFrom: "online_savings", paidUsing: "online" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        lendForm.lentFrom === "online_savings"
                          ? "bg-purple-600/25 border-purple-500 text-white shadow-sm ring-1 ring-purple-500"
                          : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
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
                      onClick={() => setLendForm({ ...lendForm, lentFrom: "cash_savings", paidUsing: "cash" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        lendForm.lentFrom === "cash_savings"
                          ? "bg-emerald-600/25 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500"
                          : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
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
                      onClick={() => setLendForm({ ...lendForm, lentFrom: "online_money", paidUsing: "online" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        lendForm.lentFrom === "online_money"
                          ? "bg-sky-600/25 border-sky-500 text-white shadow-sm ring-1 ring-sky-500"
                          : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
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
                      onClick={() => setLendForm({ ...lendForm, lentFrom: "cash", paidUsing: "cash" })}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        lendForm.lentFrom === "cash"
                          ? "bg-amber-600/25 border-amber-500 text-white shadow-sm ring-1 ring-amber-500"
                          : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
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
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. For dinner, concert ticket, trip"
                    value={lendForm.note}
                    onChange={(e) => setLendForm({ ...lendForm, note: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsLendModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Saving..." : editingLentRecord ? "Update Record" : "Save Record"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: RECORD REPAYMENT                                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRepayModalOpen && selectedLentForRepay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsRepayModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <CheckCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Repayment</h3>
                  <span className="text-xs text-gray-400">From {selectedLentForRepay.personName}</span>
                </div>
              </div>

              {/* Outstanding Balance Banner */}
              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3 mb-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">Remaining Balance</span>
                  <span className="text-base font-black text-amber-400">
                    {currency}{selectedLentForRepay.remainingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Already Received</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {currency}{(selectedLentForRepay.amountReceived || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveRepayment} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Amount Received ({currency}) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={repayForm.amount}
                      onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Repayment Date</label>
                    <input
                      type="date"
                      required
                      value={repayForm.date}
                      onChange={(e) => setRepayForm({ ...repayForm, date: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Deposit Destination with Automatic Savings Info */}
                <div className="space-y-2">
                  {(repayForm.depositTo === "online_savings" ||
                    (!repayForm.depositTo && selectedLentForRepay.lentFrom === "online_savings") ||
                    selectedLentForRepay.note?.toLowerCase().includes("online savings")) ? (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl text-xs flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">🏦</span>
                      <div>
                        <div className="font-bold text-purple-200">Automatic Savings Deposit</div>
                        <div className="text-[11px] text-purple-300/90 mt-0.5">
                          This loan was given from <strong>Online Savings</strong>. Upon repayment, this amount will <strong>automatically be deposited back into your Online Savings</strong>!
                        </div>
                      </div>
                    </div>
                  ) : (repayForm.depositTo === "cash_savings" ||
                    (!repayForm.depositTo && selectedLentForRepay.lentFrom === "cash_savings") ||
                    selectedLentForRepay.note?.toLowerCase().includes("cash savings")) ? (
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
                        onClick={() => setRepayForm({ ...repayForm, depositTo: "online_savings", paidUsing: "online" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayForm.depositTo === "online_savings"
                            ? "bg-purple-600/25 border-purple-500 text-white shadow-sm ring-1 ring-purple-500"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>🏦</span>
                        <span className="truncate">Online Savings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayForm({ ...repayForm, depositTo: "cash_savings", paidUsing: "cash" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayForm.depositTo === "cash_savings"
                            ? "bg-emerald-600/25 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>💵</span>
                        <span className="truncate">Cash Savings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayForm({ ...repayForm, depositTo: "online_money", paidUsing: "online" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayForm.depositTo === "online_money"
                            ? "bg-sky-600/25 border-sky-500 text-white shadow-sm ring-1 ring-sky-500"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>💳</span>
                        <span className="truncate">Online Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayForm({ ...repayForm, depositTo: "cash", paidUsing: "cash" })}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          repayForm.depositTo === "cash"
                            ? "bg-amber-600/25 border-amber-500 text-white shadow-sm ring-1 ring-amber-500"
                            : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>👛</span>
                        <span className="truncate">Cash in Hand</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via GPay, cash, half installment"
                    value={repayForm.note}
                    onChange={(e) => setRepayForm({ ...repayForm, note: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsRepayModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Confirm Repayment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MONEY TO PAY                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Receipt className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPayRecord ? "Edit Obligation" : "Add Payment Obligation"}
                  </h3>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSavePay} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Payee / Organisation / Person <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Landlord, Hostel, Wifi, Electricity"
                    value={payForm.payeeName}
                    onChange={(e) => setPayForm({ ...payForm, payeeName: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Amount Due ({currency}) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                    <select
                      value={payForm.category}
                      onChange={(e) => setPayForm({ ...payForm, category: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {obligationCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Due Date / Deadline <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payForm.dueDate}
                    onChange={(e) => setPayForm({ ...payForm, dueDate: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. October rent, semester tuition"
                    value={payForm.note}
                    onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Saving..." : editingPayRecord ? "Update Obligation" : "Save Obligation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD PAYMENT AGAINST OBLIGATION                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddPaymentModalOpen && selectedPayForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsAddPaymentModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Payment</h3>
                  <span className="text-xs text-gray-400">To {selectedPayForPayment.payeeName}</span>
                </div>
              </div>

              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3 mb-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">Remaining Due</span>
                  <span className="text-base font-black text-rose-400">
                    {currency}{selectedPayForPayment.remainingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Already Paid</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {currency}{(selectedPayForPayment.amountPaid || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSavePayment} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Payment Amount ({currency}) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI transaction ID, installment"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REPAYMENT TIMELINE                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isLentHistoryOpen && selectedLentForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsLentHistoryOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <History className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Repayment History</h3>
                  <span className="text-xs text-gray-400">Loan to {selectedLentForHistory.personName}</span>
                </div>
              </div>

              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">Total Lent</span>
                  <span className="text-xs font-bold text-white">
                    {currency}{selectedLentForHistory.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Remaining</span>
                  <span className="text-xs font-black text-amber-400">
                    {currency}{selectedLentForHistory.remainingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {(!selectedLentForHistory.repayments || selectedLentForHistory.repayments.length === 0) ? (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    No repayments have been recorded yet.
                  </div>
                ) : (
                  selectedLentForHistory.repayments.map((rep, idx) => (
                    <div
                      key={rep._id || idx}
                      className="p-2.5 bg-gray-950/60 border border-gray-800/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-400">
                          +{currency}{rep.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {rep.date} {rep.note && `• "${rep.note}"`}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        Received
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => setIsLentHistoryOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-750 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: PAYMENT HISTORY                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPayHistoryOpen && selectedPayForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsPayHistoryOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <History className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Payment History</h3>
                  <span className="text-xs text-gray-400">To {selectedPayForHistory.payeeName}</span>
                </div>
              </div>

              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">Total Due</span>
                  <span className="text-xs font-bold text-white">
                    {currency}{selectedPayForHistory.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Remaining</span>
                  <span className="text-xs font-black text-rose-400">
                    {currency}{selectedPayForHistory.remainingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {(!selectedPayForHistory.payments || selectedPayForHistory.payments.length === 0) ? (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    No payments have been recorded yet.
                  </div>
                ) : (
                  selectedPayForHistory.payments.map((p, idx) => (
                    <div
                      key={p._id || idx}
                      className="p-2.5 bg-gray-950/60 border border-gray-800/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-rose-400">
                          −{currency}{p.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {p.date} {p.note && `• "${p.note}"`}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        Paid
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => setIsPayHistoryOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-750 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CONFIRMATION DIALOG: DELETE RECORD                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white text-center"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Record?</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Are you sure you want to delete {deleteTarget.name}? This will remove its transaction and history permanently.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LendingAndDues;
