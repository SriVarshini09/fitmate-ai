import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, Pencil, Check, Smartphone, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStepTracker } from "@/hooks/useStepTracker";
import { useCalorieTracker } from "@/hooks/useCalorieTracker";
import { toast } from "sonner";

const STEPS_KEY = "Cals Crumble Fit_steps";
const ONBOARDING_KEY = "Cals Crumble Fit_onboarding";

function todayISO() { return new Date().toISOString().slice(0, 10); }

function loadStepsGoal(): number {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return 10000;
    const data = JSON.parse(raw);
    return parseInt(data.stepsGoal) || 10000;
  } catch { return 10000; }
}

function loadTodaySteps(): number {
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    if (!raw) return 0;
    const data: Record<string, number> = JSON.parse(raw);
    return data[todayISO()] || 0;
  } catch { return 0; }
}

function saveTodaySteps(steps: number) {
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    data[todayISO()] = steps;
    localStorage.setItem(STEPS_KEY, JSON.stringify(data));
  } catch {}
}

const StepsCard = () => {
  const { user } = useAuth();
  const { bodyWeight, profile } = useCalorieTracker();
  const [goal] = useState(() => loadStepsGoal());
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [showAutoTrack, setShowAutoTrack] = useState(false);
  
  const {
    isSupported,
    hasPermission,
    isTracking,
    steps,
    distance,
    calories,
    startTracking,
    stopTracking,
    updateSteps,
  } = useStepTracker(bodyWeight || 70, profile?.height || 170);
  
  const [localSteps, setLocalSteps] = useState(() => loadTodaySteps());

  // Load today's steps from Supabase
  useEffect(() => {
    if (!user) return;
    supabase.from("steps_logs").select("steps, goal")
      .eq("user_id", user.id).eq("logged_date", todayISO()).single()
      .then(({ data }) => {
        if (data) {
          setLocalSteps(data.steps);
          saveTodaySteps(data.steps);
        }
      });
  }, [user]);
  
  // Use auto-tracked steps if tracking, otherwise use local
  const displaySteps = isTracking ? steps : localSteps;

  const percentage = Math.min((displaySteps / goal) * 100, 100);
  
  const handleToggleAutoTrack = async () => {
    if (isTracking) {
      stopTracking();
      toast.success('Auto-tracking stopped');
    } else {
      const started = await startTracking();
      if (started) {
        toast.success('Auto-tracking enabled! 🚶');
      } else {
        toast.error('Could not enable auto-tracking. Please check permissions.');
      }
    }
  };

  const confirm = async () => {
    const val = parseInt(input);
    if (!isNaN(val) && val >= 0) {
      if (isTracking) {
        updateSteps(val);
      } else {
        setLocalSteps(val);
        saveTodaySteps(val);
      }
      if (user) {
        await supabase.from("steps_logs").upsert({
          user_id: user.id,
          steps: val,
          goal,
          logged_date: todayISO(),
        }, { onConflict: "user_id,logged_date" });
      }
    }
    setEditing(false);
    setInput("");
  };

  return (
    <div className="glass-card p-5 gradient-border relative overflow-hidden">
      <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/8 blur-xl" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center relative">
          <Footprints className="w-5 h-5 text-primary" />
          {isTracking && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Steps</p>
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-0.5">
                <input
                  autoFocus
                  type="number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirm()}
                  placeholder={displaySteps.toString()}
                  className="w-24 bg-secondary/60 text-foreground text-sm font-bold font-display rounded-lg px-2 py-0.5 outline-none border border-primary/40"
                />
                <button onClick={confirm} className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <p className="text-xl font-bold font-display text-foreground">{displaySteps.toLocaleString()}</p>
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(66, 85%, 50%), hsl(66, 90%, 65%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-muted-foreground font-body">{goal.toLocaleString()} goal</p>
        {isSupported && (
          <button
            onClick={handleToggleAutoTrack}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium font-body transition-colors ${
              isTracking ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {isTracking ? <Zap className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
            {isTracking ? 'Auto' : 'Enable Auto'}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepsCard;
