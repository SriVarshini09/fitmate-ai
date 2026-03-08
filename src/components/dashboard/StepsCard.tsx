import { motion } from "framer-motion";
import { Footprints } from "lucide-react";

interface StepsCardProps {
  steps: number;
  goal: number;
}

const StepsCard = ({ steps, goal }: StepsCardProps) => {
  const percentage = Math.min((steps / goal) * 100, 100);

  return (
    <div className="glass-card p-5 gradient-border relative overflow-hidden">
      <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/8 blur-xl" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Footprints className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Steps</p>
          <p className="text-xl font-bold font-display text-foreground">{steps.toLocaleString()}</p>
        </div>
      </div>
      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(82, 60%, 40%), hsl(82, 70%, 55%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 font-body">{goal.toLocaleString()} goal</p>
    </div>
  );
};

export default StepsCard;
