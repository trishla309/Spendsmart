import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = "Password",
  error,
  className = "",
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className={`w-full px-4 py-2.5 bg-gray-950/40 border ${
            error ? "border-rose-500/80 focus:ring-rose-500/20" : "border-gray-800 focus:border-emerald-500/50 focus:ring-emerald-500/10"
          } text-sm text-gray-100 rounded-lg outline-none transition-all duration-200 focus:ring-4 pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
          tabIndex={-1}
          id={`${id}-toggle`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {showPassword ? (
              <motion.div
                key="eye-off"
                initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
                transition={{ duration: 0.15 }}
              >
                <EyeOff className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="eye-on"
                initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: -15 }}
                transition={{ duration: 0.15 }}
              >
                <Eye className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-500/90 mt-0.5 font-medium flex items-center gap-1">
          <span>●</span> {error}
        </p>
      )}
    </div>
  );
};
