import { useLocation, useNavigate } from "react-router-dom";
import { Home, UtensilsCrossed, CalendarDays, MessageCircle, Bot } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/food", icon: UtensilsCrossed, label: "Food" },
  { path: "/planner", icon: CalendarDays, label: "Planner" },
  { path: "/community", icon: MessageCircle, label: "Community" },
  { path: "/ai-chat", icon: Bot, label: "AI Coach" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card-strong border-t border-glass-border rounded-none">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
