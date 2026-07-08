import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Search, 
  ArrowRight, 
  Layers, 
  Zap, 
  AlertCircle, 
  Undo2, 
  CheckCircle, 
  HelpCircle, 
  Code, 
  Database, 
  Lock, 
  PieChart, 
  DollarSign, 
  Calendar,
  BookOpen
} from "lucide-react";
import { Trie } from "../lib/dsa";

interface MockTransaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trieTime, setTrieTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"trie" | "mergesort" | "stack" | "queue" | "binary">("trie");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isAutoTyping, setIsAutoTyping] = useState(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [progressWidth, setProgressWidth] = useState("0%");

  // Trie Search simulation
  const [mockExpenses] = useState<MockTransaction[]>([
    { id: "1", description: "Campus Cafeteria Lunch", category: "food", amount: 12.50, date: "2026-07-06" },
    { id: "2", description: "City Bus Ticket", category: "transport", amount: 2.75, date: "2026-07-05" },
    { id: "3", description: "Algorithms Textbook", category: "education", amount: 85.00, date: "2026-07-04" },
    { id: "4", description: "Late Night Snacks", category: "food", amount: 4.20, date: "2026-07-04" },
    { id: "5", description: "Gym Monthly Membership", category: "health", amount: 20.00, date: "2026-07-03" },
    { id: "6", description: "Matcha Bubble Tea", category: "food", amount: 6.50, date: "2026-07-02" },
    { id: "7", description: "Uber Ride back to Dorm", category: "transport", amount: 14.00, date: "2026-07-01" },
    { id: "8", description: "Friday Movie Night Ticket", category: "entertainment", amount: 11.00, date: "2026-06-30" },
  ]);

  const mockTrie = useRef(new Trie<MockTransaction>());

  // Build the Trie on mount
  useEffect(() => {
    const t = new Trie<MockTransaction>();
    mockExpenses.forEach((exp) => {
      t.insert(exp.description, exp);
      t.insert(exp.category, exp);
    });
    mockTrie.current = t;

    // Check auth status
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    // Scroll listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mockExpenses]);

  // Budget progress bar mount animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth("65%");
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Auto-typing search simulation loop
  useEffect(() => {
    if (!isAutoTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setSearchQuery("lun");
      return;
    }

    const queries = ["lun", "bus", "cof", "alg"];
    let currentQueryIdx = 0;
    let currentCharIdx = 0;
    let isDeleting = false;

    const tick = () => {
      const targetQuery = queries[currentQueryIdx];

      if (isDeleting) {
        setSearchQuery((prev) => prev.slice(0, -1));
        currentCharIdx--;
      } else {
        setSearchQuery(targetQuery.slice(0, currentCharIdx + 1));
        currentCharIdx++;
      }

      let speed = isDeleting ? 60 : 120;

      if (!isDeleting && currentCharIdx === targetQuery.length) {
        speed = 2200;
        isDeleting = true;
      } else if (isDeleting && currentCharIdx === 0) {
        isDeleting = false;
        currentQueryIdx = (currentQueryIdx + 1) % queries.length;
        speed = 600;
      }

      typingTimerRef.current = setTimeout(tick, speed);
    };

    const startTimeout = setTimeout(tick, 800);

    return () => {
      clearTimeout(startTimeout);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [isAutoTyping]);

  const [matchedExpenses, setMatchedExpenses] = useState<MockTransaction[]>(mockExpenses);

  // Compute matched expenses with timing tracking inside useEffect to avoid react re-render loops
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchedExpenses(mockExpenses);
      setTrieTime(0.01);
      return;
    }
    const start = performance.now();
    const results = mockTrie.current.search(searchQuery);
    const end = performance.now();
    setMatchedExpenses(results);
    setTrieTime(parseFloat((end - start).toFixed(4)));
  }, [searchQuery, mockExpenses]);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white text-nearblack font-sans selection:bg-navy/10 selection:text-navy transition-colors duration-200">
      
      {/* Navigation Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-sand-border py-3" 
          : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link 
            to="/" 
            onClick={scrollToTop}
            className="flex items-center gap-2.5 hover:opacity-90 group focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-xl p-1 transition-all"
            id="landing-logo-link"
          >
            <div className="h-9 w-9 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-display font-bold tracking-tight text-nearblack text-lg">SpendSmart</span>
            <span className="text-[10px] font-mono bg-navy/5 text-navy/70 px-1.5 py-0.5 rounded border border-sand-border">DSA-Core v1.2</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#why-not-excel" className="text-sm font-semibold text-nearblack/70 hover:text-navy transition-colors focus-visible:ring-2 focus-visible:ring-navy rounded px-1.5 py-0.5">Why SpendSmart</a>
            <a href="#core-features" className="text-sm font-semibold text-nearblack/70 hover:text-navy transition-colors focus-visible:ring-2 focus-visible:ring-navy rounded px-1.5 py-0.5">Features</a>
            <a href="#dsa-showcase" className="text-sm font-semibold text-nearblack/70 hover:text-navy transition-colors focus-visible:ring-2 focus-visible:ring-navy rounded px-1.5 py-0.5">Algorithms</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setIsAuthenticated(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-nearblack hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
                  id="landing-signout-btn"
                >
                  Sign Out
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-navy focus:outline-none"
                  id="landing-dashboard-btn"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-nearblack hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none"
                  id="landing-login-btn"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-navy focus:outline-none"
                  id="landing-signup-btn"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-nearblack hover:text-navy focus:outline-none p-1 focus:ring-2 focus:ring-navy rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-sand-border px-4 pt-2 pb-4 flex flex-col gap-3 shadow-md">
            <a href="#why-not-excel" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-nearblack/85 hover:text-navy py-2 border-b border-sand-border/50">Why SpendSmart</a>
            <a href="#core-features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-nearblack/85 hover:text-navy py-2 border-b border-sand-border/50">Features</a>
            <a href="#dsa-showcase" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-nearblack/85 hover:text-navy py-2 border-b border-sand-border/50">Algorithms</a>
            <div className="flex items-center justify-between gap-4 mt-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      setIsAuthenticated(false);
                      setMobileMenuOpen(false);
                      window.location.reload();
                    }}
                    className="flex-1 px-4 py-2.5 text-center text-sm font-semibold text-nearblack hover:text-navy transition-colors focus:ring-2 focus:ring-navy cursor-pointer"
                  >
                    Sign Out
                  </button>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm text-center"
                  >
                    Dashboard
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-nearblack hover:text-navy transition-colors focus:ring-2 focus:ring-navy"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section (Centered Layout, No Live Preview) */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden bg-white border-b border-sand-border">
        {/* Soft elegant glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,rgba(30,58,138,0.1),transparent_60%)]"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 border border-navy/10 text-navy text-xs font-mono font-bold uppercase tracking-widest">
            <Zap className="h-3.5 w-3.5" />
            <span>Engineered for Student Budgets</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-nearblack leading-[1.1] max-w-3xl">
            Irregular pocket money? Scholarship spikes? Finally, a tracker built for <span className="text-navy">you</span>.
          </h1>
          
          <p className="text-base sm:text-lg text-graytext leading-relaxed max-w-2xl">
            Traditional budget sheets expect regular monthly paychecks. SpendSmart was built to understand irregular allowances, plan custom budget envelopes, and search transactions instantly using custom computer science structures.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 w-full sm:w-auto">
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] text-center focus:ring-2 focus:ring-navy focus:outline-none"
            >
              {isAuthenticated ? "Go to My Workspace" : "Get Started Free"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#core-features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-nearblack bg-white border border-gray-200 hover:bg-cream rounded-lg transition-all text-center focus:ring-2 focus:ring-navy focus:outline-none shadow-sm"
            >
              Explore Core Features
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-8 sm:gap-12 md:gap-16 pt-8 border-t border-sand-border font-mono text-xs w-full max-w-lg mt-4 justify-center">
            <div>
              <span className="block text-graytext mb-0.5 uppercase tracking-wide">Query Time</span>
              <span className="text-nearblack font-bold text-sm sm:text-base">O(L) Match</span>
            </div>
            <div>
              <span className="block text-graytext mb-0.5 uppercase tracking-wide">Sorting Cost</span>
              <span className="text-nearblack font-bold text-sm sm:text-base">O(N log N)</span>
            </div>
            <div>
              <span className="block text-graytext mb-0.5 uppercase tracking-wide">Accident Shield</span>
              <span className="text-nearblack font-bold text-sm sm:text-base">Undo Stack</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison section: "Why not just use Excel" */}
      <section id="why-not-excel" className="py-20 bg-white border-b border-sand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-mono text-navy font-bold uppercase tracking-widest">WHY SPENDSMART?</span>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-nearblack">
              Why not just use a <span className="text-navy">spreadsheet</span>?
            </h2>
            <p className="text-graytext text-sm leading-relaxed">
              We asked college students who tracked budgets on Excel what broke their setups. Here is why SpendSmart feels like it is working with you, not against you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Cards (Cream background with borders on White section) */}
            <div className="bg-white border border-sand-border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center font-bold font-display text-lg">
                𝛥
              </div>
              <h3 className="font-display font-bold text-lg text-nearblack">Pocket Money Rollover</h3>
              <p className="text-xs text-graytext leading-relaxed">
                <strong className="text-nearblack block mb-1 font-mono">In Excel:</strong>
                Requires manual copying of formula cell grids every month-end, easily breaking historical balances if you make a typo.
              </p>
              <p className="text-xs text-graytext leading-relaxed border-t border-sand-border pt-3">
                <strong className="text-nearblack block mb-1 font-mono font-bold">In SpendSmart:</strong>
                Calculates rolling allowances automatically. Extra savings roll into next month's pocket money envelopes seamlessly.
              </p>
            </div>

            <div className="bg-cream/40 border border-sand-border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center font-bold font-display text-lg">
                🔍
              </div>
              <h3 className="font-display font-bold text-lg text-nearblack">Transaction Search</h3>
              <p className="text-xs text-graytext leading-relaxed">
                <strong className="text-nearblack block mb-1 font-mono">In Excel:</strong>
                Requires Linear scanning or Ctrl+F that jumps randomly across sheets without auto-complete suggestions.
              </p>
              <p className="text-xs text-graytext leading-relaxed border-t border-sand-border pt-3">
                <strong className="text-nearblack block mb-1 font-mono font-bold">In SpendSmart:</strong>
                Custom Trie Tree indexes titles and categories. Autocomplete triggers instantly with every keystroke.
              </p>
            </div>

            <div className="bg-cream/40 border border-sand-border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center font-bold font-display text-lg">
                ⚠️
              </div>
              <h3 className="font-display font-bold text-lg text-nearblack">Budget Warning Alerts</h3>
              <p className="text-xs text-graytext leading-relaxed">
                <strong className="text-nearblack block mb-1 font-mono">In Excel:</strong>
                Numbers sit silently in columns. You only notice you overspent after compiling a full week of transactions.
              </p>
              <p className="text-xs text-graytext leading-relaxed border-t border-sand-border pt-3">
                <strong className="text-nearblack block mb-1 font-mono font-bold">In SpendSmart:</strong>
                FIFO Queue processes threshold updates, alert flags trigger dynamically when category limits exceed 80%.
              </p>
            </div>

            <div className="bg-cream/40 border border-sand-border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center font-bold font-display text-lg">
                📅
              </div>
              <h3 className="font-display font-bold text-lg text-nearblack">Irregular Allowances</h3>
              <p className="text-xs text-graytext leading-relaxed">
                <strong className="text-nearblack block mb-1 font-mono">In Excel:</strong>
                Strict column matrices fail if you add a bi-weekly parental transfer or irregular bursary lump sums.
              </p>
              <p className="text-xs text-graytext leading-relaxed border-t border-sand-border pt-3">
                <strong className="text-nearblack block mb-1 font-mono font-bold">In SpendSmart:</strong>
                Add custom pocket-money logs with date-stamps. Calculations adapt to multiple top-ups in real-time.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Overview Section ("What's Inside") */}
      <section id="core-features" className="py-20 bg-white border-b border-sand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-mono text-navy font-bold uppercase tracking-widest">CORE FEATURES</span>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-nearblack">
              Dashboard Modules Engineered for <span className="text-navy">Students</span>
            </h2>
            <p className="text-graytext text-sm leading-relaxed">
              We skipped the corporate fluff. SpendSmart gives you four high-speed workspace views configured around college budgets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature Cards (White background with soft border/shadow) */}
            <div className="bg-white border border-sand-border/80 p-6 rounded-2xl flex gap-5 items-start hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-display font-bold text-lg text-nearblack">Pocket Money Dashboard</h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Monitor allowances, active expenditure rings, and category spending lists dynamically on a soft light canvas with immediate stats.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-graytext font-mono mt-1">
                  <span>Stack State: Auto-Saved</span>
                  <span>•</span>
                  <span>Update: Instant</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-sand-border/80 p-6 rounded-2xl flex gap-5 items-start hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center shrink-0">
                <Search className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-display font-bold text-lg text-nearblack">Trie-Powered History List</h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Look up meals, book buying, and transport fees instantly while typing. Filter by category groups or exact date boundaries in real-time.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-graytext font-mono mt-1">
                  <span>Search complexity: O(L)</span>
                  <span>•</span>
                  <span>Interactive autocomplete</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-sand-border/80 p-6 rounded-2xl flex gap-5 items-start hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-display font-bold text-lg text-nearblack">Pocket Envelope Budgets</h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Set aside limits for food, books, study, or travel, and review progress rings that visually empty or fill depending on active entries.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-graytext font-mono mt-1">
                  <span>Envelopes supported: 8 max</span>
                  <span>•</span>
                  <span>Proactive warnings</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-sand-border/80 p-6 rounded-2xl flex gap-5 items-start hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center shrink-0">
                <PieChart className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-display font-bold text-lg text-nearblack">Analytics Reports</h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Understand where your pocket money vanishes with clean distribution charts and saving trackers automatically compiled over past months.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-graytext font-mono mt-1">
                  <span>Compilation logic: O(N)</span>
                  <span>•</span>
                  <span>Interactive charts</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* Final Call to Action Section */}
      <section className="py-20 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(30,58,138,0.04),transparent_50%)] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Card Wrapper (White background on White section) */}
          <div className="bg-white border border-sand-border/80 p-8 md:p-12 rounded-3xl flex flex-col items-center gap-6 shadow-lg relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-navy"></div>
            
            <div className="h-12 w-12 rounded-2xl bg-navy/5 border border-navy/10 text-navy flex items-center justify-center font-bold text-xl font-display">
              S
            </div>

            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-nearblack">
              Ready to master your pocket <span className="text-navy">money</span>?
            </h2>

            <p className="text-graytext text-sm max-w-lg leading-relaxed">
              No complex financial setups. No spreadsheets with broken cells. Just clean, high-speed DSA-powered budget tracking tailored for college students.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2 w-full sm:w-auto">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-navy focus:outline-none"
                >
                  Go to Dashboard Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-navy hover:bg-navy-hover rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-navy focus:outline-none"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-nearblack bg-white border border-gray-200 hover:bg-cream rounded-lg transition-all focus:ring-2 focus:ring-navy focus:outline-none shadow-sm"
                  >
                    Log In to Existing Account
                  </Link>
                </>
              )}
            </div>

            <span className="text-[10px] text-nearblack/40 font-mono mt-4">
              SpendSmart does not upload your sensitive financial details. All data backed up locally and securely.
            </span>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-sand-border text-center font-mono text-[11px] text-graytext">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-nearblack text-sm">SpendSmart</span>
            <span>•</span>
            <span>DSA-based Student Wallet Organizer</span>
          </div>
          <div>
            <span>Developed for College CS Projects &amp; Real-world Utility © 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

