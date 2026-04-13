import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Activity, Flame, Droplets, TrendingUp } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  /** Show the decorative left panel (login) or just center the card */
  splitLayout?: boolean;
}

const stats = [
  { icon: Flame, label: "Calories burned", value: "2,340", color: "text-orange-400" },
  { icon: Activity, label: "Steps today", value: "8,721", color: "text-primary" },
  { icon: Droplets, label: "Water intake", value: "2.1 L", color: "text-blue-400" },
  { icon: TrendingUp, label: "Streak", value: "14 days", color: "text-purple-400" },
];

const AuthLayout = ({ children, splitLayout = false }: AuthLayoutProps) => {
  return (
    <div className="auth-bg min-h-screen flex">
      {/* Left decorative panel — only on split layout (login) */}
      {splitLayout && (
        <motion.div
          className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-blue-500/8 blur-[60px]" />
          </div>

          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-white">VitalFlow</span>
          </Link>

          {/* Main copy */}
          <div className="relative z-10 space-y-6">
            <div>
              <h2 className="text-4xl font-bold font-display text-white leading-tight mb-3">
                Your health,<br />
                <span className="text-gradient-primary">intelligently</span><br />
                tracked.
              </h2>
              <p className="text-white/50 font-body text-base leading-relaxed max-w-xs">
                AI-powered fitness coaching, calorie tracking, and habit building — all in one place.
              </p>
            </div>

            {/* Live stats preview */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/8 rounded-2xl p-4 backdrop-blur-sm"
                >
                  <Icon className={`w-4 h-4 mb-2 ${color}`} />
                  <p className="text-white font-semibold font-display text-base">{value}</p>
                  <p className="text-white/40 font-body text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="relative z-10 bg-white/5 border border-white/8 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-white/70 font-body text-sm leading-relaxed mb-3">
              "Lost 12kg in 4 months. The AI coach actually understands my schedule and adjusts my plan weekly."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xs font-display">AS</span>
              </div>
              <div>
                <p className="text-white/80 font-semibold text-xs font-display">Alex S.</p>
                <p className="text-white/40 text-xs font-body">Lost 12kg · 4 months</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Right / center form area */}
      <div className={`flex-1 flex items-center justify-center p-6 ${splitLayout ? "lg:p-12" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
