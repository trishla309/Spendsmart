import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./lib/api";
import { User } from "./types";
import { BudgetPlanning } from "./pages/BudgetPlanning";
import { DashboardHome } from "./pages/DashboardHome";
import { TransactionHistory } from "./pages/TransactionHistory";
import { DashboardLayout } from "./components/DashboardLayout";
import { Analytics } from "./pages/Analytics";
import { SettingsPage } from "./pages/Settings";
import { SavingsPage } from "./pages/Savings";
import { MoneyLentPage } from "./pages/MoneyLent";
import { MoneyToPayPage } from "./pages/MoneyToPay";
import { LendingAndDues } from "./pages/LendingAndDues";
import { restoreBackupIfNeeded } from "./lib/sync";
import { LandingPage } from "./pages/LandingPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("token") && localStorage.getItem("user"));
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("token") && !localStorage.getItem("user"));
  });

  // Persistent login verification on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get("token");
        if (tokenParam) {
          localStorage.setItem("token", tokenParam);
          const cleanUrl = window.location.origin + window.location.pathname + (window.location.hash || "");
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (e) {
        console.error("Error reading token param:", e);
      }

      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Validate token with server
          const response = await api.get("/auth/me");
          const verifiedUser = response.data.user;
          setUser(verifiedUser);
          localStorage.setItem("user", JSON.stringify(verifiedUser));
          setIsAuthenticated(true);

          // Restore any missing backup data due to backend container resets
          const uId = verifiedUser?.id;
          if (uId) {
            restoreBackupIfNeeded(uId).catch((err) => {
              console.error("Local restore failed:", err);
            });
          }
        } catch (error: any) {
          console.error("Session restored failed:", error);
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (token: string, userData: { id: string; name: string; email: string }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    const uId = userData?.id;
    if (uId) {
      restoreBackupIfNeeded(uId).catch((err) => {
        console.error("Local restore on login failed:", err);
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    const isPublic = ["/", "/landing"].includes(window.location.pathname);
    return (
      <div className={`min-h-screen ${isPublic ? "bg-cream text-nearblack" : "bg-gray-950 text-gray-100"} flex flex-col items-center justify-center font-sans`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`h-10 w-10 rounded-xl ${isPublic ? "bg-navy/5 border border-navy/10 text-navy" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"} flex items-center justify-center animate-spin`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className={`text-sm font-semibold tracking-wide ${isPublic ? "text-graytext" : "text-gray-400"}`}>Loading Fenno Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route: If logged in, go straight to dashboard; otherwise show landing page */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage
                isAuthenticated={isAuthenticated}
                onLoginSuccess={handleLoginSuccess}
              />
            )
          }
        />

        {/* Explicit Landing Route */}
        <Route
          path="/landing"
          element={
            <LandingPage
              isAuthenticated={isAuthenticated}
              onLoginSuccess={handleLoginSuccess}
            />
          }
        />

        {/* Convenience /login redirect */}
        <Route
          path="/login"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />


        {/* Protected Dashboard/Planning Routes */}
        <Route
          path="/budget"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <BudgetPlanning />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <DashboardHome />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/savings"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <SavingsPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/lending-and-dues"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <LendingAndDues />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/money-lent"
          element={<Navigate to="/lending-and-dues?tab=lent" replace />}
        />

        <Route
          path="/money-to-pay"
          element={<Navigate to="/lending-and-dues?tab=pay" replace />}
        />

        <Route
          path="/history"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <TransactionHistory />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/analytics"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <Analytics />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <DashboardLayout
                userName={user?.name || "Student"}
                userEmail={user?.email || "student@example.com"}
                onLogout={handleLogout}
              >
                <SettingsPage onLogout={handleLogout} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Fallback routing */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
