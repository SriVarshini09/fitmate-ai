import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import GlassInput from "@/components/auth/GlassInput";
import GlassButton from "@/components/auth/GlassButton";

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
    <AuthLayout>
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {sent ? (
          <motion.div
            className="text-center space-y-6"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Check className="w-10 h-10 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white mb-2">Check your inbox</h1>
              <p className="text-white/45 font-body text-sm leading-relaxed">
                We sent a reset link to{" "}
                <span className="text-white font-medium">{email}</span>.
                Check your spam folder if you don't see it.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-7">
            <div>
              <h1 className="text-3xl font-bold font-display text-white mb-1">Reset password</h1>
              <p className="text-white/45 font-body text-sm">Enter your email and we'll send a recovery link</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <GlassInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />
              <GlassButton type="submit" loading={loading}>
                Send Reset Link
              </GlassButton>
            </form>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/70 font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        )}
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPassword;
