import { motion } from "framer-motion";
import { Footprints } from "lucide-react";

interface StepsCardProps {
  steps: number;
  goal: number;
}

const StepsCard = ({ steps, goal }: StepsCardProps) => {
  const percentage = Math.min((steps / goal) * 100, 100);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Footprints className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-body">Steps</p>
          <p className="text-xl font-bold font-display text-foreground">{steps.toLocaleString()}</p>
        </div>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 font-body">{goal.toLocaleString()} goal</p>
    </div>
  );
};

export default StepsCard;
