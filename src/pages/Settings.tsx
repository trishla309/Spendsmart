import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  getSettings,
  saveSettings,
  CurrencySymbol,
  PaymentMethod,
  AppThemeId,
  THEME_OPTIONS,
  ThemeOption,
} from "../lib/settings";
import {
  User as UserIcon,
  Mail,
  Shield,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Coins,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Award,
  CheckCircle,
  CreditCard,
  Banknote,
  Sparkles,
  Palette,
  Check,
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsPageProps {
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<AppThemeId>("bordo-pine");
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<"all" | "curated" | "mood">("all");
  const [currency, setCurrency] = useState<CurrencySymbol>("₹");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod>("Online");

  // User details from localStorage
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; uri: string } | null>(null);

  // Success / Error status messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Confirmation states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const currentMonthNameYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    // Load stored settings on mount
    const current = getSettings();
    setTheme(current.theme);
    setCurrency(current.currency);
    setDefaultPaymentMethod(current.defaultPaymentMethod || "Online");

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user profile:", err);
      }
    }

    const fetchDbStatus = async () => {
      try {
        const response = await api.get("/db-status");
        setDbStatus(response.data);
      } catch (err) {
        console.error("Failed to fetch database connection status:", err);
      }
    };
    fetchDbStatus();
  }, []);

  const handleThemeChange = (newTheme: AppThemeId) => {
    setTheme(newTheme);
    saveSettings({ theme: newTheme });
    triggerGlobalSettingsUpdate();
    const meta = THEME_OPTIONS.find((t) => t.id === newTheme);
    showToast(`Applied ${meta ? meta.name : newTheme} style.`);
  };

  const handleCurrencyChange = (newCurrency: CurrencySymbol) => {
    setCurrency(newCurrency);
    saveSettings({ currency: newCurrency });
    triggerGlobalSettingsUpdate();
    showToast(`Currency symbol modified to ${newCurrency}.`);
  };

  const handlePaymentMethodChange = (newMethod: PaymentMethod) => {
    setDefaultPaymentMethod(newMethod);
    saveSettings({ defaultPaymentMethod: newMethod });
    triggerGlobalSettingsUpdate();
    showToast(`Default payment method set to ${newMethod}.`);
  };

  const triggerGlobalSettingsUpdate = () => {
    // Let layout and other pages know settings changed
    window.dispatchEvent(new Event("spendsmart_settings_change"));
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  // Reset current month budget allocation
  const handleResetBudget = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      await api.post("/budget", {
        month: currentMonthStr,
        pocketMoney: 0,
        savingsGoal: 0,
        allocated: {
          food: 0,
          transport: 0,
          shopping: 0,
          entertainment: 0,
          emergency: 0,
          savings: 0,
          other: 0,
        },
      });

      showToast("Current month budget has been reset to zero successfully.");
      setShowResetConfirm(false);
      // Trigger update
      window.dispatchEvent(new Event("spendsmart_settings_change"));
      window.dispatchEvent(new Event("spendsmart_data_updated"));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to reset current month budget.");
    } finally {
      setLoading(false);
    }
  };

  // Delete User Account Wiping Data
  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await api.delete("/auth/account");
      showToast("Account deleted successfully. Logging out...");
      setTimeout(() => {
        onLogout();
        navigate("/");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to delete account. Please try again.");
      setLoading(false);
    }
  };

  const filteredThemes = THEME_OPTIONS.filter((t) => {
    if (themeCategoryFilter === "curated") return t.category === "curated";
    if (themeCategoryFilter === "mood") return t.category === "mood";
    return true;
  });

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12" id="settings-container">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl text-emerald-400">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System & Account Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure your workspace style, regional preferences, and profile credentials.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-lg shadow-emerald-500/5"
          id="settings-success-alert"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-lg shadow-rose-500/5"
          id="settings-error-alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* 1. Profile & Database Connection Overview */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-gray-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">{user?.name || "Active Student"}</h2>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <span>{user?.email || "No email bound"}</span>
            </p>
          </div>
        </div>

        {/* Database Status Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {dbStatus && (
            <div className="px-4 py-2 bg-gray-950 border border-gray-850 rounded-xl flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Data Source</span>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    dbStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {dbStatus.connected ? (
                  <span className="text-emerald-400 font-bold">MONGODB ATLAS CONNECTED</span>
                ) : (
                  <span className="text-amber-500 font-bold">LOCAL FALLBACK</span>
                )}
              </div>
              {dbStatus.uri && (
                <span className="text-[9px] text-gray-600 block truncate max-w-[220px]" title={dbStatus.uri}>
                  {dbStatus.uri}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Aesthetic & Visual Style Studio (Curated 10 Themes) */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-7 shadow-xl flex flex-col gap-6" id="theme-studio-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-850 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Aesthetic & Theme Studio
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  10 Handcrafted Styles
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Choose from rich, velvety dark colorways and bespoke editorial palettes. Every theme transforms your entire workspace immediately.
              </p>
            </div>
          </div>

          {/* Filter Toggle Buttons */}
          <div className="flex items-center gap-1 p-1 bg-gray-950/80 border border-gray-800/80 rounded-2xl self-start sm:self-auto shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setThemeCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                themeCategoryFilter === "all"
                  ? "bg-gray-800 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              All (10)
            </button>
            <button
              type="button"
              onClick={() => setThemeCategoryFilter("curated")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                themeCategoryFilter === "curated"
                  ? "bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              <span>🎨 Curated Palettes (5)</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeCategoryFilter("mood")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                themeCategoryFilter === "mood"
                  ? "bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-purple-400" />
              <span>🌙 Deep Moods (5)</span>
            </button>
          </div>
        </div>

        {/* 10 Aesthetic Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" id="theme-cards-grid">
          {filteredThemes.map((t) => {
            const isSelected =
              theme === t.id ||
              (theme === "dark" && t.id === "obsidian-luxe") ||
              (theme === "light" && t.id === "bordo-pine");

            return (
              <div
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3.5 ${
                  isSelected
                    ? "bg-gray-850/80 border-emerald-400/80 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30 scale-[1.02]"
                    : "bg-gray-950/60 border-gray-800/80 hover:border-gray-700/80 hover:bg-gray-900 hover:-translate-y-0.5"
                }`}
                id={`theme-card-${t.id}`}
              >
                {/* Header: Emoji, Name & Curated/Mood Tag */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl">{t.emoji}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        t.category === "curated"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-300"
                      }`}
                    >
                      {t.category === "curated" ? "Curated" : "Velvet"}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-2 truncate group-hover:text-emerald-300 transition-colors">
                    {t.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2 mt-0.5">
                    {t.tagline}
                  </p>
                </div>

                {/* Swatch Preview Box */}
                <div
                  className="p-2.5 rounded-xl border flex flex-col gap-2 shadow-inner"
                  style={{ backgroundColor: t.bgPreview, borderColor: t.borderPreview }}
                >
                  <div
                    className="p-1.5 rounded-lg border flex items-center justify-between"
                    style={{ backgroundColor: t.cardPreview, borderColor: t.borderPreview }}
                  >
                    <div className="flex items-center gap-1">
                      {t.palette.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div
                      className="h-2 w-4 rounded-full"
                      style={{ backgroundColor: t.accentColor }}
                    />
                  </div>
                </div>

                {/* Active Indicator Button */}
                <div className="pt-0.5">
                  {isSelected ? (
                    <div className="w-full py-1.5 px-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-1 shadow-sm">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Active Style</span>
                    </div>
                  ) : (
                    <div className="w-full py-1.5 px-2 bg-gray-900 group-hover:bg-gray-800 text-gray-400 group-hover:text-gray-200 text-[10px] font-bold rounded-xl text-center transition-colors border border-gray-800/60">
                      Choose Style
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Regional Preferences & Maintenance Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Regional & Currency Preferences */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-gray-850 pb-3">
            <Coins className="h-5 w-5 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-extrabold text-white">Regional & Payment Preferences</h3>
          </div>

          {/* Currency Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
              Standard Currency Representation Symbols
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as CurrencySymbol)}
              className="mt-1 w-full px-4 py-3 bg-gray-950 border border-gray-850 text-gray-200 text-xs font-bold rounded-xl outline-none focus:border-emerald-500/30 transition-all cursor-pointer"
              id="currency-selector"
            >
              <option value="₹">₹ Indian Rupee (INR)</option>
              <option value="$">$ US Dollar (USD)</option>
              <option value="€">€ Euro (EUR)</option>
              <option value="£">£ British Pound (GBP)</option>
            </select>
          </div>

          {/* Default Payment Method */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-blue-400" />
              Default Payment Method
            </label>
            <span className="text-[11px] text-gray-500">
              Automatically preselects this method when recording a new expense.
            </span>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => handlePaymentMethodChange("Online")}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  defaultPaymentMethod === "Online"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                    : "bg-gray-950/40 border-gray-850 text-gray-500 hover:text-gray-300"
                }`}
                id="default-pay-online-btn"
              >
                <CreditCard className="h-4 w-4 text-blue-400" />
                <span>Online</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentMethodChange("Cash")}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  defaultPaymentMethod === "Cash"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-gray-950/40 border-gray-850 text-gray-500 hover:text-gray-300"
                }`}
                id="default-pay-cash-btn"
              >
                <Banknote className="h-4 w-4 text-amber-400" />
                <span>Cash</span>
              </button>
            </div>
          </div>
        </div>

        {/* Maintenance & Security Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-gray-850 pb-3">
            <Shield className="h-5 w-5 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-extrabold text-white">Maintenance & Security Actions</h3>
          </div>

          {/* Reset Current Month Budget Allocation */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-white">Reset Current Month Budget Allocation</span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Instantly wipe all allocated categories, target savings goals, and monthly limits back to zero.
            </p>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="mt-1 w-fit flex items-center gap-2 px-4 py-2.5 bg-gray-950 hover:bg-amber-500/10 hover:text-amber-400 border border-gray-850 hover:border-amber-500/20 text-gray-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              id="trigger-reset-budget-btn"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Current Month Limits</span>
            </button>
          </div>

          {/* Delete User Account Wiping Data */}
          <div className="flex flex-col gap-2 mt-2 border-t border-gray-850/60 pt-4">
            <span className="text-xs font-bold text-rose-400">Permanently Delete Fenno Account</span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              This completely purges your credentials, budgets, transactions, and categories irreversibly.
            </p>

            <button
              onClick={() => {
                setDeleteInput("");
                setShowDeleteConfirm(true);
              }}
              className="mt-1 w-fit flex items-center gap-2 px-4 py-2.5 bg-gray-950 hover:bg-rose-500/10 hover:text-rose-400 border border-gray-850 hover:border-rose-500/20 text-gray-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              id="trigger-delete-account-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Account & Erase All Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Reset Confirmation Overlay Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Reset Monthly Limits</h3>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">
              This will reset all category budgets, savings goal, and monthly pocket money for {currentMonthNameYear} back to ₹0. This cannot be undone. Continue?
            </p>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetBudget}
                disabled={loading}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl text-xs cursor-pointer transition-all"
                id="confirm-reset-budget-btn"
              >
                {loading ? "Resetting..." : "Yes, Reset"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. Delete Account Confirmation Overlay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Permanently Delete Account</h3>
            </div>

            <div className="flex flex-col gap-4 text-sm text-gray-400 leading-relaxed">
              <p>
                This will permanently delete your account, all budgets, transactions, and savings history. This cannot be undone.
              </p>
              
              <div className="flex flex-col gap-2 mt-1">
                <label className="text-xs font-bold text-gray-400">
                  Please type <span className="text-rose-400 font-mono font-extrabold select-all">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 text-gray-200 text-sm font-semibold rounded-xl outline-none focus:border-rose-500/30 transition-all text-center placeholder-gray-700"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput("");
                }}
                className="px-4 py-2.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteInput !== "DELETE"}
                className={`px-4 py-2.5 font-bold rounded-xl text-xs cursor-pointer transition-all ${
                  deleteInput === "DELETE"
                    ? "bg-rose-500 hover:bg-rose-400 text-white"
                    : "bg-gray-950 text-gray-600 border border-gray-850 cursor-not-allowed"
                }`}
                id="confirm-delete-account-btn"
              >
                {loading ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
