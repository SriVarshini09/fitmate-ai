import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, UtensilsCrossed, BarChart3, Bot, MoreHorizontal, X, Target, Brain, Zap, Calculator, Trophy, CalendarDays, MessageCircle, Heart, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mainNavItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/food", icon: UtensilsCrossed, label: "Food" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
  { path: "/ai-chat", icon: Bot, label: "AI Coach" },
];

const moreItems = [
  { path: "/activities", icon: MapPin, label: "Activities", color: "bg-primary/10 text-primary" },
  { path: "/workout", icon: Dumbbell, label: "Workouts", color: "bg-warning/10 text-warning" },
  { path: "/fasting", icon: Timer, label: "Fasting", color: "bg-info/10 text-info" },
  { path: "/goals", icon: Target, label: "Goals", color: "bg-primary/10 text-primary" },
  { path: "/planner", icon: CalendarDays, label: "Meal Planner", color: "bg-info/10 text-info" },
  { path: "/lifestyle", icon: Brain, label: "Lifestyle", color: "bg-info/10 text-info" },
  { path: "/motivation", icon: Zap, label: "Motivation", color: "bg-warning/10 text-warning" },
  { path: "/tools", icon: Calculator, label: "Tools", color: "bg-success/10 text-success" },
  { path: "/badges", icon: Trophy, label: "Badges", color: "bg-badge-gold/10 text-badge-gold" },
  { path: "/community", icon: MessageCircle, label: "Community", color: "bg-primary/10 text-primary" },
  { path: "/cycle", icon: Heart, label: "Cycle Tracker", color: "bg-destructive/10 text-destructive" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => location.pathname === item.path);

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMore(false)}
          >
            <motion.div
              className="absolute bottom-20 left-0 right-0 max-w-lg mx-auto px-4"
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card-strong p-4 rounded-2xl">
                <div className="grid grid-cols-4 gap-3">
                  {moreItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowMore(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        location.pathname === item.path
                          ? "bg-primary/8 ring-1 ring-primary/20 scale-105"
                          : "hover:bg-secondary hover:scale-105 active:scale-95"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl ${item.color} flex items-center justify-center`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground font-body">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{
        background: "hsl(80 8% 10% / 0.92)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderTop: "1px solid hsl(80 5% 20% / 0.6)",
        boxShadow: "0 -4px 24px hsl(0 0% 0% / 0.3)",
      }}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
          >
            {(isMoreActive || showMore) && (
              <motion.div
                layoutId={showMore ? undefined : "nav-indicator"}
                className="absolute inset-0 bg-primary/10 rounded-xl"
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              />
            )}
            {showMore ? (
              <X className="w-5 h-5 text-primary" />
            ) : (
              <MoreHorizontal className={`w-5 h-5 transition-colors ${isMoreActive ? "text-primary" : "text-muted-foreground"}`} />
            )}
            <span className={`text-[10px] font-medium transition-colors ${isMoreActive || showMore ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
