import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Zap, Check } from "lucide-react";
import { toast } from "sonner";

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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold font-display text-foreground">Invalid Reset Link</h1>
          <p className="text-muted-foreground font-body">This link may have expired or already been used.</p>
          <Link to="/forgot-password" className="text-primary font-body hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        className="w-full max-w-md space-y-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">VitalFlow</span>
          </Link>
          <h1 className="text-3xl font-bold font-display text-foreground">Set new password</h1>
          <p className="text-muted-foreground font-body mt-2">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-body">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-body">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold font-display flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>Update Password <Check className="w-4 h-4" /></>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
