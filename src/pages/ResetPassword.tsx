import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import GlassButton from "@/components/auth/GlassButton";
import PasswordStrength from "@/components/auth/PasswordStrength";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords don't match");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! 🔐");
      navigate("/dashboard");
    }
  };

  if (!isRecovery) {
    return (
      <AuthLayout>
        <motion.div
          className="w-full max-w-sm text-center space-y-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold font-display text-white">Invalid Reset Link</h1>
          <p className="text-white/45 font-body text-sm">This link may have expired or already been used.</p>
          <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-body text-sm transition-colors">
            Request a new reset link
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        className="w-full max-w-sm space-y-7"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-1">Set new password</h1>
          <p className="text-white/45 font-body text-sm">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 tracking-wide uppercase font-body">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 font-body focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 tracking-wide uppercase font-body">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className={[
                "w-full bg-white/5 border rounded-2xl py-3.5 px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 font-body focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                confirmPassword && confirmPassword !== password ? "border-red-400/60" : "border-white/10",
              ].join(" ")}
            />
            {confirmPassword && confirmPassword !== password && (
              <motion.p
                className="text-xs text-red-400 font-body"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Passwords don't match
              </motion.p>
            )}
          </div>

          <GlassButton type="submit" loading={loading} className="mt-2">
            {!loading && <><Check className="w-4 h-4" /> Update Password</>}
          </GlassButton>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/70 font-body transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </motion.div>
    </AuthLayout>
  );
};

export default ResetPassword;
