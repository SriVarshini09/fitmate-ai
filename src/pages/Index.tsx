import { motion } from "framer-motion";
import CalorieRing from "@/components/dashboard/CalorieRing";
import StepsCard from "@/components/dashboard/StepsCard";
import WaterTracker from "@/components/dashboard/WaterTracker";
import StreakCard from "@/components/dashboard/StreakCard";
import MacroBar from "@/components/dashboard/MacroBar";
import QuickActions from "@/components/dashboard/QuickActions";
import BadgePreview from "@/components/dashboard/BadgePreview";

const Index = () => {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className="text-sm text-muted-foreground font-body">Good morning 👋</p>
          <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-primary font-display">JD</span>
        </div>
      </motion.div>

      {/* Calorie Ring */}
      <CalorieRing consumed={1240} goal={2100} burned={320} />

      {/* Macros */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Macros</h3>
        <div className="flex gap-4">
          <MacroBar label="Protein" current={65} goal={150} color="hsl(82, 85%, 55%)" />
          <MacroBar label="Carbs" current={120} goal={250} color="hsl(210, 80%, 55%)" />
          <MacroBar label="Fat" current={35} goal={70} color="hsl(38, 92%, 50%)" />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Steps & Water */}
      <div className="grid grid-cols-2 gap-4">
        <StepsCard steps={6842} goal={10000} />
        <StreakCard currentStreak={12} longestStreak={34} />
      </div>

      {/* Water */}
      <WaterTracker />

      {/* Badges */}
      <BadgePreview />
    </div>
  );
};

export default Index;
