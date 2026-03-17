import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const GlassButton = ({
  loading = false,
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: GlassButtonProps) => {
  const base =
    "relative w-full py-3.5 rounded-2xl font-semibold font-display text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 disabled:opacity-50",
    secondary:
      "bg-white/8 border border-white/10 text-white hover:bg-white/12 disabled:opacity-40",
    ghost: "text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={[base, variants[variant], className].join(" ")}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          <span>{typeof children === "string" ? children : "Loading..."}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default GlassButton;
