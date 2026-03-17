import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Footprints, Droplets, UtensilsCrossed, Dumbbell, Target } from "lucide-react";

interface BadgeInfo {
  icon: React.ElementType;
  title: string;
  description: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  earned: boolean;
  progress: number;
  requirement: string;
}

function calcBadges(): BadgeInfo[] {
  const APP = "Cals Crumble Fit";
  try {
    // Streak
    const streakRaw = localStorage.getItem(`${APP}_streak`);
    const streak = streakRaw ? (JSON.parse(streakRaw).current || 0) : 0;

    // Workouts
    const workoutsRaw = localStorage.getItem(`${APP}_workouts`);
    const workouts: any[] = workoutsRaw ? JSON.parse(workoutsRaw) : [];
    const workoutCount = workouts.length;

    // Food log days (unique dates with at least 1 entry)
    const foodsRaw = localStorage.getItem(`${APP}_foods`);
    const foods: any[] = foodsRaw ? JSON.parse(foodsRaw) : [];
    const foodDays = new Set(foods.map((f: any) => f.date)).size;

    // Steps data
    const stepsRaw = localStorage.getItem(`${APP}_steps`);
    const stepsData: Record<string, number> = stepsRaw ? JSON.parse(stepsRaw) : {};
    const totalSteps = Object.values(stepsData).reduce((s, v) => s + v, 0);
    const stepDays10k = Object.values(stepsData).filter((v) => v >= 10000).length;

    // Water goal days
    const waterRaw = localStorage.getItem(`${APP}_water`);
    const waterData: Record<string, number> = waterRaw ? JSON.parse(waterRaw) : {};
    const waterGoalDays = Object.values(waterData).filter((v) => v >= 2000).length;

    const pct = (val: number, max: number) => Math.min(Math.round((val / max) * 100), 100);

    return [
      { icon: Flame, title: "Streak Master", description: "60-day streak", tier: "platinum", earned: streak >= 60, progress: pct(streak, 60), requirement: `${streak}/60 days` },
      { icon: Flame, title: "Streak Pro", description: "30-day streak", tier: "gold", earned: streak >= 30, progress: pct(streak, 30), requirement: `${streak}/30 days` },
      { icon: Flame, title: "Streak Builder", description: "14-day streak", tier: "silver", earned: streak >= 14, progress: pct(streak, 14), requirement: `${streak}/14 days` },
      { icon: Flame, title: "Getting Started", description: "7-day streak", tier: "bronze", earned: streak >= 7, progress: pct(streak, 7), requirement: `${streak}/7 days` },
      { icon: UtensilsCrossed, title: "Nutrition Guru", description: "Log meals for 60 days", tier: "platinum", earned: foodDays >= 60, progress: pct(foodDays, 60), requirement: `${foodDays}/60 days` },
      { icon: UtensilsCrossed, title: "Meal Tracker", description: "Log meals for 30 days", tier: "gold", earned: foodDays >= 30, progress: pct(foodDays, 30), requirement: `${foodDays}/30 days` },
      { icon: Footprints, title: "Marathon Walker", description: "1M total steps", tier: "platinum", earned: totalSteps >= 1000000, progress: pct(totalSteps, 1000000), requirement: `${totalSteps.toLocaleString()}/1,000,000` },
      { icon: Footprints, title: "Step Champion", description: "10K steps × 30 days", tier: "gold", earned: stepDays10k >= 30, progress: pct(stepDays10k, 30), requirement: `${stepDays10k}/30 days` },
      { icon: Droplets, title: "Hydration Hero", description: "Hit water goal 60 days", tier: "gold", earned: waterGoalDays >= 60, progress: pct(waterGoalDays, 60), requirement: `${waterGoalDays}/60 days` },
      { icon: Droplets, title: "Water Warrior", description: "Hit water goal 14 days", tier: "silver", earned: waterGoalDays >= 14, progress: pct(waterGoalDays, 14), requirement: `${waterGoalDays}/14 days` },
      { icon: Dumbbell, title: "Gym Rat", description: "Log 100 workouts", tier: "platinum", earned: workoutCount >= 100, progress: pct(workoutCount, 100), requirement: `${workoutCount}/100 workouts` },
      { icon: Target, title: "Calorie Counter", description: "Log food for 30 days", tier: "gold", earned: foodDays >= 30, progress: pct(foodDays, 30), requirement: `${foodDays}/30 days logged` },
    ];
  } catch {
    return [];
  }
}

const tierColors: Record<string, { text: string; bg: string; border: string }> = {
  platinum: { text: "text-badge-platinum", bg: "bg-badge-platinum/10", border: "border-badge-platinum/30" },
  gold: { text: "text-badge-gold", bg: "bg-badge-gold/10", border: "border-badge-gold/30" },
  silver: { text: "text-badge-silver", bg: "bg-badge-silver/10", border: "border-badge-silver/30" },
  bronze: { text: "text-badge-bronze", bg: "bg-badge-bronze/10", border: "border-badge-bronze/30" },
};

const Badges = () => {
  const allBadges = useMemo(() => calcBadges(), []);
  const earned = allBadges.filter((b) => b.earned).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Badges</h1>
        <p className="text-sm text-muted-foreground font-body">{earned}/{allBadges.length} earned</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["platinum", "gold", "silver", "bronze"] as const).map((tier) => {
          const count = allBadges.filter((b) => b.tier === tier && b.earned).length;
          const total = allBadges.filter((b) => b.tier === tier).length;
          const colors = tierColors[tier];
          return (
            <div key={tier} className={`glass-card p-3 text-center border ${colors.border}`}>
              <p className={`text-lg font-bold font-display ${colors.text}`}>{count}/{total}</p>
              <p className="text-[10px] text-muted-foreground font-body capitalize">{tier}</p>
            </div>
          );
        })}
      </div>

      {/* Badge list */}
      <div className="space-y-3">
        {allBadges.map((badge, i) => {
          const colors = tierColors[badge.tier];
          return (
            <motion.div
              key={i}
              className={`glass-card p-4 flex items-center gap-4 ${!badge.earned ? "opacity-50" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: badge.earned ? 1 : 0.5, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                <badge.icon className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold font-display text-foreground truncate">{badge.title}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${colors.bg} ${colors.text}`}>
                    {badge.tier}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body">{badge.requirement}</p>
                {!badge.earned && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full`}
                        style={{ backgroundColor: `hsl(var(--badge-${badge.tier}))` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${badge.progress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-body">{badge.progress}%</span>
                  </div>
                )}
              </div>
              {badge.earned && (
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Trophy className={`w-4 h-4 ${colors.text}`} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Badges;
