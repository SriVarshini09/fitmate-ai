import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Plus, Minus, Bell, Target, User, Check, X, Mic } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import VoiceButton from "@/components/voice/VoiceButton";
import ConfirmationCard from "@/components/voice/ConfirmationCard";
import { VoiceParsedData } from "@/lib/naturalLanguageParser";

const GLASS_ML = 250; // each goal = 250ml (1/4 liter)

interface WaterLog {
  id: string;
  amount: number; // ml
  time: string;
}

const calculateWaterGoal = (weight: number, activityLevel: string, climate: string): number => {
  // Base: 35ml per kg of body weight
  let base = weight * 35;
  // Activity multiplier
  if (activityLevel === "moderate") base *= 1.15;
  if (activityLevel === "active") base *= 1.3;
  if (activityLevel === "very_active") base *= 1.45;
  // Climate
  if (climate === "hot") base *= 1.15;
  if (climate === "humid") base *= 1.1;
  // Round to nearest 250ml
  return Math.round(base / GLASS_ML) * GLASS_ML;
};

function todayISO() { return new Date().toISOString().slice(0, 10); }

function loadProfileDefaults() {
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_onboarding");
    if (!raw) return { weight: 70, activity: "moderate" };
    const d = JSON.parse(raw);
    return { weight: parseFloat(d.weight) || 70, activity: d.activityLevel || "moderate" };
  } catch { return { weight: 70, activity: "moderate" }; }
}

const WaterTracker = () => {
  const { user } = useAuth();
  const voice = useVoiceInput();
  const profileDefaults = loadProfileDefaults();

  const [showSettings, setShowSettings] = useState(false);
  const [weight, setWeight] = useState(profileDefaults.weight);
  const [activityLevel, setActivityLevel] = useState(profileDefaults.activity);
  const [climate, setClimate] = useState("normal");

  const dailyGoalMl = calculateWaterGoal(weight, activityLevel, climate);
  const totalGlasses = Math.round(dailyGoalMl / GLASS_ML);

  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [customAmount, setCustomAmount] = useState(250);

  // Load today's water logs from Supabase
  useEffect(() => {
    if (!user) return;
    supabase.from("water_logs").select("*")
      .eq("user_id", user.id).eq("logged_date", todayISO())
      .order("logged_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setLogs(data.map((r) => ({
            id: r.id,
            amount: r.amount_ml,
            time: new Date(r.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          })));
        }
      });
  }, [user]);

  const totalConsumed = logs.reduce((sum, l) => sum + l.amount, 0);
  const consumedGlasses = Math.floor(totalConsumed / GLASS_ML);
  const progressPct = Math.min(100, (totalConsumed / dailyGoalMl) * 100);
  const remaining = Math.max(0, dailyGoalMl - totalConsumed);

  const addWater = async (ml: number) => {
    const now = new Date();
    const time = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`;
    const tempId = Date.now().toString();
    setLogs((prev) => [...prev, { id: tempId, amount: ml, time }]);
    setShowQuickAdd(false);

    const newTotal = totalConsumed + ml;
    if (newTotal >= dailyGoalMl && totalConsumed < dailyGoalMl) {
      toast.success("🎉 Daily water goal reached!", { description: `You drank ${(newTotal / 1000).toFixed(1)}L today!` });
    } else {
      toast(`💧 +${ml}ml logged`, { description: `${(newTotal / 1000).toFixed(1)}L / ${(dailyGoalMl / 1000).toFixed(1)}L` });
    }

    if (user) {
      const { data } = await supabase.from("water_logs").insert({
        user_id: user.id, amount_ml: ml, logged_date: todayISO(),
      }).select().single();
      if (data) setLogs((prev) => prev.map((l) => l.id === tempId ? { ...l, id: data.id } : l));
    }
  };

  const removeLastLog = async () => {
    if (logs.length === 0) return;
    const last = logs[logs.length - 1];
    setLogs((prev) => prev.slice(0, -1));
    toast("Removed last water entry");
    if (user) await supabase.from("water_logs").delete().eq("id", last.id).eq("user_id", user.id);
  };

  const handleVoiceConfirm = async (data: VoiceParsedData) => {
    voice.confirm();
    if (data.type === "water" && data.waterAmount) {
      await addWater(data.waterAmount);
    }
  };

  const QUICK_AMOUNTS = [
    { label: "1 Glass", ml: 250, emoji: "🥛" },
    { label: "Small Bottle", ml: 500, emoji: "💧" },
    { label: "Large Bottle", ml: 750, emoji: "🍶" },
    { label: "1 Liter", ml: 1000, emoji: "🫗" },
  ];

  const ACTIVITY_OPTIONS = [
    { key: "sedentary", label: "Sedentary", desc: "Desk job, minimal exercise" },
    { key: "moderate", label: "Moderate", desc: "Light exercise 3-4x/week" },
    { key: "active", label: "Active", desc: "Exercise 5-6x/week" },
    { key: "very_active", label: "Very Active", desc: "Intense training daily" },
  ];

  const CLIMATE_OPTIONS = [
    { key: "normal", label: "Temperate", emoji: "🌤️" },
    { key: "hot", label: "Hot", emoji: "☀️" },
    { key: "humid", label: "Humid", emoji: "🌫️" },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-body">Water</p>
            <p className="text-xl font-bold font-display text-foreground">
              {(totalConsumed / 1000).toFixed(1)}L
              <span className="text-sm font-normal text-muted-foreground"> / {(dailyGoalMl / 1000).toFixed(1)}L</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={voice.state === "listening" ? voice.stopListening : voice.startListening}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative ${
              voice.state === "listening" ? "bg-destructive" : "bg-info/15 hover:bg-info/25"
            }`}
          >
            {voice.state === "listening" && (
              <motion.span className="absolute inset-0 rounded-xl bg-destructive/40"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
            )}
            <Mic className={`w-4 h-4 relative z-10 ${voice.state === "listening" ? "text-white" : "text-info"}`} />
          </button>
          <button onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors">
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Progress glasses */}
      <div>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: totalGlasses }).map((_, i) => {
            const filled = i < consumedGlasses;
            const partial = i === consumedGlasses && totalConsumed % GLASS_ML > 0;
            return (
              <motion.div
                key={i}
                className={`w-6 h-8 rounded-md border transition-colors ${
                  filled
                    ? "bg-info border-info/30"
                    : partial
                    ? "bg-info/30 border-info/20"
                    : "bg-secondary border-secondary"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                title={`${GLASS_ML}ml`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-[10px] text-muted-foreground font-body">
            Each block = {GLASS_ML}ml (¼ liter) · {consumedGlasses}/{totalGlasses} glasses
          </p>
          <p className={`text-[10px] font-bold font-body ${progressPct >= 100 ? "text-success" : "text-info"}`}>
            {progressPct >= 100 ? "✓ Goal reached!" : `${remaining}ml to go`}
          </p>
        </div>
      </div>

      {/* Full width progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-info rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Quick add buttons */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div
            className="space-y-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q.ml}
                  onClick={() => addWater(q.ml)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <span className="text-lg">{q.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground font-display">{q.label}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{q.ml}ml</p>
                  </div>
                </button>
              ))}
            </div>
            {/* Custom amount */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/30">
              <button onClick={() => setCustomAmount(Math.max(50, customAmount - 50))}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Minus className="w-3 h-3 text-foreground" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-foreground font-display">{customAmount}ml</p>
                <p className="text-[9px] text-muted-foreground font-body">Custom</p>
              </div>
              <button onClick={() => setCustomAmount(customAmount + 50)}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Plus className="w-3 h-3 text-foreground" />
              </button>
              <button onClick={() => addWater(customAmount)}
                className="px-4 py-2 rounded-lg bg-info text-primary-foreground text-xs font-medium font-body">
                Add
              </button>
            </div>
            {logs.length > 0 && (
              <button onClick={removeLastLog}
                className="text-[10px] text-destructive font-body hover:underline flex items-center gap-1">
                <Minus className="w-3 h-3" /> Undo last entry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's log */}
      {logs.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-1.5">Today's Log</p>
          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-2">
                  <Droplets className="w-3 h-3 text-info" />
                  <span className="text-xs text-foreground font-body">{log.amount}ml</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-body">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="space-y-3 p-3 rounded-xl bg-secondary/20 border border-border"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground font-display">Your Profile</p>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Weight */}
            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-1">Body Weight</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setWeight(Math.max(30, weight - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Minus className="w-3 h-3 text-foreground" />
                </button>
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-foreground font-display">{weight} <span className="text-xs text-muted-foreground">kg</span></p>
                </div>
                <button onClick={() => setWeight(weight + 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Plus className="w-3 h-3 text-foreground" />
                </button>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-1">Activity Level</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setActivityLevel(opt.key)}
                    className={`p-2 rounded-lg text-left transition-colors ${
                      activityLevel === opt.key ? "bg-info/15 ring-1 ring-info/30" : "bg-secondary/50"
                    }`}>
                    <p className={`text-[10px] font-semibold font-display ${activityLevel === opt.key ? "text-info" : "text-foreground"}`}>{opt.label}</p>
                    <p className="text-[8px] text-muted-foreground font-body">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Climate */}
            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-1">Climate</p>
              <div className="flex gap-1.5">
                {CLIMATE_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setClimate(opt.key)}
                    className={`flex-1 p-2 rounded-lg text-center transition-colors ${
                      climate === opt.key ? "bg-info/15 ring-1 ring-info/30" : "bg-secondary/50"
                    }`}>
                    <span className="text-sm">{opt.emoji}</span>
                    <p className={`text-[9px] font-medium font-body ${climate === opt.key ? "text-info" : "text-muted-foreground"}`}>{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated goal */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-info/10">
              <Target className="w-4 h-4 text-info" />
              <div>
                <p className="text-xs font-bold text-foreground font-display">
                  Recommended: {(dailyGoalMl / 1000).toFixed(1)}L / day
                </p>
                <p className="text-[9px] text-muted-foreground font-body">
                  Based on {weight}kg · {activityLevel} · {climate} climate
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder */}
      <div className="flex items-center gap-1.5">
        <Bell className="w-3 h-3 text-muted-foreground" />
        <p className="text-xs text-muted-foreground font-body">Hourly reminders active</p>
      </div>

      {/* Voice interim transcript inside card */}
      <AnimatePresence>
        {voice.state === "listening" && voice.interimTranscript && (
          <motion.div className="px-3 py-2 rounded-xl bg-info/10 border border-info/20"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <p className="text-xs text-info font-body italic">"{voice.interimTranscript}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Confirmation Card */}
      <AnimatePresence>
        {voice.state === "confirming" && voice.parsedData?.type === "water" && (
          <ConfirmationCard
            parsedData={voice.parsedData}
            onConfirm={handleVoiceConfirm}
            onDismiss={voice.dismiss}
            onReRecord={() => { voice.dismiss(); setTimeout(voice.startListening, 200); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaterTracker;
