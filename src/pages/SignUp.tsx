import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { api } from "../lib/api";
import { PasswordInput } from "../components/PasswordInput";
import { motion, AnimatePresence } from "motion/react";

interface SignUpProps {
  onLoginSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Inline field validation states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Form-wide error / success states
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password Requirement Rules
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const getPasswordStrengthText = () => {
    if (!password) return { text: "", color: "bg-gray-800" };
    const score = Object.values(checks).filter(Boolean).length;
    if (score <= 2) return { text: "Weak", color: "bg-rose-500" };
    if (score <= 4) return { text: "Medium", color: "bg-amber-500" };
    return { text: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrengthText();

  const validateEmailFormat = (emailStr: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailStr);
  };

  // Real-time input change handlers
  const handleNameChange = (val: string) => {
    setName(val);
    if (nameError) {
      setNameError(val.trim() ? null : "Full name is required");
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) {
      if (!val) {
        setEmailError("Email address is required");
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
        setPasswordError("Password is required");
      } else if (val.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
      } else {
        setPasswordError(null);
      }
    }
    // Clear mismatch error if passwords start matching
    if (confirmPasswordError && confirmPassword && val === confirmPassword) {
      setConfirmPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (confirmPasswordError) {
      if (!val) {
        setConfirmPasswordError("Confirm password is required");
      } else if (val !== password) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccess(null);

    let hasError = false;

    // Validate Name
    if (!name.trim()) {
      setNameError("Full name is required");
      hasError = true;
    } else {
      setNameError(null);
    }

    // Validate Email
    if (!email.trim()) {
      setEmailError("Email address is required");
      hasError = true;
    } else if (!validateEmailFormat(email)) {
      setEmailError("Enter a valid email address");
      hasError = true;
    } else {
      setEmailError(null);
    }

    // Validate Password
    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      hasError = true;
    } else {
      setPasswordError(null);
    }

    // Validate Confirm Password
    if (!confirmPassword) {
      setConfirmPasswordError("Confirm password is required");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    } else {
      setConfirmPasswordError(null);
    }

    if (hasError) return;

    setLoading(true);

    try {
      const response = await api.post("/auth/signup", { name, email, password });
      const { token, user } = response.data;
      setSuccess("Account created successfully! Logging you in...");
      setTimeout(() => {
        onLoginSuccess(token, user);
        navigate("/dashboard"); // Redirect to authenticated workspace dashboard
      }, 1000);
    } catch (err: any) {
      if (err.response && err.response.status) {
        if (err.response.status === 400 || err.response.status === 401) {
          const rawError = err.response.data && err.response.data.error;
          if (rawError && (rawError.includes("already exists") || rawError.includes("email already registered"))) {
            // Specific email registered alert block
            setGeneralError("EMAIL_ALREADY_EXISTS");
          } else if (rawError) {
            setGeneralError(rawError);
          } else {
            setGeneralError("An account with this email already exists.");
          }
        } else {
          setGeneralError("Something went wrong on our end. Please try again in a moment.");
        }
      } else {
        setGeneralError("Something went wrong on our end. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-300" id="signup-container">
      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md my-8"
      >
        {/* Clickable Brand Logo Header routing to `/` */}
        <div className="flex flex-col items-center mb-6">
          <Link 
            to="/" 
            className="flex flex-col items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950 rounded-2xl p-2 transition-all"
            title="SpendSmart Home"
            id="signup-brand-logo-link"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5 mb-3 group-hover:scale-105 transition-transform">
              <Award className="h-8 w-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Spend<span className="text-emerald-400">Smart</span>
            </h1>
          </Link>
          <p className="text-gray-400 text-xs mt-1 text-center font-mono max-w-xs uppercase tracking-wider">
            DSA-BASED PERSONAL FINANCE FOR COLLEGE STUDENTS
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-none" id="signup-card">
          <h2 className="text-xl font-bold text-gray-100 mb-1" id="signup-title">Create Account</h2>
          <p className="text-gray-400 text-xs mb-5 leading-relaxed">
            Register to plan monthly pocket money, track expenses, and optimize your student budgets.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Form-wide error / success handling */}
            <AnimatePresence mode="wait">
              {generalError && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-lg flex items-start gap-2.5 overflow-hidden"
                  id="signup-error-alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    {generalError === "EMAIL_ALREADY_EXISTS" ? (
                      <div>
                        <span className="font-semibold block text-rose-300">Email Already Exists</span>
                        <span className="text-[11px] text-rose-400/90 leading-relaxed block mt-0.5">
                          An account with this email already exists. Try{" "}
                          <Link to="/login" className="font-bold underline text-emerald-400 hover:text-emerald-300">
                            logging in instead
                          </Link>
                          .
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold block text-rose-300">Registration Failed</span>
                        <span className="text-[11px] text-rose-400/90 leading-tight block mt-0.5">{generalError}</span>
                      </div>
                    )}
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
                  id="signup-success-alert"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold block text-emerald-300">Success</span>
                    <span className="text-[11px] text-emerald-400/90 leading-tight block mt-0.5">{success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-name" className="text-xs font-medium text-gray-400">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-950/40 border ${
                  nameError ? "border-rose-500 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-800 focus:border-emerald-500/50 focus:ring-emerald-500/10"
                } focus:ring-4 text-sm text-gray-100 rounded-lg outline-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
              />
              {nameError && (
                <p className="text-xs text-rose-500/90 mt-0.5 font-medium flex items-center gap-1" id="name-field-error">
                  <span>●</span> {nameError}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-xs font-medium text-gray-400">
                Email Address
              </label>
              <input
                id="signup-email"
                type="text"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-950/40 border ${
                  emailError ? "border-rose-500 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-800 focus:border-emerald-500/50 focus:ring-emerald-500/10"
                } focus:ring-4 text-sm text-gray-100 rounded-lg outline-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
              />
              {emailError && (
                <p className="text-xs text-rose-500/90 mt-0.5 font-medium flex items-center gap-1" id="email-field-error">
                  <span>●</span> {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <PasswordInput
                id="signup-password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                error={passwordError || undefined}
                className="focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              />

              {/* Real-time Requirement List checklist */}
              {password && (
                <div className="mt-2.5 p-3 bg-gray-950/40 border border-gray-800/80 rounded-lg flex flex-col gap-1.5" id="password-checklist">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">Requirements Status:</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase font-mono flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${strength.color}`}></span>
                      {strength.text}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      {checks.length ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="text-gray-600 block shrink-0">○</span>
                      )}
                      <span className={checks.length ? "text-emerald-400" : "text-gray-500"}>8+ Characters</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {checks.uppercase ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="text-gray-600 block shrink-0">○</span>
                      )}
                      <span className={checks.uppercase ? "text-emerald-400" : "text-gray-500"}>Uppercase letter</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {checks.lowercase ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="text-gray-600 block shrink-0">○</span>
                      )}
                      <span className={checks.lowercase ? "text-emerald-400" : "text-gray-500"}>Lowercase letter</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {checks.number ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="text-gray-600 block shrink-0">○</span>
                      )}
                      <span className={checks.number ? "text-emerald-400" : "text-gray-500"}>One number</span>
                    </div>

                    <div className="flex items-center gap-1.5 col-span-2">
                      {checks.special ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="text-gray-600 block shrink-0">○</span>
                      )}
                      <span className={checks.special ? "text-emerald-400" : "text-gray-500"}>Special character (@$!%*?&amp;)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <PasswordInput
              id="signup-confirm-password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              error={confirmPasswordError || undefined}
              className="focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            />

            {/* Password Requirements Legend */}
            {!password && (
              <div className="p-3 bg-gray-950/40 border border-gray-800/85 rounded-lg flex gap-2 items-start text-[11px] text-gray-500 leading-normal" id="password-legend">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-400 font-semibold block mb-0.5">Password Security:</strong>
                  Minimum 8 characters, with 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/10 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              id="signup-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-950" />
                  <span>Creating Account...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors focus:underline focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-1 focus-visible:ring-2 focus-visible:ring-emerald-400" 
            id="login-link"
          >
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
