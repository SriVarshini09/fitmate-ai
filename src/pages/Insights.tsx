import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, UtensilsCrossed, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const tooltipStyle = {
  backgroundColor: "hsl(80, 8%, 14%)",
  border: "1px solid hsl(80, 5%, 24%)",
  borderRadius: 16,
  fontSize: 12,
  color: "hsl(60, 10%, 92%)",
  boxShadow: "0 8px 32px hsl(0, 0%, 0%, 0.3)",
};
const labelStyle = { color: "hsl(60, 10%, 92%)" };
const tickStyle = { fill: "hsl(60, 5%, 55%)", fontSize: 11 };

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const Insights = () => {
  const weeklyCalories = useMemo(() => {
    try {
      const eatenRaw = JSON.parse(localStorage.getItem("vitalflow_eaten") || "{}");
      const burnedRaw: any[] = JSON.parse(localStorage.getItem("vitalflow_burned") || "[]");
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        const consumed = eatenRaw[key] || 0;
        const burned = Array.isArray(burnedRaw)
          ? burnedRaw.filter((e: any) => e.date === key).reduce((s: number, e: any) => s + (e.calories || 0), 0)
          : 0;
        return { day: DAY_LABELS[d.getDay()], consumed, burned };
      });
    } catch { return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { day: DAY_LABELS[d.getDay()], consumed: 0, burned: 0 }; }); }
  }, []);

  const avgCalories = Math.round(weeklyCalories.reduce((s, d) => s + d.consumed, 0) / 7);
  const avgBurned = Math.round(weeklyCalories.reduce((s, d) => s + d.burned, 0) / 7);
  const hasAnyData = weeklyCalories.some(d => d.consumed > 0 || d.burned > 0);

  return (
    <motion.div className="max-w-lg mx-auto px-4 py-6 space-y-5 relative" variants={container} initial="hidden" animate="show">
      <div className="floating-blob w-36 h-36 top-0 right-0 bg-info/20" />
      <div className="floating-blob w-28 h-28 top-80 -left-8 bg-accent/25" />

      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-gradient-primary">Insights</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Your weekly health overview</p>
      </motion.div>

      {/* Quick stats */}
      <motion.div className="grid grid-cols-2 gap-3" variants={item}>
        {[
          { label: "Avg Consumed", value: avgCalories > 0 ? avgCalories : "—", icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10" },
          { label: "Avg Burned", value: avgBurned > 0 ? avgBurned : "—", icon: Flame, color: "text-warning", bg: "bg-warning/10" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center gradient-border">
            <div className={`w-9 h-9 rounded-2xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-body">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Calorie chart */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Calories This Week</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Consumed vs Burned</p>
        {hasAnyData ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCalories} barGap={2}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} cursor={{ fill: "hsl(80, 5%, 20%, 0.5)" }} />
                  <Bar dataKey="consumed" fill="hsl(66, 85%, 50%)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="burned" fill="hsl(45, 85%, 50%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground font-body">Consumed</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent" /><span className="text-[10px] text-muted-foreground font-body">Burned</span></div>
            </div>
          </>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
            <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-body">No data yet</p>
            <p className="text-xs text-muted-foreground/60 font-body">Start logging food and workouts to see your trends</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Insights;
