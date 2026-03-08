import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const badges = [
  { icon: Trophy, label: "Platinum", earned: false, color: "text-badge-platinum", bg: "bg-badge-platinum/10" },
  { icon: Medal, label: "Gold", earned: true, color: "text-badge-gold", bg: "bg-badge-gold/10" },
  { icon: Award, label: "Silver", earned: true, color: "text-badge-silver", bg: "bg-badge-silver/10" },
  { icon: Star, label: "Bronze", earned: true, color: "text-badge-bronze", bg: "bg-badge-bronze/10" },
];

const BadgePreview = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold font-display text-foreground">Your Badges</h3>
        <button
          onClick={() => navigate("/badges")}
          className="text-xs text-primary font-medium font-body hover:underline"
        >
          View All
        </button>
      </div>
      <div className="flex gap-3">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.label}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl ${badge.bg} ${!badge.earned ? "opacity-30" : ""}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          >
            <badge.icon className={`w-6 h-6 ${badge.color}`} />
            <span className="text-[10px] font-medium text-muted-foreground font-body">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BadgePreview;
