import { motion } from "framer-motion";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  burned: number;
}

const CalorieRing = ({ consumed, goal, burned }: CalorieRingProps) => {
  const remaining = Math.max(0, goal - consumed + burned);
  const percentage = Math.min((consumed / goal) * 100, 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full progress-ring" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={radius}
            className="fill-none stroke-secondary"
            strokeWidth="12"
          />
          <motion.circle
            cx="100" cy="100" r={radius}
            className="fill-none stroke-primary"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-3xl font-bold font-display text-foreground">{remaining}</span>
          <span className="text-xs text-muted-foreground font-body">kcal remaining</span>
        </div>
      </div>
      <div className="flex gap-8 mt-4">
        <div className="text-center">
          <p className="text-lg font-semibold font-display text-foreground">{consumed}</p>
          <p className="text-xs text-muted-foreground font-body">Eaten</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold font-display text-primary">{goal}</p>
          <p className="text-xs text-muted-foreground font-body">Goal</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold font-display text-foreground">{burned}</p>
          <p className="text-xs text-muted-foreground font-body">Burned</p>
        </div>
      </div>
    </div>
  );
};

export default CalorieRing;
