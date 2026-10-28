import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  Lock,
  HeartHandshake,
  Zap,
  Check,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { api } from "../lib/api";
import { FennoLogoMark } from "../components/FennoLogo";

interface LandingPageProps {
  isAuthenticated?: boolean;
  onLoginSuccess?: (token: string, user: { id: string; name: string; email: string }) => void;
}

export function LandingPage({ isAuthenticated, onLoginSuccess }: LandingPageProps = {}) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Live Student Simulator state
  const [simPocketMoney, setSimPocketMoney] = useState(6000);
  const [simDaysLeft, setSimDaysLeft] = useState(20);
  const simDailySafe = Math.round(simPocketMoney / Math.max(1, simDaysLeft));

  // FAQ open state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      setScrolled(window.scrollY > 20);
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
    setEmail("demo@spendsmart.com");
    setAuthError(null);
    setAuthLoading(true);
    try {
      await api.post("/auth/request-otp", { email: "demo@spendsmart.com" });
      const response = await api.post("/auth/verify-otp", {
        email: "demo@spendsmart.com",
        otp: "123456",
        type: "login",
      });
      const { token, user } = response.data;
      if (onLoginSuccess) {
        onLoginSuccess(token, user);
      }
      closeModal();
      navigate("/dashboard");
    } catch (err: any) {
      setAuthType("login");
      setStep("otp");
      setOtp("123456");
      setAuthError(err.response?.data?.error || "Could not automatically sign in.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTrishthaLogin = async () => {
    setEmail("trishtha97@gmail.com");
    setAuthError(null);
    setAuthLoading(true);
    try {
      await api.post("/auth/request-otp", { email: "trishtha97@gmail.com" });
      const response = await api.post("/auth/verify-otp", {
        email: "trishtha97@gmail.com",
        otp: "123456",
        type: "login",
      });
      const { token, user } = response.data;
      if (onLoginSuccess) {
        onLoginSuccess(token, user);
      }
      closeModal();
      navigate("/dashboard");
    } catch (err: any) {
      setAuthType("login");
      setStep("otp");
      setOtp("123456");
      setAuthError(err.response?.data?.error || "Could not automatically sign in.");
    } finally {
      setAuthLoading(false);
    }
  };

  const faqs = [
    {
      q: "Do I need to link my bank account or share UPI PINs?",
      a: "Never. Fenno is 100% private and offline-capable. You simply set your monthly pocket money, and Fenno calculates your safe daily spend. No bank passwords or sensitive permissions ever required.",
    },
    {
      q: "How does the daily safe spend calculate?",
      a: "It divides your remaining spendable pocket money by the exact days left until month-end. If you spend less on Monday, your daily limit automatically grows for Tuesday and the weekend.",
    },
    {
      q: "How does splitting money with friends work?",
      a: "When you pay for campus auto rides, canteen thalis, or group snacks, log it in 1 tap under 'Money Lent'. Fenno keeps track of who owes you what so you never have to do awkward reminder math.",
    },
    {
      q: "Is Fenno free for students?",
      a: "Yes, 100% free. Fenno was created specifically to help college students stay financially secure and stress-free throughout their semester.",
    },
  ];

  return (
    <div className="fenno-landing min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-900 relative overflow-x-hidden antialiased">
      {/* Top Subtle Vivid Jade Highlight Border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#059669] to-transparent" />

      {/* Navigation Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-xs"
            : "bg-white py-4 sm:py-5 border-b border-slate-100"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded-lg"
            id="fenno-logo-link"
          >
            <FennoLogoMark variant="emerald" className="h-8 w-8 shrink-0 group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
              Fenno
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a
              href="#calculator"
              className="hover:text-[#059669] transition-colors"
            >
              Daily Pace Calculator
            </a>
            <a
              href="#features"
              className="hover:text-[#059669] transition-colors"
            >
              Campus Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#059669] transition-colors"
            >
              Why Fenno
            </a>
            <a
              href="#faq"
              className="hover:text-[#059669] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-extrabold text-white bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-emerald-600/20 cursor-pointer gap-2 group"
                id="nav-go-dashboard-btn"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors cursor-pointer rounded-xl hover:bg-slate-100"
                  id="nav-login-btn"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={openSignupModal}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-extrabold text-white bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-emerald-600/20 cursor-pointer gap-2 group"
                  id="nav-get-started-btn"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
              id="mobile-menu-toggle-btn"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-xl">
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-700 py-1"
            >
              Daily Pace Calculator
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-700 py-1"
            >
              Campus Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-700 py-1"
            >
              Why Fenno
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-700 py-1"
            >
              FAQ
            </a>
            <div className="h-px bg-slate-100 my-1" />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center text-xs font-extrabold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={openSignupModal}
                  className="w-full py-2.5 text-center text-xs font-extrabold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors shadow-sm"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main>
        {/* HERO SECTION */}
        <section
          aria-label="Hero Section"
          className="relative pt-12 pb-14 sm:pt-20 sm:pb-20 overflow-hidden"
          id="hero-section"
        >
          {/* Subtle Ambient Vivid Jade Highlight Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[620px] h-[300px] sm:h-[420px] bg-emerald-400/[0.08] rounded-full blur-[120px] pointer-events-none -z-10"
          />

          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center">
            {/* Core Headline with Vivid Jade Accent */}
            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5 text-balance">
              Stop running out of money before the{" "}
              <span className="text-[#059669] bg-emerald-50/80 px-3 py-0.5 rounded-2xl border border-emerald-200/70 inline-block shadow-xs">
                month ends.
              </span>
            </h1>

            {/* Supporting Copy - Natural, Real, Student-Friendly */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-xl mb-8 text-balance">
              Fenno turns your monthly pocket money into an exact, guilt-free daily spend. If you save money on Monday, your weekend budget automatically grows.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-6">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-extrabold text-white bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-emerald-600/25 hover:-translate-y-0.5 cursor-pointer group"
                  id="hero-go-dashboard-btn"
                >
                  <span>Go to Your Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openSignupModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-extrabold text-white bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-emerald-600/25 hover:-translate-y-0.5 cursor-pointer group"
                    id="hero-get-started-btn"
                  >
                    <span>Try Fenno Free</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
                    id="hero-signin-btn"
                  >
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </div>

            {/* Student Privacy & Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-xs text-slate-500 font-medium mb-12">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#059669] stroke-[2.5]" />
                100% Free for College Students
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#059669] stroke-[2.5]" />
                Zero Bank Links or Passwords Needed
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#059669] stroke-[2.5]" />
                Setup in 60 Seconds
              </span>
            </div>

            {/* Interactive Live Student Spend Simulator */}
            <div
              id="calculator"
              className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 text-left relative overflow-hidden scroll-mt-24"
            >
              {/* Highlight Vivid Jade bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#059669] to-teal-400" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-2 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-[#059669] rounded-xl">
                    <Zap className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Live Student Pace Calculator
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Adjust your allowance to see Fenno's daily math
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-[#059669] border border-emerald-200/60 w-fit">
                  Instant Calculation
                </span>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-7">
                {/* Slider 1: Pocket Money */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Monthly Pocket Money</span>
                    <span className="font-mono font-extrabold text-[#059669] bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      ₹{simPocketMoney.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={simPocketMoney}
                    onChange={(e) => setSimPocketMoney(Number(e.target.value))}
                    className="w-full accent-[#059669] cursor-pointer h-2 bg-slate-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>₹1,000</span>
                    <span>₹20,000</span>
                  </div>
                </div>

                {/* Slider 2: Days Left */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Days Left This Month</span>
                    <span className="font-mono font-extrabold text-[#059669] bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      {simDaysLeft} days
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="31"
                    step="1"
                    value={simDaysLeft}
                    onChange={(e) => setSimDaysLeft(Number(e.target.value))}
                    className="w-full accent-[#059669] cursor-pointer h-2 bg-slate-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>2 days</span>
                    <span>31 days</span>
                  </div>
                </div>
              </div>

              {/* Result Pill */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold block mb-0.5">
                    Your Safe Spend Today
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#059669] font-mono">
                      ₹{simDailySafe}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ day</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                    Safe to spend without guilt
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Recalculates every morning based on actual spend
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE 3 CAMPUS PILLARS */}
        <section
          aria-label="Core Features"
          className="py-16 sm:py-24 bg-slate-50/60 border-t border-slate-200/70 scroll-mt-16"
          id="features"
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            {/* Section Header */}
            <div className="max-w-2xl mb-12 sm:mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-[#059669] font-extrabold block mb-2">
                Built for Campus Realities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                Three smart tools. Zero financial stress.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                Tailored specifically around hostel pocket money, canteen splits, and protecting semester fees.
              </p>
            </div>

            {/* Asymmetrical 3-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
              {/* Pillar 1: Daily Pace */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 group">
                <div>
                  <div className="p-3 w-fit rounded-2xl bg-emerald-50 text-[#059669] mb-5 group-hover:scale-105 transition-transform">
                    <Clock className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider block mb-1">
                    Pillar 01
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-2">
                    Dynamic Daily Burn Pace
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    Know your exact daily spend limit. Save ₹100 today, and your limit automatically grows for the weekend.
                  </p>
                </div>

                {/* Micro Visual Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-700">Today's Allowance</span>
                    <span className="font-mono font-bold text-[#059669]">₹280</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full rounded-full w-[45%]" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                    <span>Spent: ₹120 (Chai + Thali)</span>
                    <span>Left: ₹160</span>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Peer Ledger */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 group">
                <div>
                  <div className="p-3 w-fit rounded-2xl bg-emerald-50 text-[#059669] mb-5 group-hover:scale-105 transition-transform">
                    <HeartHandshake className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider block mb-1">
                    Pillar 02
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-2">
                    Friend Splits & Peer Dues
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    Never lose track of who owes you for canteen lunch, shared auto fares, or hostel snacks. Zero awkwardness.
                  </p>
                </div>

                {/* Micro Visual Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200/60">
                    <div>
                      <span className="font-bold text-slate-800 block">Alex • Pizza Split</span>
                      <span className="text-[10px] text-slate-500">Owes you</span>
                    </div>
                    <span className="font-mono font-extrabold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      +₹350
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Rahul • Auto Share</span>
                      <span className="text-[10px] text-slate-500">Paid back</span>
                    </div>
                    <span className="font-mono font-bold text-slate-500">
                      Settled ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Protected Reserves */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 group">
                <div>
                  <div className="p-3 w-fit rounded-2xl bg-emerald-50 text-[#059669] mb-5 group-hover:scale-105 transition-transform">
                    <Lock className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider block mb-1">
                    Pillar 03
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-2">
                    Protected Reserves Vault
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    Lock away semester exam fees, hostel rent, and emergency cash so you don't accidentally spend them on daily snacks.
                  </p>
                </div>

                {/* Micro Visual Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-[#059669]" />
                      Semester Exam Fee
                    </span>
                    <span className="font-mono font-bold text-slate-900">₹5,000</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span>Safe Daily UPI Spend:</span>
                    <span className="font-mono font-bold text-[#059669]">₹140 / day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: REAL CAMPUS COMPARISON (WITHOUT VS WITH FENNO) */}
        <section
          aria-label="Student Comparison"
          className="py-16 sm:py-24 bg-white scroll-mt-16"
          id="how-it-works"
        >
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-[#059669] font-extrabold block mb-2">
                Why Students Love Fenno
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                No spreadsheets. No guesswork.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Without Fenno Card */}
              <div className="p-7 rounded-3xl bg-rose-50/50 border border-rose-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                      Without Fenno
                    </span>
                  </div>
                  <ul className="flex flex-col gap-3.5 text-xs sm:text-sm text-slate-700 font-medium">
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>Spending wildly in the first 10 days, eating Maggi for the rest of the month.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>Lending ₹500 to classmates and awkwardly forgetting who owes what.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>Accidentally spending your exam or hostel fee on weekend fast food.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* With Fenno Card */}
              <div className="p-7 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <span className="text-xs font-bold text-[#059669] uppercase tracking-wider">
                      With Fenno
                    </span>
                  </div>
                  <ul className="flex flex-col gap-3.5 text-xs sm:text-sm text-slate-800 font-medium">
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#059669] shrink-0 font-bold mt-0.5" />
                      <span>An exact safe daily spend updated every morning based on days left.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#059669] shrink-0 font-bold mt-0.5" />
                      <span>1-tap split records so you always get your borrowed money back.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#059669] shrink-0 font-bold mt-0.5" />
                      <span>Locked savings vault keeps fee money safely separated from food cash.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: STUDENT FAQ ACCORDION */}
        <section
          aria-label="Frequently Asked Questions"
          className="py-16 sm:py-20 bg-slate-50/50 border-t border-slate-200/70 scroll-mt-16"
          id="faq"
        >
          <div className="max-w-3xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-mono uppercase tracking-widest text-[#059669] font-extrabold block mb-2">
                Questions & Answers
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Clear answers for smart students.
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-[#059669] transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-[#059669]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: CRISP CLOSING BANNER */}
        <section
          aria-label="Call to Action"
          className="py-16 sm:py-20 bg-white border-t border-slate-200/80"
          id="closing-cta-section"
        >
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <div className="bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-200/70 rounded-3xl p-8 sm:p-12 shadow-lg shadow-emerald-500/5 flex flex-col items-center">
              <span className="p-3 bg-emerald-100/70 text-[#059669] rounded-2xl mb-4">
                <Sparkles className="h-6 w-6 stroke-[2.5]" />
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                Make every rupee count this semester.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-8 font-medium">
                Free for students. Set up your monthly allowance in 60 seconds.
              </p>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-extrabold text-white bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-emerald-600/25 cursor-pointer group"
                  id="closing-go-dashboard-btn"
                >
                  <span>Go to Your Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openSignupModal}
                  className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-extrabold text-white bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-emerald-600/25 cursor-pointer group"
                  id="closing-get-started-btn"
                >
                  <span>Get Started with Fenno</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 6: PROPER MODERN FINTECH FOOTER */}
      <footer
        className="py-14 bg-slate-50 text-slate-700 border-t border-slate-200/80"
        id="landing-footer"
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-200/80">
            {/* Col 1: Brand & Mission */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <FennoLogoMark variant="emerald" className="h-7 w-7 shrink-0" />
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-sans">
                  Fenno
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Smart, private money management built specifically for college students balancing UPI and campus life.
              </p>
              <div className="text-[11px] font-mono text-[#059669] font-bold mt-1">
                ✦ 100% Student Free
              </div>
            </div>

            {/* Col 2: Product Features */}
            <div className="flex flex-col gap-2.5 text-xs">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Product
              </span>
              <a href="#calculator" className="text-slate-600 hover:text-[#059669] transition-colors">
                Daily Safe Spend Calculator
              </a>
              <a href="#features" className="text-slate-600 hover:text-[#059669] transition-colors">
                Dynamic Burn Pace
              </a>
              <a href="#features" className="text-slate-600 hover:text-[#059669] transition-colors">
                Friend Split & Peer Dues
              </a>
              <a href="#features" className="text-slate-600 hover:text-[#059669] transition-colors">
                Protected Reserves Vault
              </a>
            </div>

            {/* Col 3: Privacy & Security */}
            <div className="flex flex-col gap-2.5 text-xs">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Trust & Security
              </span>
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                Zero Bank Passwords Needed
              </span>
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                Local-First Private Storage
              </span>
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                No Third-Party Ad Trackers
              </span>
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                Private 4-Digit PIN Lock
              </span>
            </div>

            {/* Col 4: Quick Actions */}
            <div className="flex flex-col gap-2.5 text-xs">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Quick Access
              </span>
              {isAuthenticated ? (
                <Link to="/dashboard" className="text-[#059669] font-bold hover:underline">
                  Open Your Dashboard →
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="text-left text-slate-600 hover:text-[#059669] transition-colors cursor-pointer"
                  >
                    Sign In to Account
                  </button>
                  <button
                    type="button"
                    onClick={openSignupModal}
                    className="text-left text-slate-600 hover:text-[#059669] transition-colors cursor-pointer"
                  >
                    Create Free Student Account
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="text-left text-[#059669] font-bold hover:underline cursor-pointer"
                  >
                    Launch Instant Demo Mode →
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <span>
              © 2026 Fenno. Designed with pride for campus students.
            </span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-[#059669] transition-colors cursor-pointer font-bold flex items-center gap-1"
                id="footer-back-to-top-btn"
              >
                <span>Back to top</span>
                <span>↑</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* REFINED LIGHT AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          id="auth-modal"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-200"
            id="auth-modal-content"
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close modal"
              id="auth-modal-close-btn"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <FennoLogoMark variant="emerald" className="h-7 w-7 shrink-0" />
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Fenno
              </span>
            </div>

            {/* Auth Switcher Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthType("login");
                  setStep("email");
                  setAuthError(null);
                }}
                className={`flex-1 pb-3 text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                  authType === "login"
                    ? "border-[#059669] text-[#059669] font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                id="modal-login-tab"
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
                className={`flex-1 pb-3 text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                  authType === "signup"
                    ? "border-[#059669] text-[#059669] font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                id="modal-signup-tab"
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            {/* Step 1: Email Form */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#059669] focus:bg-white text-sm text-slate-900 rounded-xl outline-none transition-colors placeholder:text-slate-400"
                    placeholder="student@example.com"
                    autoFocus
                    required
                    id="modal-email-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-1 py-3 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] text-white text-sm font-extrabold rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  id="modal-continue-email-btn"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Continue with Email"
                  )}
                </button>

                {/* Direct Access Helpers */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleTrishthaLogin}
                    className="w-full py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                    id="modal-trishtha-btn"
                  >
                    <span>✨ Direct Access: trishtha97@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full py-2.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-center cursor-pointer"
                    id="modal-demo-btn"
                  >
                    ⚡ Instant Demo Account (demo@spendsmart.com)
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Signup Details Form */}
            {step === "signup-details" && (
              <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#059669] focus:bg-white text-sm text-slate-900 rounded-xl outline-none transition-colors placeholder:text-slate-400"
                    placeholder="student@example.com"
                    required
                    id="modal-signup-email-input"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#059669] focus:bg-white text-sm text-slate-900 rounded-xl outline-none transition-colors placeholder:text-slate-400"
                    placeholder="Alex Johnson"
                    autoFocus
                    required
                    id="modal-signup-name-input"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#059669] focus:bg-white text-sm text-slate-900 rounded-xl outline-none transition-colors placeholder:text-slate-400"
                    placeholder="+91 98765 43210"
                    id="modal-signup-phone-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-3 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] text-white text-sm font-extrabold rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  id="modal-signup-submit-btn"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending Verification Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            )}

            {/* Step 3: OTP Verification Form */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <div className="text-xs text-slate-600 leading-relaxed">
                  We've sent a 6-digit verification code to <strong className="text-slate-900 font-bold">{email}</strong>.
                  {email === "demo@spendsmart.com" ||
                  email === "student@example.com" ||
                  email === "trishtha97@gmail.com" ||
                  email === "trishlaprajapati07@gmail.com" ? (
                    <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium text-xs">
                      Quick Access: Enter OTP <strong className="font-mono text-sm text-emerald-900">123456</strong> (Auto-filled)
                    </div>
                  ) : devOtp ? (
                    <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium text-xs">
                      Localhost Dev Mode: OTP code is <strong className="font-mono text-sm">{devOtp}</strong> (Auto-filled)
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Verification Code (OTP)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2.5 text-center tracking-widest font-mono font-bold text-xl bg-slate-50 border border-slate-200 focus:border-[#059669] focus:bg-white rounded-xl outline-none text-slate-900 transition-colors"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    required
                    id="modal-otp-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-1 py-3 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] text-white text-sm font-extrabold rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  id="modal-otp-verify-btn"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying OTP...
                    </>
                  ) : (
                    "Verify & Proceed to Fenno"
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
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
