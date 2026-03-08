import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowRight, Zap, Dumbbell, Flame, Heart, Trophy } from "lucide-react";
import { toast } from "sonner";

const floatingEmojis = [
  { emoji: "💪", top: "8%", left: "5%", delay: 0, duration: 4, size: "text-3xl" },
  { emoji: "🔥", top: "15%", right: "8%", delay: 0.5, duration: 3.5, size: "text-4xl" },
  { emoji: "🏋️", bottom: "25%", left: "3%", delay: 1, duration: 5, size: "text-2xl" },
  { emoji: "⚡", top: "40%", right: "5%", delay: 1.5, duration: 4.5, size: "text-3xl" },
  { emoji: "🏃", bottom: "12%", right: "12%", delay: 0.8, duration: 3.8, size: "text-2xl" },
  { emoji: "🥊", bottom: "35%", left: "8%", delay: 2, duration: 4.2, size: "text-xl" },
  { emoji: "💯", top: "60%", right: "3%", delay: 0.3, duration: 3.2, size: "text-2xl" },
  { emoji: "🦾", top: "5%", left: "30%", delay: 1.2, duration: 4.8, size: "text-xl" },
];

const floatingIcons = [
  { Icon: Dumbbell, top: "20%", left: "10%", delay: 0.4, duration: 6 },
  { Icon: Flame, top: "70%", right: "6%", delay: 1.2, duration: 5 },
  { Icon: Heart, bottom: "8%", left: "15%", delay: 0.8, duration: 5.5 },
  { Icon: Trophy, top: "30%", right: "15%", delay: 1.6, duration: 4.5 },
];

const badges = [
  { text: "NO EXCUSES", rotate: "-12deg", top: "12%", right: "2%" },
  { text: "BEAST MODE", rotate: "8deg", bottom: "18%", left: "2%" },
  { text: "GRIND 💀", rotate: "-5deg", bottom: "8%", right: "5%" },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    const userId = data.user?.id;
    let displayName = "champ";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", userId)
        .single();
      if (profile?.display_name) displayName = profile.display_name;
      else if (profile?.username) displayName = profile.username;
    }
    setLoading(false);
    toast.success(`Hey ${displayName}! Welcome back! 💪🔥`);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />

      {/* Floating Emoji Stickers */}
      {floatingEmojis.map((item, i) => (
        <motion.div
          key={`emoji-${i}`}
          className={`absolute ${item.size} select-none pointer-events-none opacity-30`}
          style={{ top: item.top, left: item.left, right: (item as any).right, bottom: (item as any).bottom }}
          animate={{
            y: [0, -18, 0, 12, 0],
            rotate: [0, 8, -8, 4, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* Floating Lucide Icons */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={`icon-${i}`}
          className="absolute text-primary/15 pointer-events-none"
          style={{ top: item.top, left: (item as any).left, right: (item as any).right, bottom: (item as any).bottom }}
          animate={{
            y: [0, -12, 0, 8, 0],
            opacity: [0.12, 0.25, 0.12],
            rotate: [0, 15, -10, 5, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.Icon className="w-8 h-8" />
        </motion.div>
      ))}

      {/* Glassmorphic Badge Stickers */}
      {badges.map((badge, i) => (
        <motion.div
          key={`badge-${i}`}
          className="absolute hidden md:flex items-center px-3 py-1.5 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 shadow-lg pointer-events-none"
          style={{
            top: badge.top,
            left: (badge as any).left,
            right: (badge as any).right,
            bottom: badge.bottom,
            rotate: badge.rotate,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.3, duration: 0.5, type: "spring" }}
        >
          <span className="text-[10px] font-black font-display text-primary tracking-widest uppercase">
            {badge.text}
          </span>
        </motion.div>
      ))}

      <motion.div
        className="w-full max-w-md space-y-8 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">VitalFlow</span>
          </Link>
          <h1 className="text-3xl font-bold font-display text-foreground">Welcome back</h1>
          <p className="text-muted-foreground font-body mt-2">Sign in to continue your journey</p>
        </div>

        {/* Aggressive motivational quote */}
        <motion.div
          className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="absolute -top-2 -right-2 text-5xl opacity-10 select-none">🔥</div>
          <p className="text-sm font-bold font-display text-primary leading-snug uppercase tracking-wide">
            "Nobody cares about your excuses. Nobody pities you for procrastinating. Nobody is going to come knock on your door and make you do the work. It's YOUR life. GET UP."
          </p>
          <p className="text-[10px] text-primary/60 font-body mt-1.5 text-right">— Your future self</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-body">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground font-body">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary font-body hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold font-display flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
