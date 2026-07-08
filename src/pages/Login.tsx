import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  Lock, 
  Loader2,
  ArrowRight
} from "lucide-react";
import { api } from "../lib/api";
import { PasswordInput } from "../components/PasswordInput";
import { motion, AnimatePresence } from "motion/react";

interface LoginProps {
  onLoginSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Inline Field Errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // General/Form-wide Errors
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Forgot password simulation states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setGeneralError("Your session has expired. Please log in again.");
    }
  }, [searchParams]);

  const validateEmailFormat = (emailStr: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailStr);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) {
      if (!val) {
        setEmailError("This field is required");
      } else if (!validateEmailFormat(val)) {
        setEmailError("Enter a valid email address");
      } else {
        setEmailError(null);
      }
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (passwordError) {
      if (!val) {
        setPasswordError("This field is required");
      } else {
        setPasswordError(null);
      }
    }
  };

  const handleDemoLogin = () => {
    setEmail("student@example.com");
    setPassword("Student@123");
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail) {
      setForgotError("Email address is required.");
      return;
    }
    if (!validateEmailFormat(forgotEmail)) {
      setForgotError("Enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
      console.log(`[SpendSmart Simulation] Forgot Password triggered for ${forgotEmail}. Link: https://spendsmart.example.com/reset-password?token=mock_dsa_token_${Math.random().toString(36).substring(2)}`);
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccess(null);

    let hasError = false;

    // Email validation
    if (!email.trim()) {
      setEmailError("This field is required");
      hasError = true;
    } else if (!validateEmailFormat(email)) {
      setEmailError("Enter a valid email address");
      hasError = true;
    } else {
      setEmailError(null);
    }

    // Password validation
    if (!password) {
      setPasswordError("This field is required");
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      setSuccess("Welcome back! Loading your workspace...");
      setTimeout(() => {
        onLoginSuccess(token, user);
        navigate("/dashboard"); // Route straight to Dashboard upon successful login
      }, 800);
    } catch (err: any) {
      if (err.response && err.response.status) {
        // Distinguish between validation/mismatch issues and full server errors
        if (err.response.status === 400 || err.response.status === 401 || err.response.status === 404) {
          const rawError = err.response.data && err.response.data.error;
          if (rawError === "User Not Found." || rawError === "Invalid Password.") {
            setGeneralError("Incorrect email or password. Please try again.");
          } else if (rawError) {
            setGeneralError(rawError);
          } else {
            setGeneralError("Incorrect email or password. Please try again.");
          }
        } else {
          // Status >= 500
          setGeneralError("Something went wrong on our end. Please try again in a moment.");
        }
      } else {
        // Network errors or timeout
        setGeneralError("Something went wrong on our end. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-300" id="login-container">
      {/* Premium Visual Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_60%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Clickable Back-to-Home Link with Focus ring */}
        <div className="mb-4 flex justify-start">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-lg px-2.5 py-1.5"
            id="back-home-link"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand Header — Fully clickable link back to landing page */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link 
            to="/" 
            className="flex items-center gap-2.5 mb-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950 rounded-xl p-1.5 transition-all"
            title="SpendSmart Home"
            id="login-brand-logo-link"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-sans font-bold tracking-tight text-gray-100 text-lg group-hover:text-emerald-400 transition-colors">SpendSmart</span>
            <span className="text-[10px] font-mono bg-gray-800/80 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700/50">DSA-Core</span>
          </Link>
          <p className="text-[11px] text-gray-500 font-mono tracking-wider uppercase">
            Irregular Budgets • Optimized Wallets
          </p>
        </div>

        {/* Login Card Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="login-card">
          
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-100" id="login-title">Welcome Back</h2>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Log in to manage pocket money, configure custom budget envelopes, and search transactions instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* General Form-Wide Alert Area */}
            <AnimatePresence mode="wait">
              {generalError && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-start gap-2.5 overflow-hidden"
                  id="login-error-alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-semibold block text-rose-300">Access Denied</span>
                    <span className="text-[11px] text-rose-400/90 leading-tight block mt-0.5">{generalError}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-start gap-2.5 overflow-hidden"
                  id="login-success-alert"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold block text-emerald-300">Welcome back</span>
                    <span className="text-[11px] text-emerald-400/90 leading-tight block mt-0.5">{success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-input" className="text-xs font-medium text-gray-400">
                Email Address
              </label>
              <input
                id="email-input"
                type="text"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-950/40 border ${
                  emailError ? "border-rose-500 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-800 focus:border-emerald-500/50 focus:ring-emerald-500/10"
                } focus:ring-4 text-sm text-gray-100 rounded-lg outline-none transition-all duration-200 placeholder-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
              />
              {emailError && (
                <p className="text-xs text-rose-500/90 mt-0.5 font-medium flex items-center gap-1" id="email-field-error">
                  <span>●</span> {emailError}
                </p>
              )}
            </div>

            {/* Password Row */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="password-input" className="text-xs font-medium text-gray-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 focus:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded px-1 transition-all"
                  id="forgot-password-link"
                >
                  Forgot Password?
                </button>
              </div>
              <PasswordInput
                id="password-input"
                label="" // Suppress duplicate label so we can lay out custom row above
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                error={passwordError || undefined}
                className="focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-gray-950 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/10 focus:ring-2 focus:ring-emerald-400 focus:outline-none focus:ring-offset-2 focus:ring-offset-gray-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-950" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Log In to Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-6 pt-5 border-t border-gray-800 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-950 hover:bg-gray-850 border border-gray-800 text-xs font-semibold text-emerald-400 cursor-pointer transition-all hover:border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400"
              id="demo-login-fill-btn"
            >
              <Sparkles className="h-3 w-3" />
              <span>Auto-Fill Demo Credentials</span>
            </button>
            <p className="text-[10px] text-gray-500 text-center leading-relaxed font-mono">
              Demo Account: <span className="text-gray-400">student@example.com</span> / <span className="text-gray-400">Student@123</span>
            </p>
          </div>

          {/* Simulated Forgot Password Modal inside card context */}
          <AnimatePresence>
            {forgotModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-950/95 backdrop-blur-sm flex items-center justify-center p-6 z-25"
                id="forgot-password-modal"
              >
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl w-full flex flex-col gap-3.5 text-left shadow-2xl relative">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      Recover Password
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => { setForgotModalOpen(false); setForgotSuccess(false); setForgotEmail(""); setForgotError(null); }}
                      className="text-gray-500 hover:text-gray-300 text-xs font-mono p-1 rounded hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      ✕ Close
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    SpendSmart operates in a self-contained environment. Link dispatching is simulated. Enter your email to output a token in the console.
                  </p>

                  {forgotError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs flex flex-col gap-1">
                      <span className="font-semibold text-emerald-300">Link Generated!</span>
                      <span className="text-[11px] leading-relaxed text-gray-300">
                        A simulated reset link was sent to your browser console for <strong className="text-emerald-400">{forgotEmail}</strong>.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="forgot-email-input" className="text-[11px] text-gray-400 font-semibold uppercase font-mono">
                          Email Address
                        </label>
                        <input
                          id="forgot-email-input"
                          type="text"
                          placeholder="student@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 focus:border-emerald-500/50 text-xs text-gray-100 rounded-lg outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 focus-visible:ring-2 focus-visible:ring-emerald-400"
                          required
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-gray-950 text-xs font-bold rounded-lg transition-all focus:ring-2 focus:ring-emerald-400 focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Generating Reset Link...</span>
                          </>
                        ) : (
                          "Send Simulation Reset"
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer Link to Signup */}
        <p className="text-center text-sm text-gray-500 mt-6 font-sans">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors focus:underline focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-1 focus-visible:ring-2 focus-visible:ring-emerald-400" 
            id="signup-link"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
