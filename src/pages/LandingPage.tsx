import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cream text-nearblack font-sans selection:bg-navy/15 selection:text-navy">
      
      {/* Navigation Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-cream/95 backdrop-blur-md border-b border-sand-border py-4" 
          : "bg-cream py-6 border-b border-sand-border/60"
      }`}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link 
            to="/" 
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity focus:outline-none"
            id="landing-logo-link"
          >
            <div className="h-8 w-8 rounded-lg bg-navy text-white flex items-center justify-center font-display font-semibold text-base">
              S
            </div>
            <span className="font-display font-medium tracking-tight text-nearblack text-xl">SpendSmart</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-nearblack/80">
            <a href="#problem" className="hover:text-navy transition-colors">The Problem</a>
            <a href="#capabilities" className="hover:text-navy transition-colors">Capabilities</a>
            <a href="#ledger" className="hover:text-navy transition-colors">Architecture</a>
          </nav>

          <div className="hidden md:flex items-center gap-5">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setIsAuthenticated(false);
                    window.location.reload();
                  }}
                  className="text-sm font-normal text-nearblack/80 hover:text-navy transition-colors cursor-pointer"
                  id="landing-signout-btn"
                >
                  Sign Out
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-navy hover:bg-navy-hover rounded-md transition-all shadow-xs"
                  id="landing-dashboard-btn"
                >
                  Workspace
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-normal text-nearblack/80 hover:text-navy transition-colors"
                  id="landing-login-btn"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-navy hover:bg-navy-hover rounded-md transition-all shadow-xs"
                  id="landing-signup-btn"
                >
                  Open Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-nearblack hover:text-navy focus:outline-none p-1.5"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cream border-b border-sand-border px-6 pt-3 pb-5 flex flex-col gap-3">
            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="text-sm text-nearblack/80 py-2 border-b border-sand-border/50">The Problem</a>
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="text-sm text-nearblack/80 py-2 border-b border-sand-border/50">Capabilities</a>
            <a href="#ledger" onClick={() => setMobileMenuOpen(false)} className="text-sm text-nearblack/80 py-2 border-b border-sand-border/50">Architecture</a>
            <div className="flex items-center gap-3 pt-2">
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
                    className="flex-1 py-2 text-center text-sm border border-sand-border rounded-md"
                  >
                    Sign Out
                  </button>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center text-sm font-medium text-white bg-navy rounded-md"
                  >
                    Workspace
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center text-sm border border-sand-border rounded-md"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center text-sm font-medium text-white bg-navy rounded-md"
                  >
                    Open Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Editorial Hero Section (Asymmetric layout + Abstract Structural Visual) */}
      <section className="bg-cream pt-16 pb-24 md:pt-24 md:pb-32 border-b border-sand-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Typographic Editorial Hero */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="text-xs font-mono tracking-widest uppercase text-graytext mb-5">
                LEDGER ARCHITECTURE FOR STUDENTS
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-normal text-nearblack tracking-tight leading-[1.08] mb-6">
                Clear financial records for variable allowances.
              </h1>

              <p className="text-base sm:text-lg text-graytext leading-relaxed font-normal max-w-xl mb-10">
                Most student income arrives irregularly—term transfers, family allowances, or bursary disbursements. SpendSmart maintains an explicit balance ledger without requiring monthly spreadsheet maintenance.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-white bg-navy hover:bg-navy-hover rounded-md transition-colors shadow-xs"
                >
                  {isAuthenticated ? "Open Ledger" : "Start Personal Ledger"}
                  <ArrowRight className="ml-2.5 h-3.5 w-3.5" />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium text-nearblack bg-white border border-sand-border hover:border-nearblack/30 rounded-md transition-colors"
                >
                  Review Specifications
                </a>
              </div>

              {/* Minimal metadata strip */}
              <div className="grid grid-cols-3 gap-8 pt-10 mt-10 border-t border-sand-border w-full max-w-md font-mono text-xs">
                <div>
                  <span className="block text-graytext text-[11px]">DATA STORAGE</span>
                  <span className="text-nearblack font-medium">Local &amp; Private</span>
                </div>
                <div>
                  <span className="block text-graytext text-[11px]">INDEX SEARCH</span>
                  <span className="text-nearblack font-medium">Prefix Trie</span>
                </div>
                <div>
                  <span className="block text-graytext text-[11px]">COST</span>
                  <span className="text-nearblack font-medium">$0.00 / Student</span>
                </div>
              </div>
            </div>

            {/* Right Column: Refined Abstract Structural Visual (No UI Mockup) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm bg-white border border-sand-border p-8 rounded-xl shadow-xs">
                <div className="flex items-center justify-between pb-6 border-b border-sand-border">
                  <span className="font-mono text-xs text-graytext">LEDGER STATE</span>
                  <span className="font-mono text-xs text-navy font-medium">ACT-8402</span>
                </div>

                <div className="py-6 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                      <span className="text-graytext">RESERVE RATIO</span>
                      <span className="text-nearblack font-medium">74.2%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden border border-sand-border">
                      <div className="h-full bg-navy w-[74%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 bg-cream/70 border border-sand-border rounded-lg">
                      <span className="block font-mono text-[10px] text-graytext uppercase tracking-wider mb-1">CARRY-OVER</span>
                      <span className="font-display text-xl text-nearblack font-medium">+$142.50</span>
                    </div>
                    <div className="p-3.5 bg-cream/70 border border-sand-border rounded-lg">
                      <span className="block font-mono text-[10px] text-graytext uppercase tracking-wider mb-1">ALLOTTED</span>
                      <span className="font-display text-xl text-nearblack font-medium">$450.00</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sand-border space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-graytext">INDEX DEPTH</span>
                      <span className="text-nearblack">8 Categories</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-graytext">TRANSACTION SYNC</span>
                      <span className="text-nearblack">Deterministic</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-graytext">STABILITY</span>
                      <span className="text-navy font-medium">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-sand-border flex items-center justify-between font-mono text-[11px] text-graytext">
                  <span>STRUCTURAL INTEGRITY</span>
                  <span>O(L) / O(N log N)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why This Exists: The Student Cash Flow Problem (Asymmetric Editorial Section on White) */}
      <section id="problem" className="py-24 bg-white border-b border-sand-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-mono uppercase tracking-widest text-graytext block mb-3">
                THE PROBLEM
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-normal text-nearblack tracking-tight leading-[1.15]">
                Why standard spreadsheet models fail student schedules.
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-8 text-sm sm:text-base text-graytext leading-relaxed">
              <p>
                Commercial personal finance tools are built around predictable monthly income. They assume a fixed salary lands on the first of each month and reset envelopes automatically on a rigid 30-day calendar cycle.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="p-5 border border-sand-border rounded-lg bg-cream/30">
                  <h3 className="font-display font-medium text-base text-nearblack mb-2">Irregular Funding Cycles</h3>
                  <p className="text-xs text-graytext leading-relaxed">
                    Student allowances arrive at irregular intervals. When income lands in term lump sums, conventional monthly templates miscalculate daily safe-to-spend limits.
                  </p>
                </div>
                <div className="p-5 border border-sand-border rounded-lg bg-cream/30">
                  <h3 className="font-display font-medium text-base text-nearblack mb-2">Formula Maintenance</h3>
                  <p className="text-xs text-graytext leading-relaxed">
                    Manual spreadsheet registers break over time. Inserting rows, sorting categories, or carrying unspent balances across terms requires constant formula inspection.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Capabilities Section: Understated Factual Specifications */}
      <section id="capabilities" className="py-24 bg-cream border-b border-sand-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          
          <div className="mb-16 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-graytext block mb-3">
              SYSTEM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-normal text-nearblack tracking-tight leading-[1.15]">
              Built for plain record-keeping.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-sand-border border border-sand-border rounded-xl overflow-hidden">
            
            <div className="bg-white p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-navy block mb-4">01 // LEDGER</span>
                <h3 className="font-display font-medium text-xl text-nearblack mb-3">
                  Allowance Carry-Over
                </h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Unspent funds remain in your balance reserves automatically. You do not need to reconcile monthly rollover cells or adjust carry-forward formulas manually.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-sand-border font-mono text-[11px] text-graytext">
                Continuous balance state
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-navy block mb-4">02 // SEARCH</span>
                <h3 className="font-display font-medium text-xl text-nearblack mb-3">
                  Prefix Trie Retrieval
                </h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Transactions are indexed by description and category string prefixes. Typing filters entries immediately without linear scanning delays.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-sand-border font-mono text-[11px] text-graytext">
                O(L) character lookup
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-navy block mb-4">03 // BUDGETS</span>
                <h3 className="font-display font-medium text-xl text-nearblack mb-3">
                  Category Envelopes
                </h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Configure independent spending limits across up to eight categories. Warnings flag clearly when expenditure crosses eighty percent of an assigned limit.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-sand-border font-mono text-[11px] text-graytext">
                Explicit allocation thresholds
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-navy block mb-4">04 // REPORTING</span>
                <h3 className="font-display font-medium text-xl text-nearblack mb-3">
                  Term Expenditure Reports
                </h3>
                <p className="text-sm text-graytext leading-relaxed">
                  Monthly distribution summaries compile categorical spending and aggregate totals over any selected time window without third-party analytics trackers.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-sand-border font-mono text-[11px] text-graytext">
                Local computation
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Full-Bleed Deep Navy Closing CTA Section */}
      <section id="ledger" className="py-24 sm:py-32 bg-navy text-cream relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-mono tracking-widest uppercase text-cream/60 block mb-4">
              PERSONAL LEDGER
            </span>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-normal text-white tracking-tight leading-[1.08] mb-6">
              Start your ledger today.
            </h2>

            <p className="text-base sm:text-lg text-cream/80 leading-relaxed max-w-xl mb-10">
              Free record-keeping designed for students. Local data persistence. No bank account linking required.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-navy bg-white hover:bg-cream rounded-md transition-colors shadow-xs"
                >
                  Enter Workspace
                  <ArrowRight className="ml-2.5 h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-navy bg-white hover:bg-cream rounded-md transition-colors shadow-xs"
                  >
                    Create Free Account
                    <ArrowRight className="ml-2.5 h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-white border border-white/30 hover:border-white rounded-md transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="mt-14 pt-10 border-t border-white/15 flex flex-wrap items-center gap-8 font-mono text-xs text-cream/60">
              <div>ENCRYPTION // STANDARD</div>
              <div>CONNECTIVITY // LOCAL DB</div>
              <div>TERMS // OPEN USE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="bg-white py-10 border-t border-sand-border font-mono text-xs text-graytext">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-nearblack text-sm">SpendSmart</span>
            <span>•</span>
            <span>Student Ledger v1.2</span>
          </div>
          <div>
            <span>© 2026 SpendSmart</span>
          </div>
        </div>
      </footer>

    </div>
  );
}


