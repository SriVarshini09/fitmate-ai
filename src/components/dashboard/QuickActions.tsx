import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, PenLine, Dumbbell, Footprints, Heart } from "lucide-react";

const actions = [
  { icon: Camera, label: "Scan Food", path: "/dashboard/food", color: "bg-primary/10 text-primary" },
  { icon: PenLine, label: "Log Meal", path: "/dashboard/food", color: "bg-info/10 text-info" },
  { icon: Heart, label: "Cycle", path: "/dashboard/cycle", color: "bg-destructive/10 text-destructive" },
  { icon: Dumbbell, label: "Workout", path: "/dashboard/workout", color: "bg-warning/10 text-warning" },
  { icon: Footprints, label: "Activity", path: "/dashboard/activities", color: "bg-success/10 text-success" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-5 gap-2">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          onClick={() => navigate(action.path)}
          className="glass-card p-3 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`w-10 h-10 rounded-2xl ${action.color} flex items-center justify-center`}>
            <action.icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground font-body">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
