import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakCard = ({ currentStreak, longestStreak }: StreakCardProps) => {
  return (
    <div className="glass-card p-5 relative overflow-hidden gradient-border">
      <div className="absolute top-2 right-2 opacity-8">
        <Flame className="w-20 h-20 text-warning/10" />
      </div>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-warning/10 blur-xl" />
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center">
          <Flame className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Streak</p>
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-3xl font-bold font-display text-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {currentStreak}
            </motion.span>
            <span className="text-sm text-muted-foreground font-body">days</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-body mt-2">
        Longest: <span className="text-foreground font-semibold">{longestStreak} days</span>
      </p>
    </div>
  );
};

export default StreakCard;
