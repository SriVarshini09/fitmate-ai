import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Zap, Check } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error("Enter a valid email address");

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

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
          <h1 className="text-3xl font-bold font-display text-foreground">
            {sent ? "Check your email" : "Reset password"}
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            {sent
              ? "We've sent a password reset link to your email"
              : "Enter your email and we'll send you a recovery link"}
          </p>
        </div>

        {sent ? (
          <motion.div
            className="glass-card p-8 text-center space-y-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Check your inbox at <span className="text-foreground font-medium">{email}</span> and click the reset link.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-primary font-body hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
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
                "Send Reset Link"
              )}
            </motion.button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground font-body hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
