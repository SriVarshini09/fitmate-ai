import { motion } from "framer-motion";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

const MacroBar = ({ label, current, goal, color, unit = "g" }: MacroBarProps) => {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-muted-foreground font-body">{label}</span>
        <span className="text-xs font-medium text-foreground font-display">
          {current}/{goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default MacroBar;
