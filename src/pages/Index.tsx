import { motion } from "framer-motion";
import CalorieRing from "@/components/dashboard/CalorieRing";
import StepsCard from "@/components/dashboard/StepsCard";
import WaterTracker from "@/components/dashboard/WaterTracker";
import StreakCard from "@/components/dashboard/StreakCard";
import MacroBar from "@/components/dashboard/MacroBar";
import QuickActions from "@/components/dashboard/QuickActions";
import BadgePreview from "@/components/dashboard/BadgePreview";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Index = () => {
  return (
    <motion.div
      className="max-w-lg mx-auto px-4 py-6 space-y-5 relative"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Decorative floating blobs */}
      <div className="floating-blob w-32 h-32 top-10 right-0 bg-accent/40" />
      <div className="floating-blob w-40 h-40 top-64 -left-10 bg-primary/20" />

      {/* Header */}
      <motion.div className="flex items-center justify-between" variants={item}>
        <div>
          <p className="text-sm text-muted-foreground font-body">Good morning 👋</p>
          <h1 className="text-2xl font-bold font-display text-gradient-primary">Dashboard</h1>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center gradient-border">
          <span className="text-sm font-bold text-primary font-display">JD</span>
        </div>
      </motion.div>

      {/* Calorie Ring */}
      <motion.div variants={item}>
        <CalorieRing consumed={1240} goal={2100} burned={320} />
      </motion.div>

      {/* Macros */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Macros</h3>
        <div className="flex gap-4">
          <MacroBar label="Protein" current={65} goal={150} color="hsl(82, 60%, 40%)" />
          <MacroBar label="Carbs" current={120} goal={250} color="hsl(210, 70%, 52%)" />
          <MacroBar label="Fat" current={35} goal={70} color="hsl(18, 85%, 72%)" />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <QuickActions />
      </motion.div>

      {/* Steps & Streak */}
      <motion.div className="grid grid-cols-2 gap-4" variants={item}>
        <StepsCard steps={6842} goal={10000} />
        <StreakCard currentStreak={12} longestStreak={34} />
      </motion.div>

      {/* Water */}
      <motion.div variants={item}>
        <WaterTracker />
      </motion.div>

      {/* Badges */}
      <motion.div variants={item}>
        <BadgePreview />
      </motion.div>
    </motion.div>
  );
};

export default Index;
