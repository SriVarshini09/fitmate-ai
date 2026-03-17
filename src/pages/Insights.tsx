import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, UtensilsCrossed, BarChart3, Footprints, Dumbbell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";

const APP = "Cals Crumble Fit";
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

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toISOString().slice(0, 10), day: DAY_LABELS[d.getDay()] };
  });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function EmptyChart({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center text-center gap-2">
      <Icon className="w-7 h-7 text-muted-foreground/30" />
      <p className="text-xs text-muted-foreground/60 font-body">{text}</p>
    </div>
  );
}

const Insights = () => {
  const days = useMemo(() => last7Days(), []);

  const weeklyCalories = useMemo(() => {
    try {
      const eaten = JSON.parse(localStorage.getItem(`${APP}_eaten`) || "{}");
      const burned: any[] = JSON.parse(localStorage.getItem(`${APP}_burned`) || "[]");
      return days.map(({ key, day }) => ({
        day,
        consumed: eaten[key] || 0,
        burned: Array.isArray(burned)
          ? burned.filter((e: any) => e.date === key).reduce((s: number, e: any) => s + (e.calories || 0), 0)
          : 0,
      }));
    } catch { return days.map(({ day }) => ({ day, consumed: 0, burned: 0 })); }
  }, [days]);

  const weeklyMacros = useMemo(() => {
    try {
      const foods: any[] = JSON.parse(localStorage.getItem(`${APP}_foods`) || "[]");
      return days.map(({ key, day }) => {
        const dayFoods = foods.filter((f: any) => f.date === key);
        return {
          day,
          protein: Math.round(dayFoods.reduce((s: number, f: any) => s + (f.protein || 0), 0)),
          carbs: Math.round(dayFoods.reduce((s: number, f: any) => s + (f.carbs || 0), 0)),
          fat: Math.round(dayFoods.reduce((s: number, f: any) => s + (f.fat || 0), 0)),
        };
      });
    } catch { return days.map(({ day }) => ({ day, protein: 0, carbs: 0, fat: 0 })); }
  }, [days]);

  const weeklySteps = useMemo(() => {
    try {
      const stepsData: Record<string, number> = JSON.parse(localStorage.getItem(`${APP}_steps`) || "{}");
      return days.map(({ key, day }) => ({ day, steps: stepsData[key] || 0 }));
    } catch { return days.map(({ day }) => ({ day, steps: 0 })); }
  }, [days]);

  const weeklyWorkouts = useMemo(() => {
    try {
      const workouts: any[] = JSON.parse(localStorage.getItem(`${APP}_workouts`) || "[]");
      return days.map(({ key, day }) => ({
        day,
        count: workouts.filter((w: any) => (w.date || "").startsWith(key)).length,
      }));
    } catch { return days.map(({ day }) => ({ day, count: 0 })); }
  }, [days]);

  const avgCalories = Math.round(weeklyCalories.reduce((s, d) => s + d.consumed, 0) / 7);
  const avgBurned = Math.round(weeklyCalories.reduce((s, d) => s + d.burned, 0) / 7);
  const totalWorkouts = weeklyWorkouts.reduce((s, d) => s + d.count, 0);
  const totalSteps = weeklySteps.reduce((s, d) => s + d.steps, 0);

  const hasCalData = weeklyCalories.some(d => d.consumed > 0 || d.burned > 0);
  const hasMacroData = weeklyMacros.some(d => d.protein > 0 || d.carbs > 0);
  const hasStepsData = weeklySteps.some(d => d.steps > 0);
  const hasWorkoutData = weeklyWorkouts.some(d => d.count > 0);

  return (
    <motion.div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32 relative" variants={container} initial="hidden" animate="show">
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
      <motion.div className="grid grid-cols-4 gap-2" variants={item}>
        {[
          { label: "Avg Cal", value: avgCalories > 0 ? avgCalories : "—", icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10" },
          { label: "Avg Burn", value: avgBurned > 0 ? avgBurned : "—", icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Workouts", value: totalWorkouts || "—", icon: Dumbbell, color: "text-info", bg: "bg-info/10" },
          { label: "K Steps", value: totalSteps > 0 ? (totalSteps / 1000).toFixed(1) + "k" : "—", icon: Footprints, color: "text-success", bg: "bg-success/10" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 text-center">
            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-1.5`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-base font-bold font-display text-foreground leading-tight">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground font-body">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Calories chart */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Calories This Week</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Consumed vs Burned</p>
        {hasCalData ? (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCalories} barGap={2}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} cursor={{ fill: "hsl(80, 5%, 20%, 0.4)" }} />
                  <Bar dataKey="consumed" name="Consumed" fill="hsl(66, 85%, 50%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="burned" name="Burned" fill="hsl(45, 85%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground font-body">Consumed</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent" /><span className="text-[10px] text-muted-foreground font-body">Burned</span></div>
            </div>
          </>
        ) : <EmptyChart icon={UtensilsCrossed} text="Log food to see your calorie trends" />}
      </motion.div>

      {/* Macros chart */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Macros This Week</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Protein, Carbs & Fat (g)</p>
        {hasMacroData ? (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyMacros} barGap={1}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} cursor={{ fill: "hsl(80, 5%, 20%, 0.4)" }} />
                  <Bar dataKey="protein" name="Protein (g)" fill="hsl(82, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbs" name="Carbs (g)" fill="hsl(210, 70%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fat" name="Fat (g)" fill="hsl(18, 85%, 65%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-success" /><span className="text-[10px] text-muted-foreground font-body">Protein</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-info" /><span className="text-[10px] text-muted-foreground font-body">Carbs</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-warning" /><span className="text-[10px] text-muted-foreground font-body">Fat</span></div>
            </div>
          </>
        ) : <EmptyChart icon={UtensilsCrossed} text="Log food to see your macro breakdown" />}
      </motion.div>

      {/* Steps trend */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Steps Trend</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Daily step count</p>
        {hasStepsData ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySteps}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v: any) => [v.toLocaleString(), "Steps"]} />
                <Line type="monotone" dataKey="steps" stroke="hsl(66, 85%, 50%)" strokeWidth={2.5} dot={{ fill: "hsl(66, 85%, 50%)", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart icon={Footprints} text="Log steps daily to see your trend" />}
      </motion.div>

      {/* Workout frequency */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Workout Frequency</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Workouts per day this week</p>
        {hasWorkoutData ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkouts}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v: any) => [v, "Workouts"]} />
                <Bar dataKey="count" name="Workouts" fill="hsl(210, 70%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart icon={Dumbbell} text="Log workouts to see your frequency" />}
      </motion.div>
    </motion.div>
  );
};

export default Insights;
