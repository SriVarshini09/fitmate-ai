import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, suffix, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-white/60 tracking-wide uppercase font-body">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={[
              "w-full bg-white/5 border rounded-2xl py-3.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 font-body",
              "focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
              error ? "border-red-400/60" : "border-white/10",
              icon ? "pl-11" : "pl-4",
              suffix ? "pr-11" : "pr-4",
              className,
            ].join(" ")}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <motion.p
            className="text-xs text-red-400 font-body flex items-center gap-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export default GlassInput;
