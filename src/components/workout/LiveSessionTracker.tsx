import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Play, Pause, Square, Footprints, Bike, Waves, Mountain,
  Timer, Dumbbell, Heart, Flame, TrendingUp, MapPin
} from "lucide-react";
import { useCalorieTracker, estimateActivityCalories } from "@/hooks/useCalorieTracker";
import { toast } from "sonner";

export type ActivityType = "running" | "walking" | "cycling" | "swimming" | "hiking" | "intervals" | "strength";

interface ActivityConfig {
  key: ActivityType;
  label: string;
  icon: React.ElementType;
  color: string;
  fields: ("distance" | "pace" | "heartRate" | "laps" | "elevation")[];
  metValue: number; // Metabolic Equivalent of Task
}

const ACTIVITY_CONFIGS: ActivityConfig[] = [
  { key: "running", label: "Running", icon: Footprints, color: "bg-primary/15 text-primary", fields: ["distance", "pace", "heartRate", "elevation"], metValue: 9.8 },
  { key: "walking", label: "Walking", icon: Footprints, color: "bg-success/15 text-success", fields: ["distance", "pace", "heartRate"], metValue: 3.5 },
  { key: "cycling", label: "Cycling", icon: Bike, color: "bg-warning/15 text-warning", fields: ["distance", "pace", "heartRate"], metValue: 7.5 },
  { key: "swimming", label: "Swimming", icon: Waves, color: "bg-info/15 text-info", fields: ["laps", "heartRate"], metValue: 8.0 },
  { key: "hiking", label: "Hiking", icon: Mountain, color: "bg-badge-bronze/15 text-badge-bronze", fields: ["distance", "elevation", "heartRate"], metValue: 6.0 },
  { key: "intervals", label: "Intervals", icon: Timer, color: "bg-destructive/15 text-destructive", fields: ["heartRate"], metValue: 12.0 },
];

interface LiveSessionTrackerProps {
  initialActivity?: ActivityType;
  onClose: () => void;
  onSave: (session: WorkoutSession) => void;
}

export interface WorkoutSession {
  id: string;
  type: ActivityType;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  distance?: number; // km
  pace?: string; // min/km
  heartRate?: number; // avg bpm
  laps?: number;
  elevation?: number; // meters
  calories: number;
  notes?: string;
}

const LiveSessionTracker = ({ initialActivity = "running", onClose, onSave }: LiveSessionTrackerProps) => {
  const { bodyWeight } = useCalorieTracker();
  const [activityType, setActivityType] = useState<ActivityType>(initialActivity);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string>("");
  
  // Activity-specific fields
  const [distance, setDistance] = useState<string>("");
  const [heartRate, setHeartRate] = useState<string>("");
  const [laps, setLaps] = useState<string>("");
  const [elevation, setElevation] = useState<string>("");
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const config = ACTIVITY_CONFIGS.find(c => c.key === activityType) || ACTIVITY_CONFIGS[0];

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Calculate pace (min/km) from distance and time
  const calculatePace = (): string => {
    const dist = parseFloat(distance);
    if (!dist || dist === 0 || seconds === 0) return "--:--";
    const paceMinutes = (seconds / 60) / dist;
    const mins = Math.floor(paceMinutes);
    const secs = Math.round((paceMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate calories using MET formula
  const calculateCalories = (): number => {
    const durationHours = seconds / 3600;
    const weightKg = bodyWeight || 70;
    // Calories = MET × weight(kg) × duration(hours)
    return Math.round(config.metValue * weightKg * durationHours);
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!isRunning && seconds === 0) {
      setStartTime(new Date().toISOString());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (seconds === 0) {
      onClose();
      return;
    }

    const session: WorkoutSession = {
      id: Date.now().toString(),
      type: activityType,
      startTime: startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: seconds,
      distance: distance ? parseFloat(distance) : undefined,
      pace: config.fields.includes("pace") && distance ? calculatePace() : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      laps: laps ? parseInt(laps) : undefined,
      elevation: elevation ? parseInt(elevation) : undefined,
      calories: calculateCalories(),
    };

    onSave(session);
    toast.success(`${config.label} session saved! 🔥`);
    onClose();
  };

  const pace = calculatePace();
  const calories = calculateCalories();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center`}>
            <config.icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">{config.label}</h2>
            <p className="text-xs text-muted-foreground font-body">Live Session</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Timer Display */}
        <motion.div
          className="text-center"
          animate={{ scale: isRunning ? [1, 1.01, 1] : 1 }}
          transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
        >
          <p className="text-sm text-muted-foreground font-body mb-2">Duration</p>
          <p className="text-7xl font-bold font-display text-foreground tabular-nums">
            {formatTime(seconds)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="w-full max-w-md grid grid-cols-2 gap-4">
          {/* Distance */}
          {config.fields.includes("distance") && (
            <div className="glass-card p-4 text-center">
              <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
              <input
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-bold font-display text-foreground text-center outline-none mb-1"
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground font-body">Distance (km)</p>
            </div>
          )}

          {/* Pace */}
          {config.fields.includes("pace") && distance && (
            <div className="glass-card p-4 text-center">
              <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold font-display text-foreground mb-1">{pace}</p>
              <p className="text-xs text-muted-foreground font-body">Pace (min/km)</p>
            </div>
          )}

          {/* Heart Rate */}
          {config.fields.includes("heartRate") && (
            <div className="glass-card p-4 text-center">
              <Heart className="w-4 h-4 text-destructive mx-auto mb-1" />
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="--"
                className="w-full bg-transparent text-2xl font-bold font-display text-foreground text-center outline-none mb-1"
              />
              <p className="text-xs text-muted-foreground font-body">Heart Rate (bpm)</p>
            </div>
          )}

          {/* Calories */}
          <div className="glass-card p-4 text-center">
            <Flame className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold font-display text-foreground mb-1">{calories}</p>
            <p className="text-xs text-muted-foreground font-body">Calories</p>
          </div>

          {/* Laps (Swimming) */}
          {config.fields.includes("laps") && (
            <div className="glass-card p-4 text-center">
              <Waves className="w-4 h-4 text-info mx-auto mb-1" />
              <input
                type="number"
                value={laps}
                onChange={(e) => setLaps(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-2xl font-bold font-display text-foreground text-center outline-none mb-1"
              />
              <p className="text-xs text-muted-foreground font-body">Laps</p>
            </div>
          )}

          {/* Elevation (Hiking) */}
          {config.fields.includes("elevation") && (
            <div className="glass-card p-4 text-center">
              <Mountain className="w-4 h-4 text-badge-bronze mx-auto mb-1" />
              <input
                type="number"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-2xl font-bold font-display text-foreground text-center outline-none mb-1"
              />
              <p className="text-xs text-muted-foreground font-body">Elevation (m)</p>
            </div>
          )}
        </div>

        {/* Activity Type Selector (only when not running) */}
        {!isRunning && seconds === 0 && (
          <div className="w-full max-w-md">
            <p className="text-xs text-muted-foreground font-body mb-2 text-center">Change Activity</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {ACTIVITY_CONFIGS.map((act) => (
                <button
                  key={act.key}
                  onClick={() => setActivityType(act.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors shrink-0 ${
                    activityType === act.key ? act.color : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <act.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium font-body">{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center glow-primary"
            >
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="w-20 h-20 rounded-full bg-warning flex items-center justify-center"
            >
              <Pause className="w-8 h-8 text-warning-foreground" />
            </button>
          )}
          
          {seconds > 0 && (
            <button
              onClick={handleStop}
              className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center"
            >
              <Square className="w-7 h-7 text-destructive-foreground" />
            </button>
          )}
        </div>
        
        {seconds > 0 && (
          <p className="text-center text-xs text-muted-foreground font-body mt-4">
            Tap stop to save your session
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default LiveSessionTracker;
