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
    <div className="glass-card p-6 flex flex-col items-center gradient-border relative overflow-hidden">
      {/* Subtle accent blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
      
      <div className="relative w-48 h-48">
        <svg className="w-full h-full progress-ring" viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100" cy="100" r={radius}
            className="fill-none"
            stroke="hsl(200, 18%, 91%)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Burned ring (outer hint) */}
          <circle
            cx="100" cy="100" r={radius + 0}
            className="fill-none"
            stroke="hsl(18, 85%, 72%)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - ((burned / goal) * 100 / 100) * circumference}
            opacity={0.2}
          />
          {/* Main progress */}
          <motion.circle
            cx="100" cy="100" r={radius}
            className="fill-none"
            stroke="url(#ringGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(82, 60%, 40%)" />
              <stop offset="100%" stopColor="hsl(82, 70%, 55%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold font-display text-foreground"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          >
            {remaining}
          </motion.span>
          <span className="text-xs text-muted-foreground font-body">kcal remaining</span>
        </div>
      </div>
      <div className="flex gap-8 mt-5">
        {[
          { value: consumed, label: "Eaten", color: "text-foreground" },
          { value: goal, label: "Goal", color: "text-primary" },
          { value: burned, label: "Burned", color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-semibold font-display ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalorieRing;
