import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Footprints, Bike, Waves, Mountain, Timer, Dumbbell, X } from "lucide-react";
import LiveSessionTracker, { WorkoutSession, ActivityType } from "@/components/workout/LiveSessionTracker";
import { useCalorieTracker } from "@/hooks/useCalorieTracker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ActivityOption {
  key: ActivityType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const QUICK_ACTIVITIES: ActivityOption[] = [
  { key: "running", label: "Run", icon: Footprints, color: "bg-primary/15 text-primary" },
  { key: "walking", label: "Walk", icon: Footprints, color: "bg-success/15 text-success" },
  { key: "cycling", label: "Ride", icon: Bike, color: "bg-warning/15 text-warning" },
  { key: "swimming", label: "Swim", icon: Waves, color: "bg-info/15 text-info" },
];

const WorkoutQuickStart = () => {
  const { user } = useAuth();
  const { logBurned } = useCalorieTracker();
  const [showLiveSession, setShowLiveSession] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>("running");
  const [showPicker, setShowPicker] = useState(false);

  // Get last activity from localStorage
  const getLastActivity = (): ActivityType => {
    try {
      const last = localStorage.getItem("lastWorkoutActivity");
      return (last as ActivityType) || "running";
    } catch {
      return "running";
    }
  };

  const handleQuickStart = (activity: ActivityType) => {
    localStorage.setItem("lastWorkoutActivity", activity);
    setSelectedActivity(activity);
    setShowLiveSession(true);
    setShowPicker(false);
  };

  const handleSaveSession = async (session: WorkoutSession) => {
    // Log calories burned
    logBurned({
      source: "activity",
      name: session.type,
      calories: session.calories,
      duration: Math.round(session.duration / 60),
    });

    // Save to Supabase
    if (user) {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        name: session.type,
        type: "cardio",
        duration_minutes: Math.round(session.duration / 60),
        calories_burned: session.calories,
        distance: session.distance,
        logged_date: new Date().toISOString().slice(0, 10),
      });
    }

    toast.success(`${session.type} session saved! 🔥`);
  };

  const lastActivity = getLastActivity();
  const lastActivityConfig = QUICK_ACTIVITIES.find(a => a.key === lastActivity) || QUICK_ACTIVITIES[0];

  return (
    <>
      <div className="glass-card p-5 gradient-border relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/8 blur-xl" />
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-1">Quick Start</p>
            <h3 className="text-sm font-bold font-display text-foreground">Start Workout</h3>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <Timer className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Last Activity - Larger Button */}
          <button
            onClick={() => handleQuickStart(lastActivity)}
            className={`col-span-2 flex items-center gap-3 p-4 rounded-xl ${lastActivityConfig.color} hover:brightness-110 transition-all`}
          >
            <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
              <lastActivityConfig.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold font-display">Continue {lastActivityConfig.label}</p>
              <p className="text-xs opacity-80 font-body">Last activity</p>
            </div>
            <Play className="w-5 h-5 ml-auto" />
          </button>

          {/* Quick Access Buttons */}
          {QUICK_ACTIVITIES.filter(a => a.key !== lastActivity).slice(0, 2).map((activity) => (
            <button
              key={activity.key}
              onClick={() => handleQuickStart(activity.key)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl ${activity.color} hover:brightness-110 transition-all`}
            >
              <activity.icon className="w-5 h-5" />
              <span className="text-xs font-medium font-body">{activity.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Choose Activity</h2>
                <button onClick={() => setShowPicker(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIVITIES.map((activity) => (
                  <button
                    key={activity.key}
                    onClick={() => handleQuickStart(activity.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl ${activity.color} hover:brightness-110 transition-all`}
                  >
                    <activity.icon className="w-6 h-6" />
                    <span className="text-sm font-medium font-body">{activity.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    handleQuickStart("hiking");
                    setShowPicker(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-badge-bronze/15 text-badge-bronze hover:brightness-110 transition-all"
                >
                  <Mountain className="w-6 h-6" />
                  <span className="text-sm font-medium font-body">Hike</span>
                </button>
                <button
                  onClick={() => {
                    handleQuickStart("intervals");
                    setShowPicker(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-destructive/15 text-destructive hover:brightness-110 transition-all"
                >
                  <Timer className="w-6 h-6" />
                  <span className="text-sm font-medium font-body">Intervals</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Session Tracker */}
      <AnimatePresence>
        {showLiveSession && (
          <LiveSessionTracker
            initialActivity={selectedActivity}
            onClose={() => setShowLiveSession(false)}
            onSave={handleSaveSession}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WorkoutQuickStart;
