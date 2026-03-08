import { motion } from "framer-motion";
import { TrendingDown, Flame, Footprints, UtensilsCrossed, BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

const weeklyCalories = [
  { day: "Mon", consumed: 1850, burned: 420 },
  { day: "Tue", consumed: 2100, burned: 350 },
  { day: "Wed", consumed: 1920, burned: 500 },
  { day: "Thu", consumed: 2200, burned: 380 },
  { day: "Fri", consumed: 1780, burned: 450 },
  { day: "Sat", consumed: 2400, burned: 280 },
  { day: "Sun", consumed: 1950, burned: 320 },
];

const weightTrend = [
  { week: "W1", weight: 80 },
  { week: "W2", weight: 79.5 },
  { week: "W3", weight: 79.2 },
  { week: "W4", weight: 78.6 },
  { week: "W5", weight: 78.1 },
  { week: "W6", weight: 77.5 },
  { week: "W7", weight: 77 },
  { week: "W8", weight: 76 },
];

const stepsTrend = [
  { day: "Mon", steps: 8200 },
  { day: "Tue", steps: 6500 },
  { day: "Wed", steps: 9100 },
  { day: "Thu", steps: 7300 },
  { day: "Fri", steps: 10200 },
  { day: "Sat", steps: 4800 },
  { day: "Sun", steps: 6842 },
];

const insights = [
  { icon: TrendingDown, title: "Weight trending down", desc: "You've lost 4kg in 8 weeks — great progress!", color: "text-primary", bg: "bg-primary/10" },
  { icon: Flame, title: "Calorie consistency", desc: "You stayed within 200 kcal of your goal 5/7 days", color: "text-warning", bg: "bg-warning/10" },
  { icon: ArrowUp, title: "Steps improving", desc: "Your average steps increased 12% this week", color: "text-success", bg: "bg-success/10" },
  { icon: ArrowDown, title: "Weekend dip", desc: "Activity drops ~40% on weekends — try a morning walk", color: "text-info", bg: "bg-info/10" },
];

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
  const avgCalories = Math.round(weeklyCalories.reduce((s, d) => s + d.consumed, 0) / 7);
  const avgBurned = Math.round(weeklyCalories.reduce((s, d) => s + d.burned, 0) / 7);
  const avgSteps = Math.round(stepsTrend.reduce((s, d) => s + d.steps, 0) / 7);

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
      <motion.div className="grid grid-cols-3 gap-3" variants={item}>
        {[
          { label: "Avg Calories", value: avgCalories, icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10" },
          { label: "Avg Burned", value: avgBurned, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Avg Steps", value: avgSteps.toLocaleString(), icon: Footprints, color: "text-success", bg: "bg-success/10" },
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
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCalories} barGap={2}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} cursor={{ fill: "hsl(200, 18%, 91%, 0.5)" }} />
              <Bar dataKey="consumed" fill="hsl(82, 60%, 40%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="burned" fill="hsl(18, 85%, 72%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground font-body">Consumed</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent" /><span className="text-[10px] text-muted-foreground font-body">Burned</span></div>
        </div>
      </motion.div>

      {/* Weight trend */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Weight Trend</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Last 8 weeks</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightTrend}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(82, 60%, 40%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(82, 60%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Area type="monotone" dataKey="weight" stroke="hsl(82, 60%, 40%)" fill="url(#weightGrad)" strokeWidth={2.5} dot={{ fill: "hsl(82, 60%, 40%)", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Steps trend */}
      <motion.div className="glass-card p-5 gradient-border" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Daily Steps</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">This week</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stepsTrend}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} cursor={{ fill: "hsl(200, 18%, 91%, 0.5)" }} />
              <Bar dataKey="steps" fill="hsl(155, 55%, 40%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div className="glass-card p-5" variants={item}>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Smart Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className={`w-9 h-9 rounded-2xl ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                <insight.icon className={`w-4 h-4 ${insight.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground font-body">{insight.title}</p>
                <p className="text-xs text-muted-foreground font-body">{insight.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Insights;
