import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  Wallet,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { api } from "../lib/api";

interface LandingPageProps {
  isAuthenticated?: boolean;
  onLoginSuccess?: (token: string, user: { id: string; name: string; email: string }) => void;
}

export function LandingPage({ isAuthenticated, onLoginSuccess }: LandingPageProps = {}) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"email" | "signup-details" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Modal controls
  const openLoginModal = () => {
    setAuthType("login");
    setStep("email");
    setAuthError(null);
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openSignupModal = () => {
    setAuthType("signup");
    setStep("signup-details");
    setAuthError(null);
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const closeModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  // Auth submission handlers preserving backend logic
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email) {
      setAuthError("Please enter your email address.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/request-otp", { email });
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
        setOtp(res.data.devOtp);
      } else {
        setDevOtp(null);
      }
      setAuthType("login");
      setStep("otp");
    } catch (err: any) {
      if (err.response?.status === 404) {
        // User not found, switch to signup details
        setAuthType("signup");
        setStep("signup-details");
      } else {
        setAuthError(err.response?.data?.error || "An error occurred while connecting.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!name) {
      setAuthError("Please enter your full name.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/signup-request", { name, email, phone });
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
        setOtp(res.data.devOtp);
      } else {
        setDevOtp(null);
      }
      setStep("otp");
    } catch (err: any) {
      setAuthError(err.response?.data?.error || "Failed to submit sign up request.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!otp) {
      setAuthError("Please enter the 6-digit OTP code.");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", { email, otp, type: authType });
      const { token, user } = response.data;
      if (onLoginSuccess) {
        onLoginSuccess(token, user);
      }
      closeModal();
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.response?.data?.error || "Incorrect OTP code. Please check and try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("student@example.com");
    setAuthError(null);
    setAuthLoading(true);
    try {
      await api.post("/auth/request-otp", { email: "student@example.com" });
      setAuthType("login");
      setStep("otp");
      setOtp("123456");
    } catch (err: any) {
      // If demo account setup directly
      setAuthType("login");
      setStep("otp");
      setOtp("123456");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTristhaLogin = async () => {
    setEmail("tristha97@gmail.com");
    setAuthError(null);
    setAuthLoading(true);
    try {
      const response = await api.post("/auth/temp-access", { email: "tristha97@gmail.com" });
      const { token, user } = response.data;
      if (onLoginSuccess) {
        onLoginSuccess(token, user);
      }
      closeModal();
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.response?.data?.error || "Failed to access account.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-nearblack font-sans selection:bg-navy/15 selection:text-navy relative overflow-x-hidden">
      
      {/* Navbar Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-cream/90 backdrop-blur-md border-b border-sand-border/80 py-3.5 shadow-xs"
            : "bg-cream py-5 border-b border-sand-border/50"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-none"
            id="fenno-logo-link"
          >
            <div className="h-8 w-8 rounded-lg bg-navy text-white flex items-center justify-center font-display font-bold text-lg shadow-xs">
              F
            </div>
            <span className="font-display font-semibold tracking-tight text-nearblack text-xl">
              Fenno
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-nearblack/70">
            <a href="#how-it-works" className="hover:text-navy transition-colors">
              How it works
            </a>
            <a href="#philosophy" className="hover:text-navy transition-colors">
              Philosophy
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={openLoginModal}
              className="text-sm font-medium text-nearblack/80 hover:text-navy px-3 py-2 transition-colors cursor-pointer"
              id="nav-login-btn"
            >
              Log in
            </button>
            <button
              onClick={openSignupModal}
              className="inline-flex items-center justify-center px-4.5 py-2 text-sm font-medium text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-xs cursor-pointer"
              id="nav-get-started-btn"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-nearblack hover:text-navy p-1.5 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cream border-b border-sand-border px-6 pt-3 pb-6 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-nearblack/80 py-2 border-b border-sand-border/40 font-medium"
            >
              How it works
            </a>
            <a
              href="#philosophy"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-nearblack/80 py-2 border-b border-sand-border/40 font-medium"
            >
              Philosophy
            </a>
            <div className="flex flex-col gap-2.5 pt-3">
              <button
                onClick={openLoginModal}
                className="w-full py-2.5 text-center text-sm font-medium text-nearblack bg-white border border-sand-border rounded-lg shadow-xs"
              >
                Log in
              </button>
              <button
                onClick={openSignupModal}
                className="w-full py-2.5 text-center text-sm font-medium text-white bg-navy rounded-lg shadow-xs"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* SECTION 1: HERO */}
      <section className="pt-16 pb-24 md:pt-28 md:pb-36 border-b border-sand-border bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy/5 border border-navy/10 text-navy text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-navy"></span>
            <span>Student Money Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-semibold text-nearblack tracking-tight leading-[1.08] mb-8 max-w-3xl">
            Make your money last till the month does.
          </h1>

          <p className="text-lg sm:text-xl text-graytext leading-relaxed font-normal max-w-2xl mb-10">
            Fenno helps students balance everyday spending with intentional savings. Understand your true daily limit, manage your allowance with confidence, and make clear choices without stress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={openSignupModal}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-white bg-navy hover:bg-navy-hover rounded-xl transition-all shadow-xs cursor-pointer"
              id="hero-get-started-btn"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 text-white/80" />
            </button>
            <button
              onClick={openLoginModal}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-nearblack bg-white border border-sand-border hover:border-nearblack/30 rounded-xl transition-all shadow-xs cursor-pointer"
              id="hero-login-btn"
            >
              Log in
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-14 pt-8 border-t border-sand-border/70 text-xs text-graytext">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-navy/70" />
              <span>Private &amp; Local</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-navy/70" />
              <span>No Bank Login Required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Built Specifically for Student Life</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: STUDENT PROBLEM / RELATABLE INSIGHT */}
      <section id="how-it-works" className="py-24 md:py-32 bg-white border-b border-sand-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-navy/70 font-semibold block mb-3">
              Student Insight
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-nearblack tracking-tight leading-tight mb-6">
              Knowing how much you have is different from knowing what you can actually spend.
            </h2>
            <p className="text-base sm:text-lg text-graytext leading-relaxed font-normal">
              When an allowance or money lands in your account, the raw balance looks like plenty. But after upcoming rent, textbooks, and monthly commitments, knowing your actual safe daily room to spend is what keeps you afloat without panic at the end of the month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            
            <div className="p-7 bg-cream/30 border border-sand-border/80 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-navy/5 text-navy flex items-center justify-center mb-5">
                  <Wallet className="h-5 w-5" />
                </div>
                <h3 className="font-display font-medium text-xl text-nearblack mb-2">1. Raw Account Balance</h3>
                <p className="text-sm text-graytext leading-relaxed">
                  The total money sitting in your bank account right now. Looking at this number alone often creates a false sense of security early in the term.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-sand-border/60 text-xs font-mono text-nearblack/70 font-medium">
                Total Bank Balance
              </div>
            </div>

            <div className="p-7 bg-cream/30 border border-sand-border/80 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-navy/5 text-navy flex items-center justify-center mb-5">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="font-display font-medium text-xl text-nearblack mb-2">2. Fixed Obligations</h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Upcoming Rent share, phone bills, course software, plus intentional monthly savings you want to set aside before touching anything else.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-sand-border/60 text-xs font-mono text-graytext">
                Deducted Commitments
              </div>
            </div>

            <div className="p-7 bg-navy text-white rounded-2xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-5">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-display font-medium text-xl text-white mb-2">3. True Daily Clarity</h3>
                <p className="text-sm text-cream/80 leading-relaxed">
                  Fenno calculates your exact unallocated safe-to-spend allowance per remaining day, giving you guilt-free confidence every time you spend.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/20 text-xs font-mono text-emerald-300 font-semibold">
                Calculated Safe Limit
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: LARGE CENTERED STATEMENT */}
      <section className="py-28 md:py-40 bg-cream border-b border-sand-border relative">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-nearblack tracking-tight leading-[1.15] text-balance">
            “You shouldn’t have to choose between today and tomorrow.”
          </p>
        </div>
      </section>

      {/* SECTION 4: FENNO PHILOSOPHY */}
      <section id="philosophy" className="py-24 md:py-32 bg-white border-b border-sand-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-navy/70 font-semibold block mb-3">
              The Fenno Philosophy
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-nearblack tracking-tight leading-tight mb-6">
              Make the most of what you have.
            </h2>
            <p className="text-base sm:text-lg text-graytext leading-relaxed font-normal">
              Fenno helps students manage everyday spending while keeping their goals in sight. Protect your daily essentials first, spend without constant worry, and build steady momentum toward what matters to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Traditional Rigid Way */}
            <div className="p-8 sm:p-10 bg-cream/20 border border-sand-border/80 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-mono rounded-md mb-5">
                  Traditional Budgeting
                </div>
                <h3 className="font-display font-medium text-2xl text-nearblack mb-3">
                  Sacrifice &amp; Anxiety
                </h3>
                <p className="text-sm sm:text-base text-graytext leading-relaxed mb-6">
                  Forcing rigid monthly envelope rules that punish normal student life. Skipping meals or social moments just to hit an arbitrary savings target.
                </p>
              </div>
              <div className="space-y-3 pt-6 border-t border-sand-border/60 text-xs sm:text-sm text-graytext">
                <div className="flex items-center gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Constant anxiety about overspending</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Unrealistic monthly restrictions</span>
                </div>
              </div>
            </div>

            {/* The Fenno Way */}
            <div className="p-8 sm:p-10 bg-white border-2 border-navy/20 rounded-2xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="inline-block px-3 py-1 bg-navy/10 text-navy border border-navy/20 text-xs font-mono rounded-md mb-5 font-semibold">
                  The Fenno Balance
                </div>
                <h3 className="font-display font-medium text-2xl text-nearblack mb-3">
                  Human &amp; Intentional
                </h3>
                <p className="text-sm sm:text-base text-graytext leading-relaxed mb-6">
                  Cover your daily essential needs first. Set realistic savings goals that keep you comfortable without feeling stranded before month's end.
                </p>
              </div>
              <div className="space-y-3 pt-6 border-t border-sand-border text-xs sm:text-sm text-nearblack font-medium">
                <div className="flex items-center gap-2.5 text-navy">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Balanced daily safe-to-spend limit</span>
                </div>
                <div className="flex items-center gap-2.5 text-navy">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Save comfortably without guilt</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5: FINAL CTA */}
      <section className="py-24 sm:py-32 bg-navy text-white relative">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
          
          <div className="h-12 w-12 rounded-xl bg-white/10 text-white flex items-center justify-center font-display font-bold text-2xl mb-6 shadow-inner">
            F
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-5 max-w-2xl">
            Ready to take control of your student budget?
          </h2>

          <p className="text-base sm:text-lg text-cream/80 max-w-xl mb-9 leading-relaxed font-normal">
            Join Fenno today. Simple, private money management designed specifically for student life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={openSignupModal}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-medium text-navy bg-white hover:bg-cream rounded-xl transition-all shadow-md cursor-pointer"
              id="cta-get-started-btn"
            >
              Get Started Now
              <ArrowRight className="ml-2.5 h-4 w-4 text-navy" />
            </button>
            <button
              onClick={openLoginModal}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-base font-medium text-white hover:text-cream border border-white/20 hover:border-white/40 rounded-xl transition-all cursor-pointer"
              id="cta-login-btn"
            >
              Log in to account
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-sand-border text-xs text-graytext font-sans">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-nearblack text-sm">Fenno</span>
            <span>•</span>
            <span>Student Money Management</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Fenno. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL OVERLAY */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md transition-all animate-in fade-in duration-200">
          
          <div
            className="w-full max-w-md bg-white border border-sand-border rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-graytext hover:text-nearblack p-1 rounded-lg hover:bg-cream transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header & Mode Switch */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-navy text-white flex items-center justify-center font-display font-bold text-sm">
                  F
                </div>
                <span className="font-display font-semibold text-nearblack text-lg">Fenno</span>
              </div>

              <div className="flex border-b border-sand-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthType("login");
                    setStep("email");
                    setAuthError(null);
                  }}
                  className={`pb-2.5 px-4 text-sm font-medium transition-colors border-b-2 ${
                    authType === "login"
                      ? "border-navy text-navy font-semibold"
                      : "border-transparent text-graytext hover:text-nearblack"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthType("signup");
                    setStep("signup-details");
                    setAuthError(null);
                  }}
                  className={`pb-2.5 px-4 text-sm font-medium transition-colors border-b-2 ${
                    authType === "signup"
                      ? "border-navy text-navy font-semibold"
                      : "border-transparent text-graytext hover:text-nearblack"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Step 1: Email Input */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-nearblack">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-sand-border focus:border-navy text-sm rounded-lg outline-none transition-colors"
                    placeholder="student@example.com"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-1 py-3 bg-navy hover:bg-navy-hover text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-xs"
                >
                  {authLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    "Continue with Email"
                  )}
                </button>

                <div className="mt-3 pt-3 border-t border-sand-border flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleTristhaLogin}
                    className="w-full py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                    id="tristha-access-btn"
                  >
                    <span>🔑 Direct Access: tristha97@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full py-2.5 text-xs font-medium text-navy bg-navy/5 hover:bg-navy/10 border border-navy/15 rounded-lg transition-colors text-center cursor-pointer"
                  >
                    ⚡ Try Instant Demo Account
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Signup Details */}
            {step === "signup-details" && (
              <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-nearblack">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-sand-border focus:border-navy text-sm rounded-lg outline-none transition-colors"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-nearblack">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-sand-border focus:border-navy text-sm rounded-lg outline-none transition-colors"
                    placeholder="Alex Johnson"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-nearblack">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-sand-border focus:border-navy text-sm rounded-lg outline-none transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-3 bg-navy hover:bg-navy-hover text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-xs"
                >
                  {authLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            )}

            {/* Step 3: OTP Verification */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <div className="text-xs text-graytext leading-relaxed">
                  We've sent a 6-digit verification code to <strong className="text-nearblack font-semibold">{email}</strong>.
                  {email === "student@example.com" || email === "tristha97@gmail.com" ? (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium text-xs">
                      Master / Demo Mode: Enter OTP <strong className="font-mono text-sm">123456</strong>
                    </div>
                  ) : devOtp ? (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-medium text-xs">
                      Localhost Dev Mode: OTP code is <strong className="font-mono text-sm">{devOtp}</strong> (Auto-filled)
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-nearblack">Verification Code (OTP)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2.5 text-center tracking-widest font-mono font-semibold text-xl bg-cream/40 border border-sand-border focus:border-navy rounded-lg outline-none transition-colors"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-1 py-3 bg-navy hover:bg-navy-hover text-white text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-xs"
                >
                  {authLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying OTP...</>
                  ) : (
                    "Verify & Proceed to Fenno"
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); }}
                    className="text-xs text-graytext hover:text-navy underline cursor-pointer"
                  >
                    Change email address
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
