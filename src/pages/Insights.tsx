import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Flame, Footprints, Droplets, UtensilsCrossed, BarChart3, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, Area, AreaChart } from "recharts";

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
  backgroundColor: "hsl(0, 0%, 100%)",
  border: "1px solid hsl(200, 15%, 86%)",
  borderRadius: 16,
  fontSize: 12,
  boxShadow: "0 4px 20px hsl(220, 25%, 15%, 0.08)",
};
const labelStyle = { color: "hsl(220, 25%, 15%)" };
const tickStyle = { fill: "hsl(220, 10%, 50%)", fontSize: 11 };

const Insights = () => {
  const avgCalories = Math.round(weeklyCalories.reduce((s, d) => s + d.consumed, 0) / 7);
  const avgBurned = Math.round(weeklyCalories.reduce((s, d) => s + d.burned, 0) / 7);
  const avgSteps = Math.round(stepsTrend.reduce((s, d) => s + d.steps, 0) / 7);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Insights</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Your weekly health overview</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Avg Calories", value: avgCalories, unit: "kcal", icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10" },
          { label: "Avg Burned", value: avgBurned, unit: "kcal", icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Avg Steps", value: avgSteps.toLocaleString(), unit: "", icon: Footprints, color: "text-success", bg: "bg-success/10" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-body">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Calorie chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Calories This Week</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Consumed vs Burned</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCalories} barGap={2}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Bar dataKey="consumed" fill="hsl(82, 65%, 42%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="burned" fill="hsl(18, 80%, 70%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-[10px] text-muted-foreground font-body">Consumed</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent" /><span className="text-[10px] text-muted-foreground font-body">Burned</span></div>
        </div>
      </div>

      {/* Weight trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Weight Trend</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Last 8 weeks</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightTrend}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(82, 65%, 42%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(82, 65%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Area type="monotone" dataKey="weight" stroke="hsl(82, 65%, 42%)" fill="url(#weightGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Steps trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-1">Daily Steps</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">This week</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stepsTrend}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Bar dataKey="steps" fill="hsl(150, 55%, 42%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Smart Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-9 h-9 rounded-xl ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                <insight.icon className={`w-4 h-4 ${insight.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground font-body">{insight.title}</p>
                <p className="text-xs text-muted-foreground font-body">{insight.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Insights;
