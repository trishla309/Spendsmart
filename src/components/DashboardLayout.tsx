import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, LogOut, ChevronRight, User as UserIcon, Award, BarChart3, Settings, History, Bell, Trash2, CheckCircle, AlertTriangle, Info, Check, PiggyBank, PanelLeftClose, PanelLeftOpen, HandCoins, Receipt, Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { QuickActionModal } from "./QuickActionModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName,
  userEmail,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = React.useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState<boolean>(false);
  const [quickActionMode, setQuickActionMode] = React.useState<"expense" | "to_savings" | "from_savings" | "income">("expense");
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("spendsmart_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Global keyboard shortcut and event listeners for Quick Money Hub
  React.useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvt = e as CustomEvent<{ mode?: "expense" | "to_savings" | "from_savings" | "income" }>;
      if (customEvt.detail?.mode) {
        setQuickActionMode(customEvt.detail.mode);
      } else {
        setQuickActionMode("expense");
      }
      setIsQuickActionOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "n" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setQuickActionMode("expense");
        setIsQuickActionOpen(true);
      }
    };

    window.addEventListener("open-quick-action", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-quick-action", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("spendsmart_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();

    // Poll every 12 seconds for real-time-like notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on click outside
  React.useEffect(() => {
    if (!isNotifOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#notification-bell-btn") && !target.closest("#notifications-dropdown")) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isNotifOpen]);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete("/notifications/clear");
      await fetchNotifications();
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const menuItems = [
    {
      name: "Dashboard Home",
      path: "/dashboard",
      icon: LayoutDashboard,
      desc: "Overview & summary",
    },
    {
      name: "Savings",
      path: "/savings",
      icon: PiggyBank,
      desc: "Cash & UPI reserves",
    },
    {
      name: "Lending & Dues",
      path: "/lending-and-dues",
      icon: HandCoins,
      desc: "Loans, debts & dues",
    },
    {
      name: "Transaction History",
      path: "/history",
      icon: History,
      desc: "Search, filter & sort",
    },
    {
      name: "Budget Planning",
      path: "/budget",
      icon: Wallet,
      desc: "Set and adjust limits",
    },
    {
      name: "Analytics & Reports",
      path: "/analytics",
      icon: BarChart3,
      desc: "Charts & Spending Insights",
    },
    {
      name: "Profile & Settings",
      path: "/settings",
      icon: Settings,
      desc: "Customize preferences",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row font-sans" id="app-container">
      {/* Sidebar */}
      <aside
        className={`w-full md:h-screen md:sticky md:top-0 bg-gray-900/30 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/[0.03] flex flex-col justify-between shrink-0 z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:w-20" : "md:w-72"
        }`}
        id="sidebar-panel"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Header Brand & Toggle Button */}
          <div className={`p-4 border-b border-white/[0.03] flex items-center shrink-0 ${isCollapsed ? "justify-center flex-col gap-3" : "justify-between"}`}>
            <Link 
              to="/" 
              className={`flex items-center gap-2.5 hover:opacity-95 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl p-1 ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Fenno" : "Back to Landing Page"}
              id="sidebar-brand-link"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl shadow-lg shadow-emerald-500/5 group-hover:scale-105 transition-transform shrink-0">
                <Award className="h-5 w-5 animate-pulse" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-lg font-black tracking-tight text-white">
                    Fenno
                  </h1>
                </div>
              )}
            </Link>

            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0 shadow-sm"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              id="sidebar-toggle-btn"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-emerald-400" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation Items (Independently Scrollable Middle Navigation) */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1.5 scrollbar-thin" id="sidebar-nav">
            {menuItems.map((item: any) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <React.Fragment key={item.path}>
                  {item.sectionHeader && !isCollapsed && (
                    <div className="pt-3 pb-1 px-3 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-purple-400">
                        {item.sectionHeader}
                      </span>
                      <div className="h-px bg-gray-800/80 flex-1" />
                    </div>
                  )}
                  {item.sectionHeader && isCollapsed && (
                    <div className="w-6 h-px bg-gray-800 mx-auto my-1" />
                  )}
                  <Link
                    to={item.path}
                    id={`sidebar-link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center rounded-2xl border transition-all duration-200 group ${
                      isCollapsed
                        ? "justify-center p-3"
                        : "justify-between px-3.5 py-2.5"
                    } ${
                      isActive
                        ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/5"
                        : "bg-transparent border-transparent hover:bg-gray-850/50 hover:border-gray-800/50 text-gray-400 hover:text-gray-100"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                      <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-gray-300"}`} />
                      {!isCollapsed && (
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold block truncate">{item.name}</span>
                          <span className="text-[10px] text-gray-500 font-semibold leading-none block mt-0.5 transition-colors group-hover:text-gray-400 truncate">{item.desc}</span>
                        </div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
                        isActive ? "text-emerald-400 translate-x-0.5" : "text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                      }`} />
                    )}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* User Account & Sign Out Footer - Fixed at bottom, below Profile & Settings with space */}
        <div className="p-3 border-t border-gray-800/70 bg-gray-900/30 flex flex-col gap-2 shrink-0 mt-auto" id="sidebar-account-section">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="p-2.5 bg-gray-950/60 border border-gray-800/80 rounded-xl text-emerald-400 flex items-center justify-center cursor-default shadow-inner"
                title={`${userName} (${userEmail})`}
              >
                <UserIcon className="h-4 w-4" />
              </div>
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl text-gray-400 hover:text-rose-400 bg-gray-950/40 hover:bg-rose-500/10 border border-gray-800/80 hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title="Sign Out"
                id="logout-button-collapsed"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-gray-950/50 border border-gray-800/80 shadow-inner">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold text-gray-200 block truncate">{userName}</span>
                  <span className="text-[10px] text-gray-500 font-semibold block truncate mt-0.5">{userEmail}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-gray-950/40 hover:bg-rose-500/10 border border-gray-800/80 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 transition-all duration-200 group cursor-pointer"
                id="logout-button"
              >
                <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0" id="main-panel">
        {/* Top Navbar */}
        <header className="h-18 bg-gray-950/30 border-b border-white/[0.03] flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 backdrop-blur-xl z-40" id="navbar">
          <div>
            <span className="text-[10px] text-gray-400 font-mono font-extrabold tracking-wider uppercase block">
              Workspace
            </span>
            <h2 className="text-base md:text-lg font-black text-white tracking-tight mt-0.5">
              {location.pathname === "/dashboard"
                ? "Financial Dashboard"
                : location.pathname === "/savings"
                ? "Savings & Reserves"
                : location.pathname.startsWith("/lending-and-dues") || location.pathname === "/money-lent" || location.pathname === "/money-to-pay"
                ? "Lending & Dues Hub"
                : location.pathname === "/history"
                ? "Transaction History"
                : location.pathname === "/budget"
                ? "Budget Allocation & Planning"
                : location.pathname === "/analytics"
                ? "Analytics & Spending Insights"
                : "Profile & Settings"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick Money Hub Action Button */}
            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-black text-xs shadow-md shadow-emerald-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              id="navbar-quick-action-btn"
              title="Quick Money Hub (Press N)"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">Quick Entry</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2.5 text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] rounded-xl transition-all cursor-pointer focus:outline-none flex items-center justify-center shadow-sm"
                id="notification-bell-btn"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-gray-950 animate-pulse" id="unread-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown List */}
              {isNotifOpen && (
                <div 
                  className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3.5 z-50 text-gray-200 shadow-gray-950/40"
                  id="notifications-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Notifications</h4>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Queue-based live alerts
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer border border-emerald-500/20"
                          id="mark-all-read-btn"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                        title="Clear all"
                        id="clear-all-notif-btn"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1" id="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map((notif: any) => {
                        const isWarning = notif.type === "warning";
                        const isSuccess = notif.type === "success";
                        return (
                          <div
                            key={notif._id}
                            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all relative ${
                              !notif.read ? "bg-gray-800/30 border-gray-700/50 shadow-sm" : "bg-gray-950/10 border-gray-850/40 opacity-70"
                            }`}
                          >
                            {/* Blue dot indicator for unread */}
                            {!notif.read && (
                              <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            )}

                            {/* Icon */}
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isWarning
                                  ? "bg-rose-500/5 text-rose-400 border border-rose-500/15 shadow-inner"
                                  : isSuccess
                                  ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 shadow-inner"
                                  : "bg-blue-500/5 text-blue-400 border border-blue-500/15 shadow-inner"
                              }`}
                            >
                              {isWarning ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : isSuccess ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Info className="h-4 w-4" />
                              )}
                            </div>

                            {/* Message & Title */}
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="text-xs font-bold text-white block truncate">{notif.title}</span>
                              <p className="text-[11px] text-gray-400 font-semibold leading-relaxed mt-1 break-words">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-gray-500 font-mono font-bold mt-1.5 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Actions */}
                            {!notif.read && (
                              <button
                                onClick={(e) => markAsRead(notif._id, e)}
                                className="text-gray-500 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-gray-800 shrink-0 self-center transition-all cursor-pointer"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2.5">
                        <Bell className="h-7 w-7 text-gray-700" />
                        <span className="text-xs font-semibold text-gray-400">All caught up! No notifications.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto" id="main-content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>



      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        initialMode={quickActionMode}
      />
    </div>
  );
};
