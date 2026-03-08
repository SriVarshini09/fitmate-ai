import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Square, MapPin, Clock, Flame, TrendingUp, Trophy,
  ChevronRight, Bike, Waves, Footprints, Mountain, Timer, X, Plus, Heart, ThumbsUp, MessageSquare
} from "lucide-react";
import { useCalorieTracker, estimateActivityCalories } from "@/hooks/useCalorieTracker";
import { toast } from "sonner";

type ActivityType = "run" | "ride" | "swim" | "walk" | "hike";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;
  distance: number; // km
  duration: number; // minutes
  calories: number;
  elevation?: number;
  pace?: string;
  heartRateAvg?: number;
  heartRateMax?: number;
  splits?: { km: number; pace: string }[];
  isPR?: boolean;
  kudos: number;
  comments: number;
}

const ACTIVITY_TYPES: { key: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { key: "run", label: "Run", icon: Footprints, color: "bg-primary/15 text-primary" },
  { key: "ride", label: "Ride", icon: Bike, color: "bg-warning/15 text-warning" },
  { key: "swim", label: "Swim", icon: Waves, color: "bg-info/15 text-info" },
  { key: "walk", label: "Walk", icon: Footprints, color: "bg-success/15 text-success" },
  { key: "hike", label: "Hike", icon: Mountain, color: "bg-badge-bronze/15 text-badge-bronze" },
];

const sampleActivities: Activity[] = [];

const personalRecords: { label: string; value: string; date: string; icon: string }[] = [];

const weekStats = { distance: 0, time: "0m", activities: 0, calories: 0, elevation: 0 };

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const Activities = () => {
  const [activities] = useState(sampleActivities);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActivityType | "all">("all");
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerType, setTimerType] = useState<ActivityType>("run");
  const { logBurned, bodyWeight } = useCalorieTracker();

  const filtered = activeFilter === "all" ? activities : activities.filter((a) => a.type === activeFilter);

  // Simple timer logic
  const startTimer = () => {
    setTimerRunning(true);
    setShowTimer(true);
  };

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const stopTimer = () => {
    // Calculate and save calories burned
    const durationMinutes = Math.round(timerSeconds / 60);
    if (durationMinutes > 0) {
      const calories = estimateActivityCalories(timerType, durationMinutes, bodyWeight);
      const typeLabel = ACTIVITY_TYPES.find(a => a.key === timerType)?.label || timerType;
      logBurned({
        source: "activity",
        name: typeLabel,
        calories,
        duration: durationMinutes,
      });
      toast.success(`${typeLabel} complete! ${calories} kcal burned 🔥`);
    }
    setTimerRunning(false);
    setTimerSeconds(0);
    setShowTimer(false);
  };

  // Timer ticking
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Activities</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">Track runs, rides, swims & more</p>
        </div>
        <button onClick={startTimer} className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center glow-primary">
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
        </button>
      </motion.div>

      {/* Week summary */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">This Week</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Distance", value: `${weekStats.distance} km` },
            { label: "Time", value: weekStats.time },
            { label: "Activities", value: weekStats.activities.toString() },
            { label: "Calories", value: weekStats.calories.toString() },
            { label: "Elevation", value: `${weekStats.elevation}m` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-sm font-bold font-display text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground font-body">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRs */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-badge-gold" /> Personal Records
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {personalRecords.map((pr) => (
            <div key={pr.label} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
              <span className="text-lg">{pr.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground font-display">{pr.value}</p>
                <p className="text-[10px] text-muted-foreground font-body">{pr.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap font-body transition-colors ${
            activeFilter === "all" ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
          }`}
        >
          All
        </button>
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveFilter(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap font-body transition-colors ${
              activeFilter === t.key ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity feed */}
      <div className="space-y-3">
        {filtered.map((activity, i) => {
          const typeInfo = ACTIVITY_TYPES.find((t) => t.key === activity.type)!;
          const isExpanded = expandedId === activity.id;

          return (
            <motion.div
              key={activity.id}
              className={`glass-card overflow-hidden ${activity.isPR ? "ring-1 ring-badge-gold/30" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button onClick={() => setExpandedId(isExpanded ? null : activity.id)} className="w-full p-5 text-left">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                    <typeInfo.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold font-display text-foreground truncate">{activity.title}</p>
                      {activity.isPR && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-badge-gold/15 text-badge-gold">PR</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-body">{activity.date}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-sm font-bold font-display text-foreground">{activity.distance}</p>
                    <p className="text-[9px] text-muted-foreground font-body">km</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-sm font-bold font-display text-foreground">{formatDuration(activity.duration)}</p>
                    <p className="text-[9px] text-muted-foreground font-body">time</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-sm font-bold font-display text-foreground">{activity.pace}</p>
                    <p className="text-[9px] text-muted-foreground font-body">pace</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/40">
                    <p className="text-sm font-bold font-display text-foreground">{activity.calories}</p>
                    <p className="text-[9px] text-muted-foreground font-body">kcal</p>
                  </div>
                </div>

                {/* Social */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-body">{activity.kudos}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-body">{activity.comments}</span>
                  </button>
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-5 pb-5 space-y-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {/* Heart rate */}
                    {activity.heartRateAvg && (
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 rounded-xl bg-destructive/10 text-center">
                          <Heart className="w-4 h-4 text-destructive mx-auto mb-1" />
                          <p className="text-sm font-bold font-display text-foreground">{activity.heartRateAvg}</p>
                          <p className="text-[9px] text-muted-foreground font-body">Avg HR</p>
                        </div>
                        <div className="flex-1 p-3 rounded-xl bg-destructive/10 text-center">
                          <Heart className="w-4 h-4 text-destructive mx-auto mb-1" />
                          <p className="text-sm font-bold font-display text-foreground">{activity.heartRateMax}</p>
                          <p className="text-[9px] text-muted-foreground font-body">Max HR</p>
                        </div>
                        {activity.elevation && (
                          <div className="flex-1 p-3 rounded-xl bg-success/10 text-center">
                            <Mountain className="w-4 h-4 text-success mx-auto mb-1" />
                            <p className="text-sm font-bold font-display text-foreground">{activity.elevation}m</p>
                            <p className="text-[9px] text-muted-foreground font-body">Elevation</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Splits */}
                    {activity.splits && (
                      <div>
                        <p className="text-xs text-muted-foreground font-body mb-2">Splits</p>
                        <div className="space-y-1">
                          {activity.splits.map((split) => {
                            const paceNum = split.pace.split(":").reduce((a, b) => a * 60 + parseInt(b), 0);
                            const maxPace = 360; // 6:00
                            const minPace = 300; // 5:00
                            const pct = Math.max(0, Math.min(100, ((maxPace - paceNum) / (maxPace - minPace)) * 100));
                            return (
                              <div key={split.km} className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-body w-8">Km {split.km}</span>
                                <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                                  <motion.div
                                    className="h-full bg-primary/70 rounded flex items-center justify-end pr-1"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(30, pct)}%` }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <span className="text-[9px] font-bold text-primary-foreground font-body">{split.pace}</span>
                                  </motion.div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Live Timer Overlay */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <button onClick={stopTimer} className="absolute top-6 right-6">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>

            <div className="flex gap-2 mb-8">
              {ACTIVITY_TYPES.slice(0, 4).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTimerType(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-body transition-colors ${
                    timerType === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>

            <motion.p
              className="text-6xl font-bold font-display text-foreground mb-2 tabular-nums"
              animate={{ scale: timerRunning ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1, repeat: timerRunning ? Infinity : 0 }}
            >
              {formatTimer(timerSeconds)}
            </motion.p>
            <p className="text-sm text-muted-foreground font-body mb-12 capitalize">{timerType}</p>

            <div className="flex gap-6">
              <button
                onClick={toggleTimer}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-primary-foreground ${
                  timerRunning ? "bg-warning" : "bg-primary glow-primary"
                }`}
              >
                {timerRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              {timerSeconds > 0 && (
                <button onClick={stopTimer} className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center">
                  <Square className="w-7 h-7 text-destructive-foreground" />
                </button>
              )}
            </div>

            {timerRunning && (
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">0.0</p>
                  <p className="text-[10px] text-muted-foreground font-body">km</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">--:--</p>
                  <p className="text-[10px] text-muted-foreground font-body">pace</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-display text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground font-body">kcal</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Activities;
