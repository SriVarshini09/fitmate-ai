import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star, Flame, Footprints, Droplets, UtensilsCrossed, Dumbbell, Target } from "lucide-react";

interface BadgeInfo {
  icon: React.ElementType;
  title: string;
  description: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  earned: boolean;
  progress: number;
  requirement: string;
}

const allBadges: BadgeInfo[] = [
  { icon: Flame, title: "Streak Master", description: "Maintain a daily streak", tier: "platinum", earned: false, progress: 0, requirement: "60-day streak" },
  { icon: Flame, title: "Streak Pro", description: "30-day streak", tier: "gold", earned: false, progress: 0, requirement: "30-day streak" },
  { icon: Flame, title: "Streak Builder", description: "14-day streak", tier: "silver", earned: false, progress: 0, requirement: "14-day streak" },
  { icon: Flame, title: "Getting Started", description: "7-day streak", tier: "bronze", earned: false, progress: 0, requirement: "7-day streak" },
  { icon: UtensilsCrossed, title: "Nutrition Guru", description: "Log meals for 60 days", tier: "platinum", earned: false, progress: 0, requirement: "60 days of logging" },
  { icon: UtensilsCrossed, title: "Meal Tracker", description: "Log meals for 30 days", tier: "gold", earned: false, progress: 0, requirement: "30 days of logging" },
  { icon: Footprints, title: "Marathon Walker", description: "Walk 1M steps total", tier: "platinum", earned: false, progress: 0, requirement: "1,000,000 total steps" },
  { icon: Footprints, title: "Step Champion", description: "10K steps for 30 days", tier: "gold", earned: false, progress: 0, requirement: "30 days of 10K steps" },
  { icon: Droplets, title: "Hydration Hero", description: "Hit water goal 60 days", tier: "gold", earned: false, progress: 0, requirement: "60 days of water goal" },
  { icon: Droplets, title: "Water Warrior", description: "Hit water goal 14 days", tier: "silver", earned: false, progress: 0, requirement: "14 days of water goal" },
  { icon: Dumbbell, title: "Gym Rat", description: "Log 100 workouts", tier: "platinum", earned: false, progress: 0, requirement: "100 workouts logged" },
  { icon: Target, title: "Calorie Counter", description: "Stay within calorie goal 30 days", tier: "gold", earned: false, progress: 0, requirement: "30 days within goal" },
];

const tierColors: Record<string, { text: string; bg: string; border: string }> = {
  platinum: { text: "text-badge-platinum", bg: "bg-badge-platinum/10", border: "border-badge-platinum/30" },
  gold: { text: "text-badge-gold", bg: "bg-badge-gold/10", border: "border-badge-gold/30" },
  silver: { text: "text-badge-silver", bg: "bg-badge-silver/10", border: "border-badge-silver/30" },
  bronze: { text: "text-badge-bronze", bg: "bg-badge-bronze/10", border: "border-badge-bronze/30" },
};

const Badges = () => {
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
