import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakCard = ({ currentStreak, longestStreak }: StreakCardProps) => {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute top-2 right-2 opacity-10">
        <Flame className="w-20 h-20 text-warning" />
      </div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
          <Flame className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-body">Current Streak</p>
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
      <p className="text-xs text-muted-foreground font-body mt-2">
        Longest: <span className="text-foreground font-semibold">{longestStreak} days</span>
      </p>
    </div>
  );
};

export default StreakCard;
