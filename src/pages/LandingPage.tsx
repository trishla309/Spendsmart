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

  // Trie Search simulation
  const mockTrie = useRef(new Trie<MockTransaction>());
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
  }, [mockExpenses]);

  // Compute matched expenses with timing tracking
  const getMatches = () => {
    if (!searchQuery.trim()) return mockExpenses;
    const start = performance.now();
    const results = mockTrie.current.search(searchQuery);
    const end = performance.now();
    // Simulate real timing on small list, adding microscopic micro-seconds resolution
    if (trieTime === 0 || Math.random() > 0.7) {
      setTrieTime(parseFloat((end - start).toFixed(4)));
    }
    return results;
  };

  const matchedExpenses = getMatches();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2.5 hover:opacity-90 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-xl p-1 transition-all"
            id="landing-logo-link"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-sans font-bold tracking-tight text-gray-100 text-lg group-hover:text-emerald-400 transition-colors">SpendSmart</span>
            <span className="text-[10px] font-mono bg-gray-800/80 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700/50">DSA-Core v1.2</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#why-not-excel" className="text-sm font-medium text-gray-400 hover:text-gray-100 focus:text-gray-100 focus:outline-none focus:underline decoration-emerald-500 transition-colors">Why SpendSmart</a>
            <a href="#dashboard-preview" className="text-sm font-medium text-gray-400 hover:text-gray-100 focus:text-gray-100 focus:outline-none focus:underline decoration-emerald-500 transition-colors">Live Preview</a>
            <a href="#core-features" className="text-sm font-medium text-gray-400 hover:text-gray-100 focus:text-gray-100 focus:outline-none focus:underline decoration-emerald-500 transition-colors">Features</a>
            <a href="#dsa-showcase" className="text-sm font-medium text-gray-400 hover:text-gray-100 focus:text-gray-100 focus:outline-none focus:underline decoration-emerald-500 transition-colors">Algorithms</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setIsAuthenticated(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-gray-100 hover:bg-gray-900 rounded-xl transition-colors focus:ring-2 focus:ring-gray-850 focus:outline-none cursor-pointer"
                  id="landing-signout-btn"
                >
                  Sign Out
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
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
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-gray-100 hover:bg-gray-900 rounded-xl transition-colors focus:ring-2 focus:ring-gray-800 focus:outline-none"
                  id="landing-login-btn"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  id="landing-signup-btn"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 border-b border-gray-800">
        {/* Ambient Glow background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_60%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                <span>Engineered for Student Budgets</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-100 leading-[1.15]">
                Irregular pocket money? <span className="text-emerald-400 block sm:inline">Scholarship spikes?</span> Finally, a tracker built for you.
              </h1>
              
              <p className="text-base text-gray-400 leading-relaxed max-w-lg">
                Traditional budget sheets expect regular monthly paychecks. SpendSmart was built to understand irregular allowances, plan custom budget envelopes, and search transactions instantly using custom computer science structures.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xl hover:shadow-emerald-500/15 text-center focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                >
                  {isAuthenticated ? "Go to My Workspace" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a
                  href="#dashboard-preview"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-gray-300 hover:text-gray-100 bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 rounded-xl transition-all text-center focus:ring-2 focus:ring-gray-800 focus:outline-none"
                >
                  Try Trie Search Live
                </a>
              </div>

              {/* Little stats strip */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-850/80 font-mono text-xs">
                <div>
                  <span className="block text-gray-500">Query Time</span>
                  <span className="text-gray-200 font-bold text-sm">O(L) Match</span>
                </div>
                <div>
                  <span className="block text-gray-500">Sorting Cost</span>
                  <span className="text-gray-200 font-bold text-sm">O(N log N)</span>
                </div>
                <div>
                  <span className="block text-gray-500">Accident Shield</span>
                  <span className="text-gray-200 font-bold text-sm">Undo Stack</span>
                </div>
              </div>
            </div>

            {/* Hero Right Content - Live Interactive Dashboard Preview */}
            <div id="dashboard-preview" className="lg:col-span-7 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-2xl filter blur-xl opacity-50"></div>
              
              <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-left">
                {/* Simulated App Header */}
                <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30"></span>
                    </div>
                    <span className="text-xs font-mono text-gray-500 ml-2">SpendSmart Dashboard Mockup</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    Active Session Simulation
                  </span>
                </div>

                {/* Dashboard Inner Workspace */}
                <div className="p-4 sm:p-6 flex flex-col gap-5">
                  
                  {/* Row 1: Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-850">
                      <span className="text-[10px] font-mono text-gray-500 block uppercase">Pocket Money Left</span>
                      <span className="text-base sm:text-lg font-bold text-emerald-400">$215.15</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">out of $350.00</span>
                    </div>
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-850">
                      <span className="text-[10px] font-mono text-gray-500 block uppercase">Spent this Month</span>
                      <span className="text-base sm:text-lg font-bold text-gray-200">$134.85</span>
                      <span className="text-[9px] text-emerald-400 block mt-0.5">38.5% of allowance</span>
                    </div>
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-850">
                      <span className="text-[10px] font-mono text-gray-500 block uppercase">Active Budgets</span>
                      <span className="text-base sm:text-lg font-bold text-gray-200">3 Categories</span>
                      <div className="h-1 w-full bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Live Interactive Trie Playground */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5 text-emerald-400" />
                          Try Instant Trie Search
                        </h4>
                        <p className="text-[10px] text-gray-500">Type description prefixes like "lunc", "bus", "alg", or categories like "food"</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-850 px-2 py-0.5 rounded-md self-start">
                        Query: <span className="text-emerald-400 font-bold">{trieTime === 0 ? "0.01" : trieTime}ms</span>
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search mockup transactions..."
                        className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none font-semibold placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/30"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300 font-mono"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Filtered list output */}
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {matchedExpenses.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-500 font-mono">
                          Trie lookup: 0 nodes matched "{searchQuery}"
                        </div>
                      ) : (
                        matchedExpenses.slice(0, 3).map((exp) => (
                          <div 
                            key={exp.id} 
                            className="flex items-center justify-between p-2 bg-gray-900/60 rounded-lg border border-gray-850/60 hover:border-gray-800 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-md bg-gray-850 text-[10px] font-bold text-gray-300 flex items-center justify-center uppercase">
                                {exp.category[0]}
                              </span>
                              <div>
                                <span className="text-[11px] font-semibold text-gray-200 block leading-tight">{exp.description}</span>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{exp.category}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-gray-200 block">${exp.amount.toFixed(2)}</span>
                              <span className="text-[9px] text-gray-500">{exp.date}</span>
                            </div>
                          </div>
                        ))
                      )}
                      {matchedExpenses.length > 3 && (
                        <span className="text-[9px] font-mono text-gray-500 text-center mt-1">
                          + {matchedExpenses.length - 3} more transactions indexed in current Trie node matches
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison section: "Why not just use Excel" */}
      <section id="why-not-excel" className="py-20 bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">A Modern Student Upgrade</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-100">
              Why not just use a spreadsheet?
            </h2>
            <p className="text-gray-400 text-sm">
              We asked college students who tracked budgets on Excel what broke their setups. Here is why SpendSmart feels like it is working with you, not against you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold">
                𝛥
              </div>
              <h3 className="font-bold text-lg text-gray-100">Pocket Money Rollover</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300 block mb-1 font-mono">In Excel:</strong>
                Requires manual copying of formula cell grids every month-end, easily breaking historical balances if you make a typo.
              </p>
              <p className="text-xs text-emerald-400 leading-relaxed border-t border-gray-850/80 pt-3">
                <strong className="text-emerald-400 block mb-1 font-mono">In SpendSmart:</strong>
                Calculates rolling allowances automatically. Extra savings roll into next month's pocket money envelopes seamlessly.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
                🔍
              </div>
              <h3 className="font-bold text-lg text-gray-100">Transaction Search</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300 block mb-1 font-mono">In Excel:</strong>
                Requires Linear scanning or Ctrl+F that jumps randomly across sheets without auto-complete suggestions.
              </p>
              <p className="text-xs text-emerald-400 leading-relaxed border-t border-gray-850/80 pt-3">
                <strong className="text-emerald-400 block mb-1 font-mono">In SpendSmart:</strong>
                Custom Trie Tree indexes titles and categories. Autocomplete triggers instantly with every keystroke.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <h3 className="font-bold text-lg text-gray-100">Budget Warning Alerts</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300 block mb-1 font-mono">In Excel:</strong>
                Numbers sit silently in columns. You only notice you overspent after compiling a full week of transactions.
              </p>
              <p className="text-xs text-emerald-400 leading-relaxed border-t border-gray-850/80 pt-3">
                <strong className="text-emerald-400 block mb-1 font-mono">In SpendSmart:</strong>
                FIFO Queue processes threshold updates, alert flags trigger dynamically when category limits exceed 80%.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                📅
              </div>
              <h3 className="font-bold text-lg text-gray-100">Irregular Allowances</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300 block mb-1 font-mono">In Excel:</strong>
                Strict column matrices fail if you add a bi-weekly parental transfer or irregular bursary lump sums.
              </p>
              <p className="text-xs text-emerald-400 leading-relaxed border-t border-gray-850/80 pt-3">
                <strong className="text-emerald-400 block mb-1 font-mono">In SpendSmart:</strong>
                Add custom pocket-money logs with date-stamps. Calculations adapt to multiple top-ups in real-time.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Overview Section */}
      <section id="core-features" className="py-20 bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">Explore the App</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-100">
              Dashboard Modules Engineered for Students
            </h2>
            <p className="text-gray-400 text-sm">
              We skipped the corporate fluff. SpendSmart gives you four high-speed workspace views configured around college budgets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1: Dashboard Home */}
            <div className="bg-gray-950 border border-gray-850 p-6 rounded-2xl flex gap-5 items-start hover:border-gray-800 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-bold text-lg text-gray-100">Pocket Money Dashboard</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Monitor allowances, active expenditure rings, and category spending lists dynamically on a soft dark canvas with immediate stats.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono mt-1">
                  <span>Stack State: Auto-Saved</span>
                  <span>•</span>
                  <span>Update: Instant</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Transaction History with Trie Search */}
            <div className="bg-gray-950 border border-gray-850 p-6 rounded-2xl flex gap-5 items-start hover:border-gray-800 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Search className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-bold text-lg text-gray-100">Trie-Powered History List</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Look up meals, book buying, and transport fees instantly while typing. Filter by category groups or exact date boundaries in real-time.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono mt-1">
                  <span>Search complexity: O(L)</span>
                  <span>•</span>
                  <span>Interactive autocomplete</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Budget Planning & Envelopes */}
            <div className="bg-gray-950 border border-gray-850 p-6 rounded-2xl flex gap-5 items-start hover:border-gray-800 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-bold text-lg text-gray-100">Pocket Envelope Budgets</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Set aside limits for food, books, study, or travel, and review progress rings that visually empty or fill depending on active entries.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono mt-1">
                  <span>Envelopes supported: 8 max</span>
                  <span>•</span>
                  <span>Proactive warnings</span>
                </div>
              </div>
            </div>

            {/* Feature 4: Analytics and Reports */}
            <div className="bg-gray-950 border border-gray-850 p-6 rounded-2xl flex gap-5 items-start hover:border-gray-800 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <PieChart className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <h3 className="font-bold text-lg text-gray-100">Analytics Reports</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Understand where your pocket money vanishes with clean distribution charts and saving trackers automatically compiled over past months.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono mt-1">
                  <span>Compilation logic: O(N)</span>
                  <span>•</span>
                  <span>Interactive charts</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Under the Hood: "Built with real Data Structures & Algorithms" Section */}
      <section id="dsa-showcase" className="py-20 bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">Technical Integrity</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-100">
              Built with Real Data Structures &amp; Algorithms
            </h2>
            <p className="text-gray-400 text-sm">
              We took our college computer science concepts and applied them to build a robust, lag-free dashboard. Here are the five DSA systems powering your account.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Algorithm selector left menu */}
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <button
                onClick={() => setActiveTab("trie")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                  activeTab === "trie"
                    ? "bg-gray-900 border-emerald-500/30 text-gray-100 shadow-md"
                    : "bg-transparent border-transparent text-gray-400 hover:bg-gray-900/40 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">01.</span>
                  <span className="font-semibold text-sm">Trie (Prefix Tree)</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("mergesort")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                  activeTab === "mergesort"
                    ? "bg-gray-900 border-emerald-500/30 text-gray-100 shadow-md"
                    : "bg-transparent border-transparent text-gray-400 hover:bg-gray-900/40 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">02.</span>
                  <span className="font-semibold text-sm">Merge Sort (Recursive)</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("stack")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                  activeTab === "stack"
                    ? "bg-gray-900 border-emerald-500/30 text-gray-100 shadow-md"
                    : "bg-transparent border-transparent text-gray-400 hover:bg-gray-900/40 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">03.</span>
                  <span className="font-semibold text-sm">Undo Delete (LIFO Stack)</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("queue")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                  activeTab === "queue"
                    ? "bg-gray-900 border-emerald-500/30 text-gray-100 shadow-md"
                    : "bg-transparent border-transparent text-gray-400 hover:bg-gray-900/40 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">04.</span>
                  <span className="font-semibold text-sm">Notification Queue (FIFO)</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveTab("binary")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                  activeTab === "binary"
                    ? "bg-gray-900 border-emerald-500/30 text-gray-100 shadow-md"
                    : "bg-transparent border-transparent text-gray-400 hover:bg-gray-900/40 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-bold">05.</span>
                  <span className="font-semibold text-sm">Binary Search on Dates</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Algorithm Details Visual Frame */}
            <div className="lg:col-span-8 bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 h-44 w-44 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.5),transparent_70%)]"></div>
              
              {activeTab === "trie" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Complexity: O(L)</span>
                    <span className="text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700/50 px-2 py-0.5 rounded-full font-semibold">Location: src/lib/dsa.ts</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">The Trie Prefix Tree</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Instead of a linear search loops that scan through hundreds of transactions over and over, our search engine index descriptions and category names by inserting words into characters of an explicit Trie tree. Autocomplete occurs by walking children pointers, locating matches in exact <strong>O(L)</strong> time.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-[10px] text-gray-400 flex flex-col gap-2 mt-2">
                    <div className="text-emerald-400 font-bold">// Visual Representation of Search Trie for "Lunch" &amp; "Late"</div>
                    <div className="flex flex-col gap-1 pl-2">
                      <div>[root]</div>
                      <div className="pl-4">└── 'l'</div>
                      <div className="pl-8">└── 'u' → 'n' → 'c' → 'h' <span className="text-emerald-400">(Item: Campus Cafeteria Lunch)</span></div>
                      <div className="pl-8">└── 'a' → 't' → 'e' <span className="text-emerald-400">(Item: Late Night Snacks)</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "mergesort" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Complexity: O(N log N)</span>
                    <span className="text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700/50 px-2 py-0.5 rounded-full font-semibold">Location: src/lib/dsa.ts</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">Recursive Merge Sort Engine</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    V8's built-in JavaScript `Array.prototype.sort()` does not guarantee a stable sort order or strict performance across different browser engines. We wrote our own recursive <strong>Merge Sort</strong> that recursively splits, sorts, and merges transactions. It is guaranteed to run in <strong>O(N log N)</strong> time, protecting stability so original relative orders are preserved when grouping.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-[10px] text-gray-400 flex flex-col gap-2 mt-2">
                    <div className="text-emerald-400 font-bold">// Divide and Conquer Sorting Routine</div>
                    <div className="flex flex-col gap-1 pl-2">
                      <div>[85.00, 2.75, 12.50, 4.20]</div>
                      <div className="pl-4">├── Split: [85.00, 2.75]  &amp;  [12.50, 4.20]</div>
                      <div className="pl-8">├── Sort/Merge: [2.75, 85.00]  &amp;  [4.20, 12.50]</div>
                      <div className="pl-4">└── Final Recursive Merge: [2.75, 4.20, 12.50, 85.00]</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "stack" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Complexity: O(1) Undo</span>
                    <span className="text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700/50 px-2 py-0.5 rounded-full font-semibold">Location: src/lib/dsa.ts</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">The Undo Delete Stack</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Accidentally tapped delete on a lunch entry you spent half an hour trying to balance? SpendSmart logs deleted expenses into an active Last-In, First-Out (LIFO) <strong>Stack</strong> structure. When you trigger "Undo Delete", the engine simply pops the top element from the memory Stack and returns it instantly in <strong>O(1)</strong> time.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-[10px] text-gray-400 flex flex-col gap-2 mt-2">
                    <div className="text-emerald-400 font-bold">// LIFO Memory Stack Operations</div>
                    <div className="flex flex-col gap-1 pl-2">
                      <div>[Top of Stack] → [Deleted: Bus Ticket $2.75]</div>
                      <div className="pl-16">→ [Deleted: Gym Membership $20.00]</div>
                      <div className="pl-16">→ [Deleted: Cafeteria Lunch $12.50]</div>
                      <div className="text-emerald-400 mt-1">&gt; Pop Action: Restores "Bus Ticket $2.75" back into database instantly.</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "queue" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Complexity: O(1) Queue</span>
                    <span className="text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700/50 px-2 py-0.5 rounded-full font-semibold">Location: src/server/notificationQueue.ts</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">Notification Alert Queue</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Budget warning toasts and daily summaries must be evaluated sequentially so alerts do not stack on top of each other and lock the UI thread. We built an explicit First-In, First-Out (FIFO) <strong>Queue</strong>. Updates enter the tail of the queue and are processed at the head of the queue one by one.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-[10px] text-gray-400 flex flex-col gap-2 mt-2">
                    <div className="text-emerald-400 font-bold">// FIFO Processing Loop</div>
                    <div className="flex gap-2 items-center pl-2">
                      <span className="bg-gray-900 border border-gray-850 p-1.5 rounded text-[9px] text-emerald-400">[Head: Warn: Food budget over 80%]</span>
                      <span className="text-emerald-400">←</span>
                      <span className="bg-gray-900 border border-gray-850 p-1.5 rounded text-[9px] text-gray-400">[Middle: Save Completed]</span>
                      <span className="text-emerald-400">←</span>
                      <span className="bg-gray-900 border border-gray-850 p-1.5 rounded text-[9px] text-gray-400">[Tail: Info: Allowance received]</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "binary" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Complexity: O(log N) Search</span>
                    <span className="text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700/50 px-2 py-0.5 rounded-full font-semibold">Location: src/pages/TransactionHistory.tsx</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">Logarithmic Binary Search on Dates</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    When you narrow down transactions between two dates, iterating and checking every transaction individually is slow. Since the transaction array is already sorted via our Merge Sort algorithm, we use <strong>Binary Search</strong> to query the index boundaries. It pinpoints the range in <strong>O(log N)</strong> steps, even when selected filters fall between transaction gaps.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-[10px] text-gray-400 flex flex-col gap-2 mt-2">
                    <div className="text-emerald-400 font-bold">// Date Range Bound Discovery (log N queries)</div>
                    <div className="flex flex-col gap-1 pl-2">
                      <div>Target Date Start: "2026-07-03" | Array size: 128 items</div>
                      <div>Query 1: Mid index 64 ("2026-07-05") &gt; Target &rarr; Search Left half [0..63]</div>
                      <div>Query 2: Mid index 32 ("2026-07-02") &lt; Target &rarr; Search Right half [33..63]</div>
                      <div>Query 3: Mid index 48 ("2026-07-03") &rarr; Exactly matched index 48! Bound acquired in 3 steps instead of 128 checks.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Back to CTA link */}
              <div className="border-t border-gray-850/80 pt-4 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">SpendSmart Engineering Lab</span>
                <Link
                  to={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 focus:underline focus:outline-none"
                >
                  Create Account to Test Under-the-Hood Algorithms
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="bg-gray-900 border border-gray-800 p-8 md:p-12 rounded-3xl flex flex-col items-center gap-6 shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-emerald-500/20"></div>
            
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
              S
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-100">
              Ready to master your pocket money?
            </h2>

            <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
              No complex financial setups. No spreadsheets with broken cells. Just clean, high-speed DSA-powered budget tracking tailored for college students.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2 w-full sm:w-auto">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xl hover:shadow-emerald-500/15 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                >
                  Go to Dashboard Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xl hover:shadow-emerald-500/15 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-300 hover:text-gray-100 bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 rounded-xl transition-all focus:ring-2 focus:ring-gray-800 focus:outline-none"
                  >
                    Log In to Existing Account
                  </Link>
                </>
              )}
            </div>

            <span className="text-[10px] text-gray-500 font-mono mt-4">
              SpendSmart does not upload your sensitive financial details. All data backed up locally and securely.
            </span>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 border-t border-gray-900 text-center font-mono text-[11px] text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-gray-500">SpendSmart</span>
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

// ChevronRight miniature component since it's used inside the buttons
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      className={props.className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
