import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, PenLine, Dumbbell, Footprints, Heart } from "lucide-react";

const actions = [
  { icon: Camera, label: "Scan Food", path: "/food", color: "bg-primary/15 text-primary" },
  { icon: PenLine, label: "Log Meal", path: "/food", color: "bg-info/15 text-info" },
  { icon: Heart, label: "Cycle", path: "/cycle", color: "bg-destructive/15 text-destructive" },
  { icon: Dumbbell, label: "Workout", path: "/", color: "bg-warning/15 text-warning" },
  { icon: Footprints, label: "Activity", path: "/", color: "bg-success/15 text-success" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          onClick={() => navigate(action.path)}
          className="glass-card p-3 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
            <action.icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground font-body">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
