import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplets, Plus, Bell } from "lucide-react";
import { toast } from "sonner";

const WATER_GOAL = 8; // glasses

const WaterTracker = () => {
  const [glasses, setGlasses] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      if (glasses < WATER_GOAL) {
        toast("💧 Time to drink water!", {
          description: `You've had ${glasses}/${WATER_GOAL} glasses today.`,
          action: {
            label: "Log Water",
            onClick: () => setGlasses((g) => Math.min(g + 1, WATER_GOAL)),
          },
        });
      }
    }, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, [glasses]);

  const addGlass = () => {
    if (glasses < WATER_GOAL) {
      setGlasses(glasses + 1);
      if (glasses + 1 === WATER_GOAL) {
        toast.success("🎉 Water goal reached!");
      }
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-body">Water</p>
            <p className="text-xl font-bold font-display text-foreground">{glasses}/{WATER_GOAL}</p>
          </div>
        </div>
        <button
          onClick={addGlass}
          className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
        >
          <Plus className="w-5 h-5 text-primary" />
        </button>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: WATER_GOAL }).map((_, i) => (
          <motion.div
            key={i}
            className={`flex-1 h-3 rounded-full ${i < glasses ? "bg-info" : "bg-secondary"}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <Bell className="w-3 h-3 text-muted-foreground" />
        <p className="text-xs text-muted-foreground font-body">Hourly reminders active</p>
      </div>
    </div>
  );
};

export default WaterTracker;
